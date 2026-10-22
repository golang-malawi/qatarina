package api

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/search"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
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
}

func NewAPI(config *config.Config) *API {

	rawDB := config.OpenDB()
	dbConn := dbsqlc.New(rawDB)
	logger := logging.NewFromConfig(&config.Logging)

	moduleService := services.NewModuleService(dbConn, config.Platform.GetMaxModuleDepth())
	projectService := services.NewProjectService(dbConn, logger, moduleService)
	environmentService := services.NewEnvironmentService(dbConn)
	reportService := services.NewReportService(rawDB.DB, dbConn, logger)

	searchEngine := newSearchEngine(config, dbConn, logger)
	testCaseService := services.NewSearchableTestCaseService(
		services.NewTestCaseService(rawDB.DB, dbConn, logger), dbConn, searchEngine, logger,
	)

	return &API{
		logger:                  logger,
		app:                     fiber.New(),
		Config:                  config,
		AuthService:             services.NewAuthService(&config.Auth, dbConn, logger),
		ProjectsService:         projectService,
		TestCasesService:        testCaseService,
		TestCaseRelationService: services.NewTestCaseRelationService(dbConn, logger),
		TestPlansService:        services.NewTestPlanService(dbConn, logger),
		TestRunsService:         services.NewTestRunService(rawDB.DB, dbConn, logger),
		UserService:             services.NewUserService(dbConn, logger, config.SMTP),
		TesterService:           services.NewTesterService(dbConn, logger),
		ModuleService:           moduleService,
		DashboardService:        services.NewDashboardService(dbConn, logger),
		TestCaseImportService:   services.NewTestCaseImportService(projectService, logger, config.ImportFile),
		OrgService:              services.NewOrgService(dbConn, logger),
		EnvironmentService:      environmentService,
		ReportService:           reportService,
	}
}

// newSearchEngine creates the configured search engine and syncs the index in the background.
// Misconfiguration never prevents startup, search falls back to database queries instead.
func newSearchEngine(cfg *config.Config, dbConn *dbsqlc.Queries, logger logging.Logger) search.Engine {
	engine, err := search.NewFromConfig(&cfg.Search)
	if err != nil {
		logger.Error(loggedmodule.Search, "failed to configure search, falling back to database search", "error", err)
		return search.Noop{}
	}
	if !engine.Enabled() {
		return engine
	}

	go func() {
		// The search engine may still be starting up, e.g. under docker compose
		backoff := 2 * time.Second
		for attempt := 1; attempt <= 6; attempt++ {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			count, err := services.ReindexTestCases(ctx, dbConn, engine)
			cancel()
			if err == nil {
				logger.Info(loggedmodule.Search, "search index synced", "provider", cfg.Search.GetProvider(), "testCases", count)
				return
			}
			logger.Warn(loggedmodule.Search, "failed to sync search index", "attempt", attempt, "error", err)
			time.Sleep(backoff)
			backoff *= 2
		}
		logger.Error(loggedmodule.Search, "giving up syncing search index, run `qatarina search reindex` once the search engine is reachable")
	}()

	return engine
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
