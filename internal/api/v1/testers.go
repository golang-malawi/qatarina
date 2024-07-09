// Handlers for Testers endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListTesters(datastore.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list Testers")
	}
}

func SearchTesters(datastore.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search Testers")
	}
}

func GetOneTester(datastore.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one Tester")
	}
}

func InviteTester(datastore.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to invite Tester")
	}
}
