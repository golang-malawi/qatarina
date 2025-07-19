package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

type API struct {
	logger           logging.Logger
	app              *fiber.App
	Config           *config.Config
	RiverClient      *river.Client[pgx.Tx]
	AuthService      services.AuthService
	UserService      services.UserService
	ProjectsService  services.ProjectService
	TestCasesService services.TestCaseService
	TestPlansService services.TestPlanService
	TestRunsService  services.TestRunService
	TesterService    services.TesterService
	ModuleService    services.ModuleService
	PageService      services.PageService
	UploadService    services.UploadService
}

func NewAPI(config *config.Config) *API {

	dbConn := dbsqlc.New(config.OpenDB())
	logger := logging.NewFromConfig(&config.Logging)

	return &API{
		logger:           logger,
		app:              fiber.New(),
		Config:           config,
		AuthService:      services.NewAuthService(&config.Auth, dbConn, logger),
		ProjectsService:  services.NewProjectService(dbConn, logger),
		TestCasesService: services.NewTestCaseService(dbConn, logger),
		TestPlansService: services.NewTestPlanService(dbConn, logger),
		TestRunsService:  services.NewTestRunService(dbConn, logger),
		UserService:      services.NewUserService(dbConn, logger),
		TesterService:    services.NewTesterService(dbConn, logger),
		ModuleService:    services.NewModuleService(dbConn),
		PageService:      services.NewPageService(dbConn),
		UploadService:    services.NewUploadService(dbConn, logger, config),
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
