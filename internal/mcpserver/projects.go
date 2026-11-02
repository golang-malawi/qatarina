package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) listProjects(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projects, err := s.projectService.FindAll(ctx)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(schema.ProjectListResponse{Projects: schema.NewProjectResponseList(projects)})
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
