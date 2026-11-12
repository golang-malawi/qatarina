package mcpserver

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
)

func listModulesTool() mcp.Tool {
	return mcp.NewTool("list_modules",
		mcp.WithDescription("List a project's modules, the features or areas its test cases are grouped under. "+
			"Modules can be nested: parent_module_id is the module a module sits under, or 0 for a top-level module. "+
			"Use a module's name as feature_or_module when adding test cases."),
		projectIDParam(),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

type moduleItem struct {
	ID             int32  `json:"id"`
	ProjectID      int32  `json:"project_id"`
	ParentModuleID int32  `json:"parent_module_id"`
	Name           string `json:"name"`
	Code           string `json:"code"`
	Type           string `json:"type"`
	Priority       int32  `json:"priority"`
	Description    string `json:"description"`
}

type moduleListResponse struct {
	Modules []moduleItem `json:"modules"`
}

func (s *Server) listModules(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
		return errResult, nil
	}

	modules, err := s.moduleService.GetProjectModules(ctx, int32(projectID))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	items := make([]moduleItem, 0, len(modules))
	for _, m := range modules {
		items = append(items, moduleItem{
			ID:             m.ID,
			ProjectID:      m.ProjectID,
			ParentModuleID: m.ParentModuleID.Int32,
			Name:           m.Name,
			Code:           m.Code,
			Type:           m.Type,
			Priority:       m.Priority,
			Description:    m.Description,
		})
	}
	return jsonResult(moduleListResponse{Modules: items})
}
