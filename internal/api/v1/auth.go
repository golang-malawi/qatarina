package v1

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func AuthLogin(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var request schema.LoginRequest
		_, err := common.ParseBodyThenValidate(ctx, &request)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid data in the request", err)
		}

		loginData, err := authService.SignIn(&request)
		if err != nil {
			slog.Default().Error("failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}

		return ctx.JSON(loginData)
	}
}

func AuthRefreshToken(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented yet")
	}
}

func Signup(authService services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.SignUpRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse request body")
		}
		token, err := authService.SignUp(request)
		if err != nil {
			if errors.Is(err, services.ErrUserAlreadyExists) {
				return problemdetail.BadRequest(c, fmt.Sprintf("failed to sign up - %v", err))
			}
			return problemdetail.ServerErrorProblem(c, "failed to sign up")
		}
		return c.JSON(fiber.Map{
			"message": "Sign up process completed successfully",
			"token":   token,
		})
	}
}
