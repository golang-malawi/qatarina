package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

//  DashboardSummary godoc
//
//	@ID			DashboardSummary
//	@Summary	Get dashboard summary
//	@Description	Returns key metrics for dashboard
//	@Tags			dashboard
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	schema.DashboardSummaryResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/dashboard/summary [get]

func DashboardSummary(dashboardService services.DashboardService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		summary, err := dashboardService.GetDashboardSummary(ctx.Context())
		if err != nil {
			logger.Error(loggedmodule.ApiDashboard, "failed to retrieve dashboard", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to retrieve the dashboard")
		}

		return ctx.JSON(summary)
	}
}
