package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/mark3labs/mcp-go/mcp"
)

// recentTestRunsPerCase is how many test runs get_test_case returns.
const recentTestRunsPerCase = 10

func getTestCaseTool() mcp.Tool {
	return mcp.NewTool("get_test_case",
		mcp.WithDescription("Get one test case with its steps and preconditions, and its most recent test runs "+
			"so you can see how it has fared."),
		mcp.WithString("test_case_id", mcp.Required(), mcp.Description("ID of the test case.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func searchTestCasesTool() mcp.Tool {
	opts := []mcp.ToolOption{
		mcp.WithDescription("Find test cases matching a query. Within a project, the code, title, description " +
			"and module are searched. Without a project, the code and title of test cases in every project are searched."),
		mcp.WithString("query", mcp.Required(), mcp.Description("Text to look for.")),
		mcp.WithNumber("project_id", mcp.Description("Only search this project, as returned by list_projects. Recommended.")),
	}
	opts = append(opts, pageParams()...)
	opts = append(opts,
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
	return mcp.NewTool("search_test_cases", opts...)
}

func listUntestedCasesTool() mcp.Tool {
	return mcp.NewTool("list_untested_cases",
		mcp.WithDescription("List a project's test cases that have no recorded result (passed or failed) yet, "+
			"newest first. Give a test plan to list only the plan's test cases without a result in that plan."),
		projectIDParam(),
		mcp.WithNumber("test_plan_id", mcp.Description("Only consider this test plan, as returned by list_project_test_plans.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func listFailedTestCasesTool() mcp.Tool {
	return mcp.NewTool("list_failed_test_cases",
		mcp.WithDescription("List a project's test cases whose most recent result is a failure, with that "+
			"result: who tested it, what happened and when. A test case that failed and later passed is not "+
			"listed. Give a test plan to only consider results recorded in that plan."),
		projectIDParam(),
		mcp.WithNumber("test_plan_id", mcp.Description("Only consider this test plan, as returned by list_project_test_plans.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

type testCaseDetails struct {
	TestCase       schema.TestCaseResponse  `json:"test_case"`
	RecentTestRuns []schema.TestRunListItem `json:"recent_test_runs"`
}

func (s *Server) getTestCase(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	testCaseID, err := requireUUID(req, "test_case_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	testCase, err := s.testCaseService.FindByID(ctx, testCaseID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load test case %s: %v", testCaseID, err)), nil
	}

	runs, err := s.testRunService.FindFiltered(ctx, schema.TestRunFilter{
		ProjectID:  int64(testCase.ProjectID.Int32),
		TestCaseID: testCaseID,
		Limit:      recentTestRunsPerCase,
	})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load test runs for test case %s: %v", testCaseID, err)), nil
	}
	return jsonResult(testCaseDetails{
		TestCase:       schema.NewTestCaseResponse(testCase),
		RecentTestRuns: runs,
	})
}

func (s *Server) searchTestCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	query, err := req.RequireString("query")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	projectID, err := optionalID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	pageNum, pageSize := page(req)

	if projectID != 0 {
		if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
			return errResult, nil
		}
		params := services.TestCaseQueryParams{Page: pageNum, PageSize: pageSize, Search: query}
		testCases, total, err := s.testCaseService.FindAllByProjectIDPaged(ctx, projectID, params)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(schema.TestCaseListResponse{
			TestCases:  schema.NewTestCaseResponseList(testCases),
			Pagination: &schema.Pagination{Total: total, Page: pageNum, PageSize: pageSize},
		})
	}

	testCases, err := s.testCaseService.Search(ctx, query)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	start := min((pageNum-1)*pageSize, len(testCases))
	end := min(start+pageSize, len(testCases))
	return jsonResult(schema.TestCaseListResponse{
		TestCases:  schema.NewTestCaseResponseList(testCases[start:end]),
		Pagination: &schema.Pagination{Total: int64(len(testCases)), Page: pageNum, PageSize: pageSize},
	})
}

type untestedCasesResponse struct {
	Count     int                       `json:"count"`
	TestCases []schema.TestCaseResponse `json:"test_cases"`
}

func (s *Server) listUntestedCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, testPlanID, errResult := s.projectAndPlanArgs(ctx, req)
	if errResult != nil {
		return errResult, nil
	}
	testCases, err := s.testCaseService.FindUntested(ctx, projectID, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(untestedCasesResponse{
		Count:     len(testCases),
		TestCases: schema.NewTestCaseResponseList(testCases),
	})
}

type failedTestCasesResponse struct {
	Count     int                     `json:"count"`
	TestCases []schema.FailedTestCase `json:"test_cases"`
}

func (s *Server) listFailedTestCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, testPlanID, errResult := s.projectAndPlanArgs(ctx, req)
	if errResult != nil {
		return errResult, nil
	}
	testCases, err := s.testCaseService.FindLatestFailed(ctx, projectID, testPlanID)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(failedTestCasesResponse{Count: len(testCases), TestCases: testCases})
}

// projectAndPlanArgs reads project_id and an optional test_plan_id, checking the
// plan belongs to the project. A test plan ID of 0 means none was given.
func (s *Server) projectAndPlanArgs(ctx context.Context, req mcp.CallToolRequest) (int64, int64, *mcp.CallToolResult) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return 0, 0, mcp.NewToolResultError(err.Error())
	}
	if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
		return 0, 0, errResult
	}
	testPlanID, err := optionalID(req, "test_plan_id")
	if err != nil {
		return 0, 0, mcp.NewToolResultError(err.Error())
	}
	if testPlanID != 0 {
		plan, err := s.testPlanService.GetOneTestPlan(ctx, testPlanID)
		if err != nil {
			return 0, 0, mcp.NewToolResultError(err.Error())
		}
		if int64(plan.ProjectID) != projectID {
			return 0, 0, mcp.NewToolResultError(fmt.Sprintf("test plan %d belongs to project %d, not project %d", testPlanID, plan.ProjectID, projectID))
		}
	}
	return projectID, testPlanID, nil
}
