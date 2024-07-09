// Handlers for TestPlans endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListTestPlans(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestPlans")
	}
}

func SearchTestPlans(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestPlans")
	}
}

func GetOneTestPlan(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestPlan")
	}
}

func CreateTestPlan(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestPlan")
	}
}

func UpdateTestPlan(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestPlan")
	}
}

func DeleteTestPlan(datastore.TestPlanService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestPlan")
	}
}
