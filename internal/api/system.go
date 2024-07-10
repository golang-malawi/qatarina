package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/version"
)

func (api *API) getSystemHealthz(ctx *fiber.Ctx) error {
	panic("not implemented")
}

func (api *API) getSystemMetrics(ctx *fiber.Ctx) error {
	panic("not implemented")
}

func (api *API) getSystemInfo(ctx *fiber.Ctx) error {
	return ctx.JSON(schema.SystemInfo{
		Title:      "QATARINA",
		ProjectURL: "https://github.com/golang-malawi/qatarina",
		Developers: "Golang Malawi",
		Version:    version.Version,
		SHA:        version.CommitSHA,
		BuildDate:  version.BuildDate,
	})
}
