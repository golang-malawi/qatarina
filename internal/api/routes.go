package api

import apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"

func (api *API) routes() {
	router := api.app

	router.Get("/healthz", api.getSystemHealthz)
	router.Get("/metrics", api.getSystemMetrics)
	router.Get("/system/info", api.getSystemInfo)

	router.Post("/v1/auth/login", apiv1.AuthLogin(api.AuthService))
	router.Post("/v1/auth/refresh-tokens", apiv1.AuthRefreshToken(api.AuthService))

	usersV1 := router.Group("/v1/users")
	{
		usersV1.Get("", apiv1.ListUsers(api.UsersRepo))
		usersV1.Post("", apiv1.CreateUser(api.UsersRepo))
		usersV1.Get("/query", apiv1.SearchUsers(api.UsersRepo))
		usersV1.Get("/{userID}", apiv1.GetOneUser(api.UsersRepo))
		usersV1.Post("/{userID}", apiv1.UpdateUser(api.UsersRepo))
		usersV1.Post("/{email}", apiv1.InviteUser(api.UsersRepo))
		usersV1.Delete("/{userID}", apiv1.DeleteUser(api.UsersRepo))
	}

	projectsV1 := router.Group("/v1/projects")
	{
		projectsV1.Get("", apiv1.ListProjects(api.ProjectsRepo))
		projectsV1.Post("", apiv1.CreateProject(api.ProjectsRepo))
		projectsV1.Get("/query", apiv1.SearchProjects(api.ProjectsRepo))
		projectsV1.Get("/{projectID}", apiv1.GetOneProject(api.ProjectsRepo))
		projectsV1.Post("/{projectID}", apiv1.UpdateProject(api.ProjectsRepo))
		projectsV1.Delete("/{projectID}", apiv1.DeleteProject(api.ProjectsRepo))
	}

	testCasesV1 := router.Group("/v1/test-cases")
	{
		testCasesV1.Get("", apiv1.ListTestCases(api.TestCasesService))
		testCasesV1.Post("", apiv1.CreateTestCase(api.TestCasesService))
		testCasesV1.Get("/query", apiv1.SearchTestCases(api.TestCasesService))
		testCasesV1.Get("/{testCaseID}", apiv1.GetOneTestCase(api.TestCasesService))
		testCasesV1.Post("/{testCaseID}", apiv1.UpdateTestCase(api.TestCasesService))
		testCasesV1.Delete("/{testCaseID}", apiv1.DeleteTestCase(api.TestCasesService))
	}

	testPlansV1 := router.Group("/v1/test-plans")
	{
		testPlansV1.Get("", apiv1.ListTestPlans(api.TestPlansService))
		testPlansV1.Post("", apiv1.CreateTestPlan(api.TestPlansService))
		testPlansV1.Get("/query", apiv1.SearchTestPlans(api.TestPlansService))
		testPlansV1.Get("/{testPlanID}", apiv1.GetOneTestPlan(api.TestPlansService))
		testPlansV1.Post("/{testPlanID}", apiv1.UpdateTestPlan(api.TestPlansService))
		testPlansV1.Delete("/{testPlanID}", apiv1.DeleteTestPlan(api.TestPlansService))
	}

	testRunsV1 := router.Group("/v1/test-plans")
	{
		testRunsV1.Get("", apiv1.ListTestRuns(api.TestRunsService))
		testRunsV1.Post("", apiv1.CreateTestRun(api.TestRunsService))
		testRunsV1.Get("/query", apiv1.SearchTestRuns(api.TestRunsService))
		testRunsV1.Get("/{testRunID}", apiv1.GetOneTestRun(api.TestRunsService))
		testRunsV1.Post("/{testRunID}", apiv1.UpdateTestRun(api.TestRunsService))
		testRunsV1.Post("/{testRunID}/passed", apiv1.PassTestRun(api.TestRunsService))
		testRunsV1.Post("/{testRunID}/failed", apiv1.FailTestRun(api.TestRunsService))
		testRunsV1.Delete("/{testRunID}", apiv1.DeleteTestRun(api.TestRunsService))
	}

	testersV1 := router.Group("/v1/testers")
	{
		testersV1.Get("", apiv1.ListTesters(api.TesterService))
		testersV1.Get("/query", apiv1.SearchTesters(api.TesterService))
		testersV1.Get("/{testPlanID}", apiv1.GetOneTester(api.TesterService))
		testersV1.Post("/invite", apiv1.InviteTester(api.TesterService))
	}

	settingsApi := router.Group("/v1/settings")
	{
		settingsApi.Get("", apiv1.GetSettings(api.Config))
		settingsApi.Patch("/{settingKey}", apiv1.UpdateSetting(api.Config))
	}
}
