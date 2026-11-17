// Package mcpserver exposes QATARINA as an MCP server. Tools call the internal
// services directly (no REST round trips) so they can be shaped for agentic
// workflows rather than mirroring the HTTP API.
package mcpserver

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/internal/version"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type Server struct {
	config *config.Config
	logger logging.Logger
	mcp    *server.MCPServer

	authService     services.AuthService
	userService     services.UserService
	projectService  services.ProjectService
	testCaseService services.TestCaseService
	testPlanService services.TestPlanService
	testerService   services.TesterService
	testRunService  services.TestRunService
	moduleService   services.ModuleService
	documentService services.DocumentService

	environmentService services.EnvironmentService
}

func New(cfg *config.Config, logger logging.Logger) *Server {
	rawDB := cfg.OpenDB()
	dbConn := dbsqlc.New(rawDB)
	moduleService := services.NewModuleService(dbConn, cfg.Platform.GetMaxModuleDepth())

	s := &Server{
		config:          cfg,
		logger:          logger,
		authService:     services.NewAuthService(&cfg.Auth, dbConn, logger),
		userService:     services.NewUserService(dbConn, logger, cfg.SMTP),
		projectService:  services.NewProjectService(dbConn, logger, moduleService),
		testCaseService: services.NewTestCaseService(rawDB.DB, dbConn, logger),
		testPlanService: services.NewTestPlanService(dbConn, logger),
		testerService:   services.NewTesterService(dbConn, logger),
		// No tool uploads or reads files, so the services get no storage backend
		testRunService:  services.NewTestRunService(rawDB.DB, dbConn, logger, nil, cfg.Attachments.GetMaxFileSize()),
		moduleService:   moduleService,
		documentService: services.NewDocumentService(dbConn, logger, nil, cfg.Attachments.GetMaxFileSize()),

		environmentService: services.NewEnvironmentService(dbConn),
		mcp: server.NewMCPServer(
			"qatarina",
			version.Version,
			server.WithToolCapabilities(false),
			server.WithInstructions("Tools for the QATARINA test management platform."),
		),
	}
	s.registerTools()
	return s
}

// ServeHTTP serves the MCP streamable HTTP transport on addr at path. Every
// request must carry a QATARINA JWT as "Authorization: Bearer <token>".
func (s *Server) ServeHTTP(addr, path string) error {
	mux := http.NewServeMux()
	mux.Handle(path, s.requireAuthentication(server.NewStreamableHTTPServer(s.mcp)))
	s.logger.Info("mcp", "Starting MCP server", "transport", config.MCPTransportHTTP, "address", addr, "path", path)
	return http.ListenAndServe(addr, mux)
}

// ServeStdio serves the MCP stdio transport. There are no request headers on
// stdio, so the server signs in once with the given credentials and runs every
// tool call as that user.
func (s *Server) ServeStdio(email, password string) error {
	identity, err := s.signIn(email, password)
	if err != nil {
		return err
	}
	s.logger.Info("mcp", "Starting MCP server", "transport", config.MCPTransportStdio, "userID", identity.UserID)
	return server.ServeStdio(s.mcp, server.WithStdioContextFunc(func(ctx context.Context) context.Context {
		return withIdentity(ctx, identity)
	}))
}

func (s *Server) registerTools() {
	s.mcp.AddTool(
		mcp.NewTool("whoami",
			mcp.WithDescription("Return the authenticated QATARINA user's profile."),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.whoami,
	)

	s.mcp.AddTool(
		mcp.NewTool("list_users",
			mcp.WithDescription("List all users on the QATARINA platform."),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.listUsers,
	)

	s.mcp.AddTool(
		mcp.NewTool("list_projects",
			mcp.WithDescription("List all projects on the QATARINA platform."),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.listProjects,
	)

	s.mcp.AddTool(
		mcp.NewTool("list_project_test_cases",
			mcp.WithDescription("List a project's test cases, newest first, one page at a time."),
			mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
			mcp.WithNumber("page", mcp.Description("Page number, starting at 1. Defaults to 1.")),
			mcp.WithNumber("page_size", mcp.Description("Test cases per page, at most 100. Defaults to 10.")),
			mcp.WithString("search", mcp.Description("Only return test cases whose code, title, description or module matches this text.")),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.listProjectTestCases,
	)

	s.mcp.AddTool(
		mcp.NewTool("list_project_test_plans",
			mcp.WithDescription("List a project's test plans with their progress. Test cases are assigned to testers "+
				"within a test plan, so use this to find the plan to assign work in. Plans that are complete or locked "+
				"should not receive new assignments."),
			mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.listProjectTestPlans,
	)

	s.mcp.AddTool(
		mcp.NewTool("list_project_testers",
			mcp.WithDescription("List the testers assigned to a project, with their roles. Use their user IDs to assign test cases."),
			mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		s.listProjectTesters,
	)

	s.mcp.AddTool(addTestCasesTool(), s.addTestCases)
	s.mcp.AddTool(assignTestCasesTool(), s.assignTestCases)
	s.mcp.AddTool(listProjectEnvironmentsTool(), s.listProjectEnvironments)
	s.mcp.AddTool(createProjectEnvironmentTool(), s.createProjectEnvironment)

	// Projects
	s.mcp.AddTool(getProjectTool(), s.getProject)
	s.mcp.AddTool(searchProjectsTool(), s.searchProjects)
	s.mcp.AddTool(listModulesTool(), s.listModules)
	s.mcp.AddTool(projectListDocumentsTool(), s.projectListDocuments)
	s.mcp.AddTool(projectSearchDocumentsTool(), s.projectSearchDocuments)

	// Test cases
	s.mcp.AddTool(getTestCaseTool(), s.getTestCase)
	s.mcp.AddTool(searchTestCasesTool(), s.searchTestCases)
	s.mcp.AddTool(listUntestedCasesTool(), s.listUntestedCases)
	s.mcp.AddTool(listFailedTestCasesTool(), s.listFailedTestCases)
	s.mcp.AddTool(addTestCaseTool(), s.addTestCase)
	s.mcp.AddTool(updateTestCaseTool(), s.updateTestCase)

	// Test plans
	s.mcp.AddTool(getTestPlanTool(), s.getTestPlan)
	s.mcp.AddTool(searchTestPlansTool(), s.searchTestPlans)
	s.mcp.AddTool(addTestPlanTool(), s.addTestPlan)
	s.mcp.AddTool(updateTestPlanTool(), s.updateTestPlan)
	s.mcp.AddTool(addTestPlanCommentTool(), s.addTestPlanComment)

	// Test runs
	s.mcp.AddTool(listTestRunsTool(), s.listTestRuns)
	s.mcp.AddTool(getTestRunTool(), s.getTestRun)
	s.mcp.AddTool(listFailedTestRunsTool(), s.listFailedTestRuns)
	s.mcp.AddTool(recordTestResultTool(), s.recordTestResult)
	s.mcp.AddTool(recordTestCommentTool(), s.recordTestComment)
}

func (s *Server) whoami(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}
	user, err := s.userService.GetOne(ctx, int32(identity.UserID))
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load user %d: %v", identity.UserID, err)), nil
	}
	return jsonResult(user)
}

func (s *Server) listUsers(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	users, err := s.userService.FindAll(ctx)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(users)
}

func jsonResult(v any) (*mcp.CallToolResult, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return nil, fmt.Errorf("failed to encode result: %w", err)
	}
	return mcp.NewToolResultText(string(data)), nil
}
