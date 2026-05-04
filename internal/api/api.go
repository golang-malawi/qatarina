package api

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/google/go-github/v62/github"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

type API struct {
	logger                logging.Logger
	app                   *fiber.App
	Config                *config.Config
	RiverClient           *river.Client[pgx.Tx]
	AuthService           services.AuthService
	UserService           services.UserService
	ProjectsService       services.ProjectService
	TestCasesService      services.TestCaseService
	TestPlansService      services.TestPlanService
	TestRunsService       services.TestRunService
	TesterService         services.TesterService
	ModuleService         services.ModuleService
	PageService           services.PageService
	DashboardService      services.DashboardService
	TestCaseImportService services.TestCaseImportService
	GitHubService         services.GitHubService
	OrgService            services.OrgService
	EnvironmentService    services.EnvironmentService
}

func NewAPI(config *config.Config) *API {

	rawDB := config.OpenDB()
	dbConn := dbsqlc.New(rawDB)
	logger := logging.NewFromConfig(&config.Logging)
	var ghClient *github.Client

	installation, err := dbConn.GetFirstInstallation(context.Background())
	if err != nil {
		logger.Info("no installation found at startup, waiting for webhook", "error", err)
	} else {
		token, err := config.GetInstallationToken(installation.InstallationID)
		if err != nil {
			logger.Error("failed to get installation token", "error", err)
			panic(err)
		}

		ghClient = services.NewGitHubClient(token)
	}

	moduleService := services.NewModuleService(dbConn)
	projectService := services.NewProjectService(dbConn, logger, moduleService)
	environmentService := services.NewEnvironmentService(dbConn)

	return &API{
		logger:                logger,
		app:                   fiber.New(),
		Config:                config,
		AuthService:           services.NewAuthService(&config.Auth, dbConn, logger),
		ProjectsService:       projectService,
		TestCasesService:      services.NewTestCaseService(rawDB.DB, dbConn, logger),
		TestPlansService:      services.NewTestPlanService(dbConn, logger),
		TestRunsService:       services.NewTestRunService(rawDB.DB, dbConn, logger),
		UserService:           services.NewUserService(dbConn, logger, config.SMTP),
		TesterService:         services.NewTesterService(dbConn, logger),
		ModuleService:         moduleService,
		DashboardService:      services.NewDashboardService(dbConn, logger),
		TestCaseImportService: services.NewTestCaseImportService(projectService, logger, config.ImportFile),
		GitHubService:         services.NewGitHubService(ghClient, projectService, testCaseService, dbConn, config, logger),
		OrgService:            services.NewOrgService(dbConn, logger),
		EnvironmentService:    environmentService,
	}
}

func (api *API) registerRoutes() {
	api.middleware()
	api.routes()
}

func (api *API) Start(address string) error {
	api.registerRoutes()
	api.logger.Debug("startup", "Starting API", "address", address)
	return api.app.Listen(address)
}
