// Handlers for users endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func ListUsers(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list users")
	}
}

func SearchUsers(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search users")
	}
}

func GetOneUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one user")
	}
}

func CreateUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create user")
	}
}

func UpdateUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update user")
	}
}

func InviteUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to invite user")
	}
}

func DeleteUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete user")
	}
}
