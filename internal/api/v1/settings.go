package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// @Summary Get system settings
// @Description Retrieves all system settings
// @Tags settings
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} problemdetail.ProblemDetail "Unauthorized"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/settings [get]
func GetSettings(config *config.Config) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented")
	}
}

// @Summary Update system setting
// @Description Updates a specific system setting
// @Tags settings
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body map[string]interface{} true "Setting key and value"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 401 {object} problemdetail.ProblemDetail "Unauthorized"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/settings [put]
func UpdateSetting(config *config.Config) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented")
	}
}
