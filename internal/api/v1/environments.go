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
