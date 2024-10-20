// Handlers for Projects endpoints
package v1

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListProject godoc
//
//	@ID				ListProject
//	@Summary		List Projects available on the platform
//	@Description	List Projects available on the platform
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects [get]
func ListProjects(projectService services.ProjectService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		projects, err := projectService.FindAll(context.Background())
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"projects": schema.NewProjectResponseList(projects),
		})
	}
}

// SearchProjects godoc
//
//	@ID				SearchProjects
//	@Summary		Search for a Project
//	@Description	Search for a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/query [get]
func SearchProjects(projectService services.ProjectService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search Projects")
	}
}

// GetOneProject godoc
//
//	@ID				GetOneProject
//	@Summary		Get a single Project
//	@Description	Get a single Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [get]
func GetOneProject(projectService services.ProjectService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one Project")
	}
}

// GetProjectTestCases godoc
//
//	@ID				GetProjectTestCases
//	@Summary		Get a single Project's test cases
//	@Description	Get a single Project's test cases
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID}/test-cases [get]
func GetProjectTestCases(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}
		testCases, err := testCaseService.FindAllByProjectID(context.Background(), projectID)
		if err != nil {
			logger.Error("api:projects", "failed to fetch test cases for project", "projectID", projectID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}

// GetProjectTestPlans godoc
//
//	@ID				GetProjectTestPlans
//	@Summary		Get a single Project's test plans
//	@Description	Get a single Project's test plans
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID}/test-cases [get]
func GetProjectTestPlans(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}
		testPlans, err := testPlanService.FindAllByProjectID(context.Background(), projectID)
		if err != nil {
			logger.Error("api:projects", "failed to fetch test cases for project", "projectID", projectID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"test_plans": testPlans,
		})
	}
}

// GetProjectTestRuns godoc
//
//	@ID				GetProjectTestRuns
//	@Summary		Get a single Project's test runs
//	@Description	Get a single Project's test runs
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID}/test-runs [get]
func GetProjectTestRuns(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}
		testPlans, err := testRunService.FindAllByProjectID(context.Background(), projectID)
		if err != nil {
			logger.Error("api:projects", "failed to fetch test cases for project", "projectID", projectID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"test_plans": testPlans,
		})
	}
}

// CreateProject godoc
//
//	@ID				CreateProject
//	@Summary		Create a Project
//	@Description	Create a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"Project Creation data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects [post]
func CreateProject(projectService services.ProjectService, testPlanService services.TestPlanService, platform *config.PlatformConfiguration, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var request schema.NewProjectRequest
		_, err := common.ParseBodyThenValidate(ctx, &request)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid data in the request", err)
		}

		request.ProjectOwnerID = authutil.GetAuthUserID(ctx)

		project, err := projectService.Create(context.Background(), &request)
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}

		if platform.CreateDefaultTestPlan {
			logger.Info("projectsv1", "creating a new default Test Plan to get projects ")
			newDefaultTestPlan := &schema.CreateTestPlan{
				ProjectID:      int64(project.ID),
				Kind:           string(dbsqlc.TestKindGeneral),
				Description:    "Default -- Ongoing Testing",
				StartAt:        time.Now().Format(time.DateOnly),
				ClosedAt:       nil,
				ScheduledEndAt: "2099-01-01",
				AssignedToID:   int64(project.OwnerUserID),
				CreatedByID:    int64(project.OwnerUserID),
				UpdatedByID:    int64(project.OwnerUserID),
				PlannedTests:   []schema.TestCaseAssignment{},
			}

			_, err := testPlanService.Create(context.Background(), newDefaultTestPlan)
			if err != nil {
				logger.Error("projectsv1", "failed to create a default test plan for project", "projectID", project.ID, "error", err)
			}
		}

		return ctx.JSON(fiber.Map{
			"project": schema.NewProjectResponse(project, nil), // TODO: fetch owner
		})
	}
}

// UpdateProject godoc
//
//	@ID				UpdateProject
//	@Summary		Update a Project
//	@Description	Update a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string		true	"Project ID"
//	@Param			request		body		interface{}	true	"Project Update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [post]
func UpdateProject(projectService services.ProjectService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update Project")
	}
}

// ImportProject godoc
//
//	@ID				ImportProject
//	@Summary		Import Projects from some source
//	@Description	Import Projects from some source
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"Import Specification"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/import [post]
func ImportProject(projectService services.ProjectService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to import Project")
	}
}

// DeleteProject godoc
//
//	@ID				DeleteProject
//	@Summary		Delete a Project
//	@Description	Delete a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [delete]
func DeleteProject(projectService services.ProjectService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete Project")
	}
}
