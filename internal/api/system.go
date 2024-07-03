package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/schema"
)

func (api *API) getSystemHealthz(ctx *fiber.Ctx) error {
	panic("not implemented")
}

func (api *API) getSystemMetrics(ctx *fiber.Ctx) error {
	panic("not implemented")
}

func (api *API) getSystemInfo(ctx *fiber.Ctx) error {
	return ctx.JSON(schema.SystemInfo{
		Version:    "dev",
		Title:      "QATARINA",
		ProjectURL: "https://github.com/golang-malawi/qatarina",
		Developers: "Golang Malawi",
		SHA:        "dev",
		BuildDate:  "dev",
	})
}
