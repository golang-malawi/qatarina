// Handlers for TestPlans endpoints
package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
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
//	@Router			/api/v1/test-plans [get]
func ListTestPlans(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestPlans")
	}
}

// SearchTestPlans godoc
//
//	@ID				SearchTestPlans
//	@Summary		Search all Test Plans
//	@Description	Search all Test Plans
//	@Tags			test-plans
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-plans [get]
func SearchTestPlans(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestPlans")
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
//	@Router			/api/v1/test-plans/{testPlanID} [get]
func GetOneTestPlan(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestPlan")
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
//	@Param			request	body		interface{}	true	"Create Test plan data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-plans [post]
func CreateTestPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {

		request := new(schema.CreateTestPlan)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-test-cases", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := testPlanService.Create(context.Background(), request)
		if err != nil {
			logger.Error("api-test-cases", "failed to process request", "error", err)
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
//	@Router			/api/v1/test-plans/{testPlanID} [post]
func UpdateTestPlan(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestPlan")
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
//	@Router			/api/v1/test-plans/{testPlanID} [delete]
func DeleteTestPlan(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestPlan")
	}
}

func AssignTestsToPlan(testPlanService services.TestPlanService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.AssignTestsToPlanRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-test-cases", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		planID, _ := common.ParseIDFromCtx(c, "testPlanID")
		if request.PlanID != planID {
			return problemdetail.BadRequest(c, "plan_id in request body and param do not match")
		}

		_, err := testPlanService.AddTestCaseToPlan(context.Background(), request)
		if err != nil {
			logger.Error("api-test-cases", "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test cases created and assigned",
		})
	}
}
