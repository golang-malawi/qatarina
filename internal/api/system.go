package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/version"
)

// @Summary Health check endpoint
// @Description Returns the health status of the system
// @Tags system
// @Produce json
// @Success 200 {object} schema.HealthStatus
// @Router /healthz [get]
func (api *API) getSystemHealthz(ctx *fiber.Ctx) error {
	panic("not implemented")
}

// @Summary System metrics endpoint
// @Description Returns system metrics for monitoring
// @Tags system
// @Produce json
// @Success 200 {object} schema.Metrics
// @Router /metrics [get]
func (api *API) getSystemMetrics(ctx *fiber.Ctx) error {
	panic("not implemented")
}

// @Summary System information
// @Description Returns general information about the system including version and build details
// @Tags system
// @Produce json
// @Success 200 {object} schema.SystemInfo
// @Router /system/info [get]
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
