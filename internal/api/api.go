package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/spf13/afero"
)

type API struct {
	logger                  logging.Logger
	app                     *fiber.App
	Config                  *config.Config
	RiverClient             *river.Client[pgx.Tx]
	AuthService             services.AuthService
	UserService             services.UserService
	ProjectsService         services.ProjectService
	TestCasesService        services.TestCaseService
	TestCaseRelationService services.TestCaseRelationService
	TestPlansService        services.TestPlanService
	TestRunsService         services.TestRunService
	TesterService           services.TesterService
	ModuleService           services.ModuleService
	PageService             services.PageService
	DashboardService        services.DashboardService
	TestCaseImportService   services.TestCaseImportService
	OrgService              services.OrgService
	EnvironmentService      services.EnvironmentService
	ReportService           services.ReportService
	DocumentService         services.DocumentService
	Storage                 afero.Fs
}

func NewAPI(config *config.Config, fs afero.Fs) *API {

	rawDB := config.OpenDB()
	dbConn := dbsqlc.New(rawDB)
	logger := logging.NewFromConfig(&config.Logging)

	moduleService := services.NewModuleService(dbConn, config.Platform.GetMaxModuleDepth())
	projectService := services.NewProjectService(dbConn, logger, moduleService)
	environmentService := services.NewEnvironmentService(dbConn)
	reportService := services.NewReportService(rawDB.DB, dbConn, logger)

	return &API{
		logger:                  logger,
		app:                     fiber.New(),
		Config:                  config,
		AuthService:             services.NewAuthService(&config.Auth, dbConn, logger),
		ProjectsService:         projectService,
		TestCasesService:        services.NewTestCaseService(rawDB.DB, dbConn, logger),
		TestCaseRelationService: services.NewTestCaseRelationService(dbConn, logger),
		TestPlansService:        services.NewTestPlanService(dbConn, logger),
		TestRunsService:         services.NewTestRunService(rawDB.DB, dbConn, logger, fs, config.Attachments.GetMaxFileSize()),
		UserService:             services.NewUserService(dbConn, logger, config.SMTP),
		TesterService:           services.NewTesterService(dbConn, logger),
		ModuleService:           moduleService,
		DashboardService:        services.NewDashboardService(dbConn, logger),
		TestCaseImportService:   services.NewTestCaseImportService(projectService, logger, config.ImportFile),
		OrgService:              services.NewOrgService(dbConn, logger),
		EnvironmentService:      environmentService,
		ReportService:           reportService,
		DocumentService:         services.NewDocumentService(dbConn, logger, fs, config.Attachments.GetMaxFileSize()),
		Storage:                 fs,
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
