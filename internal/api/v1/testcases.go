// Handlers for TestCases endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListTestCases(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestCases")
	}
}

func SearchTestCases(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestCases")
	}
}

func GetOneTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestCase")
	}
}

func CreateTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestCase")
	}
}

func UpdateTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestCase")
	}
}

func DeleteTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestCase")
	}
}
