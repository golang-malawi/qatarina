package mcpserver

import (
	"context"
	"fmt"
	"strings"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/validation"
	"github.com/mark3labs/mcp-go/mcp"
)

func listProjectEnvironmentsTool() mcp.Tool {
	return mcp.NewTool("list_project_environments",
		mcp.WithDescription("List a project's environments, such as development, staging and production, "+
			"with their base URLs. Test plans and test runs are carried out against one of these environments."),
		mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func createProjectEnvironmentTool() mcp.Tool {
	return mcp.NewTool("create_project_environment",
		mcp.WithDescription("Create an environment in a project, such as staging or production. "+
			"Call list_project_environments first: names are unique within a project, and an environment "+
			"whose name already exists is rejected."),
		mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
		mcp.WithString("name", mcp.Required(), mcp.Description("Name of the environment, for example \"staging\".")),
		mcp.WithString("description", mcp.Description("What the environment is used for.")),
		mcp.WithString("base_url", mcp.Description("Absolute URL the environment is reached at, for example \"https://staging.example.com\".")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

func (s *Server) listProjectEnvironments(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := req.RequireInt("project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	if _, err := s.projectService.FindByID(ctx, int64(projectID)); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err)), nil
	}

	environments, err := s.environmentService.FindByProjectID(ctx, int64(projectID))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(environments)
}

func (s *Server) createProjectEnvironment(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := req.RequireInt("project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	request := schema.EnvironmentRequest{
		Name:        strings.TrimSpace(req.GetString("name", "")),
		Description: strings.TrimSpace(req.GetString("description", "")),
		BaseURL:     strings.TrimSpace(req.GetString("base_url", "")),
	}
	if errs := validation.ValidateStruct(request); errs != nil {
		return mcp.NewToolResultError(errs.Error()), nil
	}

	if _, err := s.projectService.FindByID(ctx, int64(projectID)); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err)), nil
	}

	existing, err := s.environmentService.FindByProjectID(ctx, int64(projectID))
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	for _, env := range existing.Environments {
		if strings.EqualFold(env.Name, request.Name) {
			return mcp.NewToolResultError(fmt.Sprintf("project %d already has an environment named %q (id %d)", projectID, env.Name, env.ID)), nil
		}
	}

	environment, err := s.environmentService.Create(ctx, int64(projectID), &request)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to create environment: %v", err)), nil
	}
	return jsonResult(environment)
}
