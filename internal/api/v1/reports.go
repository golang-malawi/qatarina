package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListReports godoc
// @ID ListReports
// @Summary List Reports for a Project
// @Tags reports
// @Produce json
// @Param projectID path string true "Project ID"
// @Success 200 {object} schema.ReportListResponse
// @Router /v1/projects/{projectID}/reports [get]
func ListReports(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid projectID")
		}
		reports, err := reportService.ListByProject(c.Context(), int64(projectID))
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to fetch reports")
		}
		return c.JSON(schema.ReportListResponse{
			Reports: schema.NewReportResponseList(reports),
		})
	}
}

// CreateReport godoc
// @ID CreateReport
// @Summary Generate a new Report
// @Tags reports
// @Accept json
// @Produce json
// @Param request body schema.CreateReportRequest true "Report data"
// @Success 200 {object} schema.ReportResponse
// @Router /v1/projects/{projectID}/reports [post]
func CreateReport(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		req := new(schema.CreateReportRequest)
		if err := c.BodyParser(req); err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}
		report, err := reportService.Create(c.Context(), req)
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to create report")
		}
		return c.JSON(schema.NewReportResponse(*report))
	}
}

// DeleteReport godoc
// @ID DeleteReport
// @Summary Delete a Report
// @Tags reports
// @Produce json
// @Param projectID path string true "Project ID"
// @Param reportID path string true "Report ID"
// @Success 200 {object} map[string]string
// @Router /v1/projects/{projectID}/reports/{reportID} [delete]
func DeleteReport(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		reportID := c.Params("reportID")
		if err := reportService.DeleteByID(c.Context(), reportID); err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to delete report")
		}
		return c.JSON(fiber.Map{"message": "Report deleted successfully"})
	}
}

// DownloadReport godoc
// @ID DownloadReport
// @Summary Download a Report file
// @Tags reports
// @Produce application/octet-stream
// @Param projectID path string true "Project ID"
// @Param reportID path string true "Report ID"
// @Success 200 {file} binary
// @Router /v1/projects/{projectID}/reports/{reportID}/download [get]
func DownloadReport(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		reportID := c.Params("reportID")
		report, err := reportService.GetByID(c.Context(), reportID)
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "report not found")
		}
		if report.FilePath.Valid {
			return c.SendFile(report.FilePath.String)
		}
		return problemdetail.ServerErrorProblem(c, "report has no file to download")
	}
}
