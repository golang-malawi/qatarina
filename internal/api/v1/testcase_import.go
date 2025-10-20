package v1

import (
	"context"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ImportTestCasesFromFile godoc
//
//	@ID				ImportTestCasesFromFile
//	@Summary		Import test cases from Excel or CSV file
//	@Description	Import test cases from Excel or CSV file
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID formData	path		string	true	"Project ID"
//	@Param			request	body		file	true	"Excel or CSV file"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/import-file [post]
func ImportTestCasesFromFile(testCaseService services.TestCaseService, importService services.TestCaseImportService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectIDStr := c.FormValue("projectID")
		projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "invalid project ID")
		}

		// Retrieve uploaded file
		fileHeader, err := c.FormFile("file")
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to retrieve uploaded file", "error", err)
			return problemdetail.BadRequest(c, "file is required")
		}

		file, err := fileHeader.Open()
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to open uploaded file", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to open uploaded file")
		}
		defer file.Close()

		// Parse file contents into test cases
		testCases, err := importService.FromFile(c.Context(), projectID, file, fileHeader.Filename)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to parse test cases", "filename", fileHeader.Filename, "error", err)
			return problemdetail.ServerErrorProblem(c, err.Error())
		}

		// Bulk create test cases
		request := &schema.BulkCreateTestCases{
			ProjectID: projectID,
			TestCases: testCases,
		}

		_, err = testCaseService.BulkCreate(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to import test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to import test cases")
		}

		message := fmt.Sprintf("Imported %d test cases", len(testCases))
		return c.JSON(fiber.Map{
			"message": message,
		})
	}
}
