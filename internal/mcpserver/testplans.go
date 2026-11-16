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

func getTestPlanTool() mcp.Tool {
	return mcp.NewTool("get_test_plan",
		mcp.WithDescription("Get one test plan with its progress, the test cases assigned in it (with their "+
			"urgency and the IDs of the testers they are assigned to) and its comments."),
		mcp.WithNumber("test_plan_id", mcp.Required(), mcp.Description("ID of the test plan, as returned by list_project_test_plans.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func searchTestPlansTool() mcp.Tool {
	return mcp.NewTool("search_test_plans",
		mcp.WithDescription("Find a project's test plans whose description or kind contains the query, ignoring case."),
		projectIDParam(),
		mcp.WithString("query", mcp.Required(), mcp.Description("Text to look for.")),
		mcp.WithString("status", mcp.Enum("open", "closed", "all"),
			mcp.Description("open: plans that can still be worked on. closed: complete or locked plans. Defaults to all.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func addTestPlanTool() mcp.Tool {
	return mcp.NewTool("add_test_plan",
		mcp.WithDescription("Create a test plan in a project: a round of testing carried out between two dates, "+
			"optionally against one of the project's environments. Use assign_test_cases afterwards to assign "+
			"test cases to testers within the plan."),
		projectIDParam(),
		mcp.WithString("description", mcp.Required(), mcp.Description("What the plan covers, for example \"Release 2.4 regression\".")),
		mcp.WithString("kind", mcp.Enum(testKinds...), mcp.Description("Kind of testing. Defaults to general.")),
		mcp.WithString("start_at", mcp.Required(), mcp.Description("When testing starts, as a date (2006-01-02) or date-time (2006-01-02T15:04:05Z).")),
		mcp.WithString("scheduled_end_at", mcp.Required(), mcp.Description("When testing is due to finish, as a date or date-time. Not before start_at.")),
		mcp.WithNumber("environment_id", mcp.Description("Environment the plan is tested against, as returned by list_project_environments.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

func updateTestPlanTool() mcp.Tool {
	return mcp.NewTool("update_test_plan",
		mcp.WithDescription("Change a test plan's description, kind, dates or environment. Only the fields "+
			"given are changed. The plan's assignments, results and status are kept. Complete or locked plans "+
			"cannot be changed."),
		mcp.WithNumber("test_plan_id", mcp.Required(), mcp.Description("ID of the test plan, as returned by list_project_test_plans.")),
		mcp.WithString("description", mcp.Description("What the plan covers.")),
		mcp.WithString("kind", mcp.Enum(testKinds...), mcp.Description("Kind of testing.")),
		mcp.WithString("start_at", mcp.Description("When testing starts, as a date (2006-01-02) or date-time (2006-01-02T15:04:05Z).")),
		mcp.WithString("scheduled_end_at", mcp.Description("When testing is due to finish, as a date or date-time.")),
		mcp.WithNumber("environment_id", mcp.Description("Environment the plan is tested against, as returned by list_project_environments.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(true),
	)
}

func addTestPlanCommentTool() mcp.Tool {
	return mcp.NewTool("add_test_plan_comment",
		mcp.WithDescription("Comment on a test plan, for example to report progress or a problem found while "+
			"testing. Give parent_comment_id to reply to an existing comment from get_test_plan."),
		mcp.WithNumber("test_plan_id", mcp.Required(), mcp.Description("ID of the test plan, as returned by list_project_test_plans.")),
		mcp.WithString("content", mcp.Required(), mcp.Description("The comment. Markdown.")),
		mcp.WithString("parent_comment_id", mcp.Description("ID of the comment to reply to.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

func (s *Server) listProjectTestPlans(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := req.RequireInt("project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, err := s.projectService.FindByID(ctx, int64(projectID)); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err)), nil
	}

	testPlans, err := s.testPlanService.FindAllByProjectID(ctx, int64(projectID))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if testPlans == nil {
		testPlans = []schema.TestPlanResponseItem{}
	}
	return jsonResult(schema.TestPlanListResponse{TestPlans: testPlans})
}

type testPlanDetails struct {
	TestPlan schema.TestPlanResponseItem  `json:"test_plan"`
	Comments []schema.CommentResponseItem `json:"comments"`
}

func (s *Server) getTestPlan(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	testPlanID, err := requireID(req, "test_plan_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	plan, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	comments, err := s.testPlanService.ListComments(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load comments for test plan %d: %v", testPlanID, err)), nil
	}
	if comments == nil {
		comments = []schema.CommentResponseItem{}
	}
	return jsonResult(testPlanDetails{TestPlan: *plan, Comments: comments})
}

func (s *Server) searchTestPlans(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	query, err := req.RequireString("query")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	status := req.GetString("status", "all")
	if !slices.Contains([]string{"open", "closed", "all"}, status) {
		return mcp.NewToolResultError(fmt.Sprintf("status %q is not one of open, closed, all", status)), nil
	}
	if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
		return errResult, nil
	}

	testPlans, err := s.testPlanService.FindAllByProjectID(ctx, projectID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	matches := []schema.TestPlanResponseItem{}
	for _, plan := range testPlans {
		closed := plan.IsComplete || plan.IsLocked
		if (status == "open" && closed) || (status == "closed" && !closed) {
			continue
		}
		if matchesAny(query, plan.Description, plan.Kind) {
			matches = append(matches, plan)
		}
	}
	return jsonResult(schema.TestPlanListResponse{TestPlans: matches})
}

func (s *Server) addTestPlan(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	description, err := req.RequireString("description")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	description = strings.TrimSpace(description)
	if description == "" {
		return mcp.NewToolResultError("description must not be empty"), nil
	}
	kind := strings.TrimSpace(req.GetString("kind", string(dbsqlc.TestKindGeneral)))
	if !slices.Contains(testKinds, kind) {
		return mcp.NewToolResultError(fmt.Sprintf("kind %q is not one of %s", kind, strings.Join(testKinds, ", "))), nil
	}
	startAt, err := optionalTime(req, "start_at")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	endAt, err := optionalTime(req, "scheduled_end_at")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if startAt == nil || endAt == nil {
		return mcp.NewToolResultError("start_at and scheduled_end_at are required"), nil
	}
	if endAt.Before(*startAt) {
		return mcp.NewToolResultError("scheduled_end_at must not be before start_at"), nil
	}
	environmentID, err := optionalID(req, "environment_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
		return errResult, nil
	}
	if errResult := s.checkEnvironment(ctx, projectID, environmentID); errResult != nil {
		return errResult, nil
	}

	created, err := s.testPlanService.Create(ctx, &schema.CreateTestPlan{
		ProjectID:      projectID,
		Kind:           kind,
		Description:    description,
		StartAt:        *startAt,
		ScheduledEndAt: *endAt,
		EnvironmentID:  environmentID,
		AssignedToID:   identity.UserID,
		CreatedByID:    identity.UserID,
		UpdatedByID:    identity.UserID,
	})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to create test plan: %v", err)), nil
	}
	plan, err := s.testPlanService.GetOneTestPlan(ctx, created.ID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(plan)
}

func (s *Server) updateTestPlan(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	testPlanID, err := requireID(req, "test_plan_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	plan, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if plan.IsComplete || plan.IsLocked {
		return mcp.NewToolResultError(fmt.Sprintf("test plan %d is complete or locked and cannot be changed", testPlanID)), nil
	}

	request := schema.UpdateTestPlanDetails{ID: testPlanID, UpdatedByID: identity.UserID}
	if v := optionalString(req, "description"); v != nil {
		description := strings.TrimSpace(*v)
		if description == "" {
			return mcp.NewToolResultError("description must not be empty"), nil
		}
		request.Description = &description
	}
	if v := optionalString(req, "kind"); v != nil {
		kind := strings.TrimSpace(*v)
		if !slices.Contains(testKinds, kind) {
			return mcp.NewToolResultError(fmt.Sprintf("kind %q is not one of %s", kind, strings.Join(testKinds, ", "))), nil
		}
		request.Kind = &kind
	}
	if request.StartAt, err = optionalTime(req, "start_at"); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if request.ScheduledEndAt, err = optionalTime(req, "scheduled_end_at"); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, ok := req.GetArguments()["environment_id"]; ok {
		environmentID, err := requireID(req, "environment_id")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		if errResult := s.checkEnvironment(ctx, int64(plan.ProjectID), environmentID); errResult != nil {
			return errResult, nil
		}
		request.EnvironmentID = &environmentID
	}

	// Check the dates against each other, using the current value of any not given
	startAt, endAt := request.StartAt, request.ScheduledEndAt
	if startAt == nil {
		startAt = parsePlanTime(plan.StartAt)
	}
	if endAt == nil {
		endAt = parsePlanTime(plan.ScheduledEndAt)
	}
	if startAt != nil && endAt != nil && endAt.Before(*startAt) {
		return mcp.NewToolResultError("scheduled_end_at must not be before start_at"), nil
	}

	if err := s.testPlanService.UpdateDetails(ctx, request); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	updated, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(updated)
}

func (s *Server) addTestPlanComment(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	testPlanID, err := requireID(req, "test_plan_id")
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
	parentCommentID, err := optionalUUID(req, "parent_comment_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	request := &schema.CreateComment{
		TestPlanID: testPlanID,
		UserID:     identity.UserID,
		Content:    content,
	}
	if parentCommentID != "" {
		request.ParentCommentID = &parentCommentID
	}
	comment, err := s.testPlanService.CreateComment(ctx, request)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to add comment: %v", err)), nil
	}
	comment.UserName = identity.DisplayName
	return jsonResult(comment)
}

// checkEnvironment checks an environment belongs to the project. An ID of 0 means none.
func (s *Server) checkEnvironment(ctx context.Context, projectID, environmentID int64) *mcp.CallToolResult {
	if environmentID == 0 {
		return nil
	}
	environments, err := s.environmentService.FindByProjectID(ctx, projectID)
	if err != nil {
		return mcp.NewToolResultError(err.Error())
	}
	for _, env := range environments.Environments {
		if int64(env.ID) == environmentID {
			return nil
		}
	}
	return mcp.NewToolResultError(fmt.Sprintf("environment %d is not in project %d; see list_project_environments", environmentID, projectID))
}

// parsePlanTime reads a date as formatted in schema.TestPlanResponseItem.
func parsePlanTime(value string) *time.Time {
	t, err := time.Parse(time.DateTime, value)
	if err != nil {
		return nil
	}
	return &t
}
