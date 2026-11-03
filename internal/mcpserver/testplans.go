package mcpserver

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/mark3labs/mcp-go/mcp"
)

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
