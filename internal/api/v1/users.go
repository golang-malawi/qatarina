// Handlers for users endpoints
package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
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
//	@Success		200	{object}	schema.CompactUserListResponse
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/users [get]
func ListUsers(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		users, err := userService.FindAll(context.Background())
		if err != nil {
			logger.Error("apiv1:users", "failed to load users", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to load users")
		}

		return c.JSON(users)
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
//	@Router			/v1/users/query [get]
func SearchUsers(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(q *fiber.Ctx) error {
		keyword := q.Query("keyword", "")
		if keyword == "" {
			return problemdetail.BadRequest(q, "missing keyword parameter")
		}

		users, err := userService.Search(q.Context(), keyword)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error("error", "search error:", err)
				return q.JSON([]dbsqlc.User{})
			}

		}

		return q.JSON(users)
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
//	@Router			/v1/users/{userID} [get]
func GetOneUser(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := c.ParamsInt("userID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}

		user, err := userService.GetOne(c.Context(), int32(userID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info("apiv1:users", "user not found", "error", err)
				return problemdetail.BadRequest(c, "no user found")
			}
			logger.Error("apiv1:users", "failed to retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrieve user")
		}
		return c.JSON(user)
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
//	@Param			request	body		schema.NewUserRequest	true	"User data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/users [post]
func CreateUser(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.NewUserRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("apiv1:users", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := userService.Create(context.Background(), request)
		if err != nil {
			if errors.Is(err, services.ErrEmailAlreadyInUse) {
				return problemdetail.BadRequest(c, err.Error())
			}
			logger.Error("apiv1:users", "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "User created",
		})
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
//	@Router			/v1/users/{userID} [post]
func UpdateUser(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateUserRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("apiv1:users", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}
		userID, err := c.ParamsInt("userID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to pass id data in request")
		}
		request.ID = int32(userID)
		_, err = userService.Update(c.Context(), *request)
		if err != nil {
			logger.Error("apiv1:users", "failed to process request", "error", err)
			return problemdetail.BadRequest(c, "failed to process request")
		}
		return c.JSON(fiber.Map{
			"message": "User updated successfully",
		})
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
//	@Router			/v1/users/invite/{email} [post]
func InviteUser(services.UserService) fiber.Handler {
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
//	@Router			/v1/users/{userID} [delete]
func DeleteUser(userService services.UserService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDParam := c.Params("userID")
		userID, err := strconv.Atoi(userIDParam)
		if err != nil {
			logger.Error("Failed to retrieve user id", "error", err)
			problemdetail.BadRequest(c, "failed to process request id")
		}

		err = userService.Delete(c.Context(), int32(userID))
		if err != nil {
			logger.Error("apiv1:users", "failed to delete user", "error", err)
			return problemdetail.BadRequest(c, "failed to delete user")
		}

		return c.JSON(fiber.Map{
			"message": "User deleted successfully",
			"userID":  userID,
		})
	}
}
