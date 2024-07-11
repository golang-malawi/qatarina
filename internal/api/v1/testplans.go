// Handlers for TestPlans endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
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
func CreateTestPlan(services.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestPlan")
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
