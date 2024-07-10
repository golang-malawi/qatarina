package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func AuthLogin(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		// loginData, err := authService.Login()
		return problemdetail.NotImplemented(ctx, "not implemented yet")
	}
}

func AuthRefreshToken(authService services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented yet")
	}
}
