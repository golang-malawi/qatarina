package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/mark3labs/mcp-go/mcp"
)

func getProjectTool() mcp.Tool {
	return mcp.NewTool("get_project",
		mcp.WithDescription("Get one project's details, with a summary of its test cases and their results."),
		projectIDParam(),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func searchProjectsTool() mcp.Tool {
	return mcp.NewTool("search_projects",
		mcp.WithDescription("Find projects whose title, code or description contains the query, ignoring case."),
		mcp.WithString("query", mcp.Required(), mcp.Description("Text to look for.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func (s *Server) listProjects(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projects, err := s.projectService.FindAll(ctx)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(schema.ProjectListResponse{Projects: schema.NewProjectResponseList(projects)})
}

type projectDetails struct {
	schema.ProjectResponse
	TestCaseSummary *schema.ProjectTestCaseSummaryResponse `json:"test_case_summary"`
}

func (s *Server) getProject(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	project, errResult := s.loadProject(ctx, projectID)
	if errResult != nil {
		return errResult, nil
	}
	summary, err := s.testCaseService.GetSummary(ctx, projectID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to summarise test cases for project %d: %v", projectID, err)), nil
	}
	return jsonResult(projectDetails{
		ProjectResponse: schema.NewProjectResponse(project, nil),
		TestCaseSummary: summary,
	})
}

func (s *Server) searchProjects(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	query, err := req.RequireString("query")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	projects, err := s.projectService.FindAll(ctx)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	matches := []schema.ProjectResponse{}
	for _, project := range schema.NewProjectResponseList(projects) {
		if matchesAny(query, project.Title, project.Code, project.Description) {
			matches = append(matches, project)
		}
	}
	return jsonResult(schema.ProjectListResponse{Projects: matches})
}

func (s *Server) listProjectTestCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := req.RequireInt("project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, err := s.projectService.FindByID(ctx, int64(projectID)); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err)), nil
	}

	params := services.TestCaseQueryParams{
		Page:     req.GetInt("page", 1),
		PageSize: req.GetInt("page_size", 10),
		Search:   req.GetString("search", ""),
	}
	testCases, total, err := s.testCaseService.FindAllByProjectIDPaged(ctx, int64(projectID), params)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(schema.TestCaseListResponse{
		TestCases: schema.NewTestCaseResponseList(testCases),
		Pagination: &schema.Pagination{
			Total:    total,
			Page:     params.Page,
			PageSize: params.PageSize,
		},
	})
}
