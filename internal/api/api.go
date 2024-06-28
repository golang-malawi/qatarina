package api

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
	apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

type API struct {
	logger       *slog.Logger
	app          *fiber.App
	Config       *config.Config
	RiverClient  *river.Client[pgx.Tx]
	OrgRepo      datastore.OrgRepository
	UsersRepo    datastore.UserRepository
	ProjectsRepo datastore.ProjectRepository
	TestersRepo  datastore.TesterRepository
}

func NewAPI(config *config.Config) *API {
	return &API{
		logger: slog.Default(),
		app:    fiber.New(),
		Config: config,
	}
}

func routes(app *fiber.App) {
	root := app.Group("/v1")

	usersV1 := root.Group("/users")
	apiv1.UsersRoutes(usersV1)
	// projectsV1 := root.Group("/projects")
	// apiv1.ProjectsRoutes(projectsV1)

	// testCasesV1 := root.Group("/test-cases")
	// apiv1.TestCasesRoutes(testCasesV1)

	// testSessionsV1 := root.Group("/test-sessions")

	// testersV1 := root.Group("/testers")

	// testGroupsV1 := root.Group("/test-groups")

	// testResultsV1 := root.Group("/test-results")
}

func (api *API) Start(address string) error {
	api.logger.Debug("Starting API on ", "address", address)
	return api.app.Listen(address)
}
