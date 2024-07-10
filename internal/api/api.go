package api

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

type API struct {
	logger           *slog.Logger
	app              *fiber.App
	Config           *config.Config
	RiverClient      *river.Client[pgx.Tx]
	AuthService      services.AuthService
	OrgRepo          datastore.OrgRepository
	UsersRepo        datastore.UserRepository
	ProjectsRepo     datastore.ProjectRepository
	TestersRepo      datastore.TesterRepository
	TestCasesService datastore.TestCaseService
	TestPlansService datastore.TestPlanService
	TestRunsService  datastore.TestRunService
	TesterService    datastore.TesterService
}

func NewAPI(config *config.Config) *API {
	return &API{
		logger: slog.Default(),
		app:    fiber.New(),
		Config: config,
	}
}

func (api *API) registerRoutes() {
	api.middleware()
	api.routes()
}

func (api *API) Start(address string) error {
	api.registerRoutes()
	api.logger.Debug("Starting API on ", "address", address)
	return api.app.Listen(address)
}
