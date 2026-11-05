package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/validation"
	"github.com/google/uuid"
	"github.com/mark3labs/mcp-go/mcp"
)

// maxAssignmentsPerBatch matches the limit on schema.AssignTestsToPlanRequest.
const maxAssignmentsPerBatch = 100

func assignTestCasesTool() mcp.Tool {
	return mcp.NewTool("assign_test_cases",
		mcp.WithDescription(
			"Assign test cases to testers within a test plan. Assigned test cases appear in each tester's inbox. "+
				"Call list_project_test_plans, list_project_test_cases and list_project_testers first to find the "+
				"IDs; the plan must be open, and every test case and tester must belong to the plan's project. "+
				"A test case can be assigned to several testers, and assigning one that is already assigned to the "+
				"same tester has no effect. The batch is validated as a whole before anything is assigned."),
		mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
		mcp.WithNumber("test_plan_id", mcp.Required(), mcp.Description("ID of the test plan, as returned by list_project_test_plans.")),
		mcp.WithArray("planned_tests",
			mcp.Required(),
			mcp.MinItems(1),
			mcp.MaxItems(maxAssignmentsPerBatch),
			mcp.Description(fmt.Sprintf("The test cases to assign, at most %d.", maxAssignmentsPerBatch)),
			mcp.Items(map[string]any{
				"type": "object",
				"properties": map[string]any{
					"test_case_id": map[string]any{"type": "string", "description": "ID of the test case, as returned by list_project_test_cases."},
					"user_ids": map[string]any{
						"type":        "array",
						"minItems":    1,
						"items":       map[string]any{"type": "integer"},
						"description": "User IDs of the testers to assign, as returned by list_project_testers.",
					},
					"urgency": map[string]any{
						"type":        "string",
						"enum":        priorities,
						"description": "Urgency within the plan. Keeps the existing urgency when omitted, otherwise defaults to medium.",
					},
				},
				"required": []string{"test_case_id", "user_ids"},
			}),
		),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(true),
	)
}

type assignedTester struct {
	UserID int64  `json:"user_id"`
	Name   string `json:"name"`
}

type assignedTestCase struct {
	TestCaseID string           `json:"test_case_id"`
	Code       string           `json:"code"`
	Title      string           `json:"title"`
	Urgency    string           `json:"urgency,omitempty"`
	Testers    []assignedTester `json:"testers"`
}

type assignTestCasesResponse struct {
	TestPlanID int64              `json:"test_plan_id"`
	Assigned   []assignedTestCase `json:"assigned"`
}

func (s *Server) assignTestCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var request schema.AssignTestsToPlanRequest
	if err := req.BindArguments(&request); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid arguments: %v", err)), nil
	}
	if errs := validation.ValidateStruct(request); errs != nil {
		return mcp.NewToolResultError(errs.Error()), nil
	}

	testPlan, err := s.testPlanService.GetOneTestPlan(ctx, request.PlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if int64(testPlan.ProjectID) != request.ProjectID {
		return mcp.NewToolResultError(fmt.Sprintf("test plan %d belongs to project %d, not project %d", request.PlanID, testPlan.ProjectID, request.ProjectID)), nil
	}
	if testPlan.IsComplete || testPlan.IsLocked {
		return mcp.NewToolResultError(fmt.Sprintf("test plan %d is complete or locked and cannot receive new assignments", request.PlanID)), nil
	}

	testCases, err := s.testCaseService.FindAllByProjectID(ctx, request.ProjectID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load test cases for project %d: %v", request.ProjectID, err)), nil
	}
	projectTestCases := make(map[uuid.UUID]dbsqlc.TestCase, len(testCases))
	for _, tc := range testCases {
		projectTestCases[tc.ID] = tc
	}

	testers, err := s.testerService.FindByProjectID(ctx, request.ProjectID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	projectTesters := make(map[int64]schema.Tester, len(testers))
	for _, t := range testers {
		projectTesters[t.UserID] = t
	}

	// Validate every assignment before writing any, so a bad ID does not leave
	// the plan half assigned
	assigned := make([]assignedTestCase, 0, len(request.PlannedTests))
	for i, pt := range request.PlannedTests {
		tcID, err := uuid.Parse(pt.TestCaseID)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("planned_tests[%d]: invalid test_case_id %q", i, pt.TestCaseID)), nil
		}
		tc, ok := projectTestCases[tcID]
		if !ok {
			return mcp.NewToolResultError(fmt.Sprintf("planned_tests[%d]: test case %s is not in project %d", i, pt.TestCaseID, request.ProjectID)), nil
		}
		if len(pt.UserIDs) == 0 {
			return mcp.NewToolResultError(fmt.Sprintf("planned_tests[%d] (%s): user_ids must not be empty", i, tc.Code)), nil
		}

		item := assignedTestCase{TestCaseID: tc.ID.String(), Code: tc.Code, Title: tc.Title, Urgency: pt.Urgency}
		for _, userID := range pt.UserIDs {
			tester, ok := projectTesters[userID]
			if !ok {
				return mcp.NewToolResultError(fmt.Sprintf("planned_tests[%d] (%s): user %d is not a tester on project %d", i, tc.Code, userID, request.ProjectID)), nil
			}
			item.Testers = append(item.Testers, assignedTester{UserID: tester.UserID, Name: tester.Name})
		}
		assigned = append(assigned, item)
	}

	if _, err := s.testPlanService.AddTestCaseToPlan(ctx, &request); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to assign test cases: %v", err)), nil
	}
	return jsonResult(assignTestCasesResponse{TestPlanID: request.PlanID, Assigned: assigned})
}
