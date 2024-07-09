// Handlers for TestRuns endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListTestRuns(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestRuns")
	}
}

func SearchTestRuns(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestRuns")
	}
}

func GetOneTestRun(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestRun")
	}
}

func CreateTestRun(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestRun")
	}
}

func UpdateTestRun(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestRun")
	}
}

func DeleteTestRun(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestRun")
	}
}
