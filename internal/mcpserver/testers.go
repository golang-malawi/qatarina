package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) listProjectTesters(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := req.RequireInt("project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, err := s.projectService.FindByID(ctx, int64(projectID)); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err)), nil
	}

	testers, err := s.testerService.FindByProjectID(ctx, int64(projectID))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(schema.TesterListResponse{Testers: testers})
}
