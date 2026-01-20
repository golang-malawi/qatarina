package v1

import (
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// @Summary User login
// @Description Authenticates a user and returns access tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body schema.LoginRequest true "Login credentials"
// @Success 200 {object} schema.LoginResponse
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid credentials or request body"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/auth/login [post]
func AuthLogin(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var request schema.LoginRequest
		_, err := common.ParseBodyThenValidate(ctx, &request)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid data in the request", err)
		}

		loginData, err := authService.SignIn(&request)
		if err != nil {
			if errors.Is(err, services.ErrInvalidCredentials) {
				return problemdetail.BadRequest(ctx, "invalid credentials provided")
			}
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}

		return ctx.JSON(loginData)
	}
}

// @Summary Refresh access token
// @Description Refreshes an expired access token using a valid refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body schema.RefreshTokenRequest true "Refresh token"
// @Success 200 {object} schema.RefreshTokenResponse
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid token"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/auth/refresh-token [post]
func AuthRefreshToken(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented yet")
	}
}

// @Summary User signup
// @Description Registers a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param request body schema.SignUpRequest true "User registration details"
// @Success 200 {object} map[string]interface{} "Returns success message and token"
// @Failure 400 {object} problemdetail.ProblemDetail "User already exists or invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/auth/signup [post]
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

// Change password godoc
//
//	@ID				Change password
//	@Summary		Allows autheticated user to change their password
//	@Description	Allows autheticated user to change their password
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.ChangePasswordRequest	true	"Password change request"
//	@Success		200			{object}	map[string]string "Password changed successfully"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/auth/change-password [post]
func ChangePassword(authService services.AuthService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.ChangePasswordRequest
		_, err := common.ParseBodyThenValidate(ctx, &req)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid request body", err)
		}

		authUserID := authutil.GetAuthUserID(ctx)
		if authUserID != req.UserID {
			return problemdetail.BadRequest(ctx, "you can only change your own password")
		}

		err = authService.ChangePassword(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrInvalidCredentials) {
				return problemdetail.BadRequest(ctx, "invalid old password")
			}
			logger.Error(loggedmodule.ApiAuth, "failed to change password", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to change password")
		}

		logger.Info(loggedmodule.ApiAuth, "user changed password successfully", "user_id", authUserID)

		return ctx.JSON(fiber.Map{"message": "Password changed successfully"})
	}
}
