package api

import (
	"fmt"
	"io/fs"
	"net/http"

	"github.com/gofiber/fiber/v2/middleware/filesystem"
	apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"
	"github.com/golang-malawi/qatarina/ui"
)

func (api *API) routes() {
	router := api.app

	router.Get("/healthz", api.getSystemHealthz)
	router.Get("/metrics", api.getSystemMetrics)
	router.Get("/system/info", api.getSystemInfo)

	router.Post("/v1/auth/login", apiv1.AuthLogin(api.AuthService))
	router.Post("/v1/auth/refresh-tokens", apiv1.AuthRefreshToken(api.AuthService))

	if api.Config.Auth.SignupEnabled {
		router.Post("/v1/auth/signup", apiv1.Signup(api.AuthService))
	}

	authenticationMiddleware := RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey))

	usersV1 := router.Group("/v1/users", authenticationMiddleware)
	{
		usersV1.Get("", apiv1.ListUsers(api.UserService, api.logger))
		usersV1.Post("", apiv1.CreateUser(api.UserService, api.logger))
		usersV1.Get("/query", apiv1.SearchUsers(api.UserService))
		usersV1.Get("/:userID", apiv1.GetOneUser(api.UserService))
		usersV1.Post("/:userID", apiv1.UpdateUser(api.UserService))
		usersV1.Post("/invite/:email", apiv1.InviteUser(api.UserService))
		usersV1.Delete("/:userID", apiv1.DeleteUser(api.UserService))
	}

	projectsV1 := router.Group("/v1/projects", authenticationMiddleware)
	{
		projectsV1.Get("", apiv1.ListProjects(api.ProjectsService))
		projectsV1.Post("", apiv1.CreateProject(api.ProjectsService, api.TestPlansService, &api.Config.Platform, api.logger))
		projectsV1.Get("/query", apiv1.SearchProjects(api.ProjectsService))
		projectsV1.Get("/:projectID/test-cases", apiv1.GetProjectTestCases(api.TestCasesService, api.logger))
		projectsV1.Get("/:projectID/test-plans", apiv1.GetProjectTestPlans(api.TestPlansService, api.logger))
		projectsV1.Get("/:projectID/test-runs", apiv1.GetProjectTestRuns(api.TestRunsService, api.logger))
		projectsV1.Get("/:projectID/testers", apiv1.GetProjectTesters(api.ProjectsService, api.TesterService, api.logger))
		projectsV1.Post("/:projectID/testers", apiv1.AssignTesters(api.TesterService, api.logger))
		projectsV1.Get("/:projectID", apiv1.GetOneProject(api.ProjectsService))
		projectsV1.Post("/:projectID", apiv1.UpdateProject(api.ProjectsService))
		projectsV1.Delete("/:projectID", apiv1.DeleteProject(api.ProjectsService))
		projectsV1.Get("/:projectID/modules", apiv1.GetProjectModules(api.ModuleService))
	}

	modulesV1 := router.Group("/v1/modules", authenticationMiddleware)
	{
		modulesV1.Post("/modules", apiv1.CreateModule(api.ModuleService))
		modulesV1.Get("/modules/:id", apiv1.GetOneModule(api.ModuleService))
		modulesV1.Get("/modules", apiv1.GetAllModules(api.ModuleService))
		modulesV1.Post("/modules/:id", apiv1.UpdateModule(api.ModuleService))
		modulesV1.Delete("/modules/:id", apiv1.DeleteModule(api.ModuleService))

	}

	pagesV1 := router.Group("/v1/pages", authenticationMiddleware)
	{
		pagesV1.Post("/pages", apiv1.CreatePage(api.PageService, api.logger))
		pagesV1.Get("/pages/:id", apiv1.GetOnePage(api.PageService, api.logger))
		pagesV1.Get("/pages", apiv1.GetAllPages(api.PageService, api.logger))
		pagesV1.Post("/pages/:id", apiv1.UpdatePage(api.PageService, api.logger))
		pagesV1.Delete("/pages/:id", apiv1.DeletePage(api.PageService, api.logger))
	}

	testCasesV1 := router.Group("/v1/test-cases", authenticationMiddleware)
	{
		testCasesV1.Get("", apiv1.ListTestCases(api.TestCasesService))
		testCasesV1.Post("", apiv1.CreateTestCase(api.TestCasesService, api.logger))
		testCasesV1.Post("/bulk", apiv1.BulkCreateTestCases(api.TestCasesService, api.logger))
		testCasesV1.Get("/query", apiv1.SearchTestCases(api.TestCasesService))
		testCasesV1.Post("/github-import", apiv1.ImportIssuesFromGitHubAsTestCases(api.ProjectsService, api.TestCasesService, api.logger))
		testCasesV1.Get("/:testCaseID", apiv1.GetOneTestCase(api.TestCasesService))
		testCasesV1.Post("/:testCaseID", apiv1.UpdateTestCase(api.TestCasesService, api.logger))
		testCasesV1.Delete("/:testCaseID", apiv1.DeleteTestCase(api.TestCasesService, api.logger))
	}

	testPlansV1 := router.Group("/v1/test-plans", authenticationMiddleware)
	{
		testPlansV1.Get("", apiv1.ListTestPlans(api.TestPlansService))
		testPlansV1.Post("", apiv1.CreateTestPlan(api.TestPlansService, api.logger))
		testPlansV1.Get("/query", apiv1.SearchTestPlans(api.TestPlansService))
		testPlansV1.Get("/:testPlanID", apiv1.GetOneTestPlan(api.TestPlansService))
		testPlansV1.Post("/:testPlanID", apiv1.UpdateTestPlan(api.TestPlansService))
		testPlansV1.Post("/:testPlanID/test-cases", apiv1.AssignTestsToPlan(api.TestPlansService, api.logger))
		testPlansV1.Delete("/:testPlanID", apiv1.DeleteTestPlan(api.TestPlansService))
	}

	testRunsV1 := router.Group("/v1/test-runs", authenticationMiddleware)
	{
		testRunsV1.Get("", apiv1.ListTestRuns(api.TestRunsService))
		testRunsV1.Post("", apiv1.CreateTestRun(api.TestRunsService))
		testRunsV1.Get("/query", apiv1.SearchTestRuns(api.TestRunsService))
		testRunsV1.Post("/bulk/commit", apiv1.CommitBulkTestRun(api.TestRunsService, api.logger))
		testRunsV1.Get("/:testRunID", apiv1.GetOneTestRun(api.TestRunsService))
		testRunsV1.Post("/:testRunID", apiv1.UpdateTestRun(api.TestRunsService))
		testRunsV1.Post("/:testRunID/commit", apiv1.CommitTestRun(api.TestRunsService, api.logger))
		testRunsV1.Delete("/:testRunID", apiv1.DeleteTestRun(api.TestRunsService))
	}

	testersV1 := router.Group("/v1/testers", authenticationMiddleware)
	{
		testersV1.Get("", apiv1.ListTesters(api.TesterService, api.logger))
		testersV1.Get("/query", apiv1.SearchTesters(api.TesterService, api.logger))
		testersV1.Get("/:testerID", apiv1.GetOneTester(api.TesterService, api.logger))
		testersV1.Post("/invite", apiv1.InviteTester(api.TesterService, api.logger))
	}

	settingsApi := router.Group("/v1/settings", authenticationMiddleware)
	{
		settingsApi.Get("", apiv1.GetSettings(api.Config))
		settingsApi.Patch("/:settingKey", apiv1.UpdateSetting(api.Config))
	}

	frontendAssets, err := fs.Sub(ui.FrontendDistFS, "dist")
	if err != nil {
		panic(fmt.Errorf("failed to embed dist directory, cannot start Server. Got %v", err))
	}

	// Serves the app at the root path  "/"
	router.Use(filesystem.New(filesystem.Config{
		Root:         http.FS(frontendAssets),
		Browse:       false,
		NotFoundFile: "index.html",
	}))
}
