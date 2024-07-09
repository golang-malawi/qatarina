// Handlers for users endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListUsers godoc
//
//	@ID				ListUsers
//	@Summary		List all Users
//	@Description	List all Users
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users [get]
func ListUsers(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list users")
	}
}

// SearchUsers godoc
//
//	@ID				SearchUsers
//	@Summary		Search all Users
//	@Description	Search all Users
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users/query [get]
func SearchUsers(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search users")
	}
}

// GetOneUser godoc
//
//	@ID				GetOneUser
//	@Summary		Get one User
//	@Description	Get one User
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			userID	path		string	true	"User ID"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users/{userID} [get]
func GetOneUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one user")
	}
}

// CreateUser godoc
//
//	@ID				CreateUser
//	@Summary		Create a new User
//	@Description	Create a new User
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"User data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users [post]
func CreateUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create user")
	}
}

// UpdateUser godoc
//
//	@ID				UpdateUser
//	@Summary		Update a User
//	@Description	Update a User
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			userID	path		string		true	"User ID"
//	@Param			request	body		interface{}	true	"User ID"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users/{userID} [post]
func UpdateUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update user")
	}
}

// InviteUser godoc
//
//	@ID				InviteUser
//	@Summary		Invite a User by email
//	@Description	Invite a User by email
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			email	path		string		true	"User's email"
//	@Param			request	body		interface{}	true	"User invite data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users/invite/{email} [post]
func InviteUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to invite user")
	}
}

// DeleteUser godoc
//
//	@ID				DeleteUser
//	@Summary		Delete a user
//	@Description	Delete a user
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			userID	path		string	true	"User ID"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/users/{userID} [delete]
func DeleteUser(datastore.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete user")
	}
}
