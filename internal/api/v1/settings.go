package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func GetSettings(config *config.Config) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented")
	}
}

func UpdateSetting(config *config.Config) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not implemented")
	}
}
