// Handlers for TestPlans endpoints
package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListTestPlans godoc
//
//	@ID				ListTestPlans
//	@Summary		List all Test Plans
//	@Description	List all Test Plans
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans [get]
func ListTestPlans(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {

		testPlans, err := testPlanService.FindAll(context.Background())
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to fetch test plans", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch test plans")
		}
		return c.JSON(fiber.Map{
			"test_plans": testPlans,
		})
	}
}

// SearchTestPlans godoc
//
//	@ID				SearchTestPlans
//	@Summary		Search test plans
//	@Description	Search test plans
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			query	path		string	true	"query"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans/query [get]
func SearchTestPlans(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := strconv.Atoi(c.Query("q"))
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "invalid parameter query", "error", err)
			return problemdetail.BadRequest(c, "invalid or missing projectID parameter in query")
		}
		testPlans, err := testPlanService.FindAllByProjectID(c.Context(), int64(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiTestPlans, "test plan not found", "error", err)
				return c.JSON(schema.TestPlanListResponse{})
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to find test plan", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to find a test plan")
		}

		return c.JSON(testPlans)

	}
}

// GetOneTestPlan godoc
//
//	@ID				GetOneTestPlan
//	@Summary		Get one Test Plan
//	@Description	Get one Test Plan
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			testPlanID	path		string	true	"Test Plan ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans/{testPlanID} [get]
func GetOneTestPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testPlanID, err := c.ParamsInt("testPlanID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id from path")
		}
		testPlan, err := testPlanService.GetOneTestPlan(c.Context(), int64(testPlanID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(testPlan)
	}

}

// CreateTestPlan godoc
//
//	@ID				CreateTestPlan
//	@Summary		Create a new Test Plan
//	@Description	Create a new Test Plan
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.CreateTestPlan	true	"Create Test plan data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans [post]
func CreateTestPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {

		request := new(schema.CreateTestPlan)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		userID := authutil.GetAuthUserID(c)

		request.CreatedByID = userID
		request.AssignedToID = userID
		request.UpdatedByID = userID

		_, err := testPlanService.Create(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test cases created",
		})
	}
}

// UpdateTestPlan godoc
//
//	@ID				UpdateTestPlan
//	@Summary		Update a Test Plan
//	@Description	Update a Test Plan
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			testPlanID	path		string		true	"Test Plan ID"
//	@Param			request		body		interface{}	true	"Test Plan data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans/{testPlanID} [post]
func UpdateTestPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateTestPlan)
		if validationErros, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErros {
				return problemdetail.ValidationErrors(c, "invalid datea in request", err)
			}
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}
		// testPlanID, err := c.ParamsInt("testPlanID", 0)
		// if err != nil{
		// 	return problemdetail.BadRequest(c, "failed to pass test plan id data in request")
		// }
		userID := authutil.GetAuthUserID(c)

		request.CreatedByID = userID
		request.AssignedToID = userID
		request.UpdatedByID = userID

		_, err := testPlanService.Update(c.Context(), *request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test plan updated successfully",
		})
	}
}

// DeleteTestPlan godoc
//
//	@ID				DeleteTestPlan
//	@Summary		Delete a Test Plan
//	@Description	Delete a Test Plan
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			testPlanID	path		string	true	"Test Plan ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans/{testPlanID} [delete]
func DeleteTestPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testPlanID, _ := c.ParamsInt("testPlanID", 0)
		err := testPlanService.DeleteByID(context.Background(), int64(testPlanID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to delete test plan", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(fiber.Map{
			"message":    "test plan deleted",
			"testPlanID": testPlanID,
		})
	}
}

// AssignTestsToPlan godoc
//
//	@ID				AssignTestsToPlan
//	@Summary		Assign a test to a plan
//	@Description	Assign a test to a plan
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Param			testPlanID	path		string	true	"testPlanID"
//	@Param			request	body	schema.AssignTestsToPlanRequest		true	"testPlanID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-plans/{testPlanID}/test-cases [post]
func AssignTestsToPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.AssignTestsToPlanRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		planID, _ := common.ParseIDFromCtx(c, "testPlanID")
		if request.PlanID != planID {
			return problemdetail.BadRequest(c, "plan_id in request body and param do not match")
		}

		_, err := testPlanService.AddTestCaseToPlan(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestPlans, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test cases created and assigned",
		})
	}
}
