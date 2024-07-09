// Handlers for Projects endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListProjects(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list Projects")
	}
}

func SearchProjects(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search Projects")
	}
}

func GetOneProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one Project")
	}
}

func CreateProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create Project")
	}
}

func UpdateProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update Project")
	}
}

func ImportProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to import Project")
	}
}

func DeleteProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete Project")
	}
}
