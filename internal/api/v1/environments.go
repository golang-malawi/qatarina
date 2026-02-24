package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListEnvironments godoc
//
//	@ID				ListEnvironments
//	@Summary		List environments for a project
//	@Description	List environments for a project
//	@Tags			environments
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	schema.EnvironmentListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/environments [get]
func ListEnvironments(environmentService services.EnvironmentService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for ID")
		}

		envs, err := environmentService.FindByProjectID(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiProjects, "failed to list environments for project", "error", err, "projectID", projectID)
			return problemdetail.ServerErrorProblem(c, "failed to list environments for project")
		}

		return c.JSON(envs)
	}
}

// GetEnvironment godoc
//
//	@ID				GetEnvironment
//	@Summary		Get details of a single environment by ID
//	@Description	Get details of a single environment by ID
//	@Tags			environements
//	@Accept			json
//	@Produce		json
//	@Param			envID	path		string	true	"Environment ID"
//	@Success		200			{object}	schema.EnvironmentResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/environments/{envID} [get]
func GetEnvironment(environmentService services.EnvironmentService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		envID, err := c.ParamsInt("envID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for ID")
		}

		env, err := environmentService.FindByID(c.Context(), int64(envID))
		if err != nil {
			logger.Error(loggedmodule.ApiEnvironments, "failed to get environment", "error", err, "envID", envID)
			return problemdetail.ServerErrorProblem(c, "failed to get environment")
		}

		return c.JSON(env)
	}
}
