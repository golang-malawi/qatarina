package mcpserver

import (
	"context"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/mark3labs/mcp-go/mcp"
)

var resultStates = []string{
	string(dbsqlc.TestRunStatePending),
	string(dbsqlc.TestRunStatePassed),
	string(dbsqlc.TestRunStateFailed),
}

// recordableResults are the results a tester can record. Pending is the state
// before anything is recorded.
var recordableResults = []string{
	string(dbsqlc.TestRunStatePassed),
	string(dbsqlc.TestRunStateFailed),
}

func listTestRunsTool() mcp.Tool {
	opts := []mcp.ToolOption{
		mcp.WithDescription("List a project's test runs, most recently updated first. A test run is one tester's " +
			"result for a test case within a test plan. Narrow it to a test plan, a test case or a result."),
		projectIDParam(),
		mcp.WithNumber("test_plan_id", mcp.Description("Only list runs in this test plan.")),
		mcp.WithString("test_case_id", mcp.Description("Only list runs of this test case.")),
		mcp.WithString("result_state", mcp.Enum(resultStates...), mcp.Description("Only list runs with this result.")),
	}
	opts = append(opts, pageParams()...)
	opts = append(opts,
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
	return mcp.NewTool("list_test_runs", opts...)
}

func listFailedTestRunsTool() mcp.Tool {
	opts := []mcp.ToolOption{
		mcp.WithDescription("List a project's failed test runs, most recent first, with what the tester " +
			"observed. Every failure is listed, including those of test cases that later passed; use " +
			"list_failed_test_cases for the test cases that are failing now."),
		projectIDParam(),
		mcp.WithNumber("test_plan_id", mcp.Description("Only list runs in this test plan.")),
	}
	opts = append(opts, pageParams()...)
	opts = append(opts,
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
	return mcp.NewTool("list_failed_test_runs", opts...)
}

func getTestRunTool() mcp.Tool {
	return mcp.NewTool("get_test_run",
		mcp.WithDescription("Get one test run with every result recorded against it and its comments."),
		mcp.WithString("test_run_id", mcp.Required(), mcp.Description("ID of the test run, as returned by list_test_runs.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func recordTestResultTool() mcp.Tool {
	return mcp.NewTool("record_test_result",
		mcp.WithDescription("Record whether a test case passed or failed in a test plan, as the authenticated "+
			"user, the same way a tester does from their inbox. The test case must be assigned to you in the "+
			"plan (see get_test_plan), the plan must be open and the test case must not be a draft. Describe "+
			"what actually happened in actual_result, especially for failures."),
		mcp.WithNumber("test_plan_id", mcp.Required(), mcp.Description("ID of the test plan, as returned by list_project_test_plans.")),
		mcp.WithString("test_case_id", mcp.Required(), mcp.Description("ID of the test case.")),
		mcp.WithString("result", mcp.Required(), mcp.Enum(recordableResults...)),
		mcp.WithString("actual_result", mcp.Required(), mcp.Description("What actually happened when the test was carried out.")),
		mcp.WithString("expected_result", mcp.Description("What was expected to happen.")),
		mcp.WithString("notes", mcp.Description("Anything else worth knowing, such as the browser or data used.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

func recordTestCommentTool() mcp.Tool {
	return mcp.NewTool("record_test_comment",
		mcp.WithDescription("Comment on a test run, for example to add findings after a result was recorded. "+
			"The comments appear in get_test_run."),
		mcp.WithString("test_run_id", mcp.Required(), mcp.Description("ID of the test run, as returned by list_test_runs or record_test_result.")),
		mcp.WithString("content", mcp.Required(), mcp.Description("The comment. Markdown.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

type testRunListResponse struct {
	TestRuns []schema.TestRunListItem `json:"test_runs"`
	Page     int                      `json:"page"`
	PageSize int                      `json:"page_size"`
	HasMore  bool                     `json:"has_more"`
}

func (s *Server) listTestRuns(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	resultState := req.GetString("result_state", "")
	if resultState != "" && !slices.Contains(resultStates, resultState) {
		return mcp.NewToolResultError(fmt.Sprintf("result_state %q is not one of %s", resultState, strings.Join(resultStates, ", "))), nil
	}
	return s.findTestRuns(ctx, req, resultState)
}

func (s *Server) listFailedTestRuns(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	return s.findTestRuns(ctx, req, string(dbsqlc.TestRunStateFailed))
}

func (s *Server) findTestRuns(ctx context.Context, req mcp.CallToolRequest, resultState string) (*mcp.CallToolResult, error) {
	projectID, testPlanID, errResult := s.projectAndPlanArgs(ctx, req)
	if errResult != nil {
		return errResult, nil
	}
	testCaseID, err := optionalUUID(req, "test_case_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	pageNum, pageSize := page(req)

	// Fetch one more than a page to tell whether another page follows
	runs, err := s.testRunService.FindFiltered(ctx, schema.TestRunFilter{
		ProjectID:   projectID,
		TestPlanID:  testPlanID,
		TestCaseID:  testCaseID,
		ResultState: resultState,
		Limit:       pageSize + 1,
		Offset:      (pageNum - 1) * pageSize,
	})
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	hasMore := len(runs) > pageSize
	if hasMore {
		runs = runs[:pageSize]
	}
	return jsonResult(testRunListResponse{TestRuns: runs, Page: pageNum, PageSize: pageSize, HasMore: hasMore})
}

type testRunDetails struct {
	TestRun  schema.TestRunResponse     `json:"test_run"`
	Results  []schema.TestRunResultItem `json:"results"`
	Comments []schema.TestRunComment    `json:"comments"`
}

func (s *Server) getTestRun(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	testRunID, err := requireUUID(req, "test_run_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	testRun, err := s.testRunService.GetOneTestRun(ctx, testRunID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	results, err := s.testRunService.FindResults(ctx, testRunID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load results for test run %s: %v", testRunID, err)), nil
	}
	comments, err := s.testRunService.ListComments(ctx, testRunID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load comments for test run %s: %v", testRunID, err)), nil
	}
	return jsonResult(testRunDetails{
		TestRun:  schema.NewTestRunResponseFromEntity(testRun),
		Results:  results,
		Comments: comments,
	})
}

func (s *Server) recordTestResult(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	testPlanID, err := requireID(req, "test_plan_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	testCaseID, err := requireUUID(req, "test_case_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	result, err := req.RequireString("result")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if !slices.Contains(recordableResults, result) {
		return mcp.NewToolResultError(fmt.Sprintf("result %q is not one of %s", result, strings.Join(recordableResults, ", "))), nil
	}
	actualResult, err := req.RequireString("actual_result")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if strings.TrimSpace(actualResult) == "" {
		return mcp.NewToolResultError("actual_result must not be empty"), nil
	}

	plan, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	planActive, err := s.testRunService.IsTestPlanActive(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if !planActive || plan.IsLocked {
		return mcp.NewToolResultError(fmt.Sprintf("test plan %d is closed and no longer accepts results", testPlanID)), nil
	}

	// Testers record results for the test cases assigned to them, as in their inbox
	planCase := slices.IndexFunc(plan.TestCases, func(tc schema.TestCaseResponseItem) bool { return tc.ID == testCaseID })
	if planCase < 0 {
		return mcp.NewToolResultError(fmt.Sprintf("test case %s is not in test plan %d", testCaseID, testPlanID)), nil
	}
	if !slices.Contains(plan.TestCases[planCase].AssignedTesterIDs, identity.UserID) {
		return mcp.NewToolResultError(fmt.Sprintf("test case %s is not assigned to you in test plan %d; use assign_test_cases first", testCaseID, testPlanID)), nil
	}
	caseActive, err := s.testRunService.IsTestCaseActive(ctx, testCaseID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if !caseActive {
		return mcp.NewToolResultError(fmt.Sprintf("test case %s is a draft and cannot be tested yet", testCaseID)), nil
	}

	testRun, err := s.testRunService.Create(ctx, &schema.TestRunRequest{
		ProjectID:     plan.ProjectID,
		TestPlanID:    int32(testPlanID),
		TestCaseID:    testCaseID,
		OwnerID:       int32(identity.UserID),
		TestedByID:    int32(identity.UserID),
		AssignedToID:  int32(identity.UserID),
		EnvironmentID: plan.EnvironmentID,
	})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to create test run: %v", err)), nil
	}
	committed, resultID, err := s.testRunService.CommitWithResultID(ctx, &schema.CommitTestRunResult{
		UserID:         identity.UserID,
		TestRunID:      testRun.ID.String(),
		ActualResult:   actualResult,
		ExpectedResult: req.GetString("expected_result", ""),
		Notes:          req.GetString("notes", ""),
		State:          dbsqlc.TestRunState(result),
		TestedOn:       time.Now(),
		EnvironmentID:  plan.EnvironmentID,
	})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to record result: %v", err)), nil
	}
	return jsonResult(schema.CommitTestRunResponse{
		TestRunResponse: schema.NewTestRunResponseFromEntity(committed),
		ResultID:        resultID,
	})
}

func (s *Server) recordTestComment(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	testRunID, err := requireUUID(req, "test_run_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	content, err := req.RequireString("content")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if strings.TrimSpace(content) == "" {
		return mcp.NewToolResultError("content must not be empty"), nil
	}
	if _, err := s.testRunService.GetOneTestRun(ctx, testRunID); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	comment, err := s.testRunService.CreateComment(ctx, testRunID, identity.UserID, content)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	comment.AuthorName = identity.DisplayName
	return jsonResult(comment)
}
