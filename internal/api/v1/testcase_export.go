package v1

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ExportFileFromTestCases godoc
//
//	@ID				ExportFileFromTestCases
//	@Summary		Export test cases to a CSV or XLSX file
//	@Description	Export test cases to a CSV or XLSX file
//	@Tags			test-cases
//	@Accept			json
//	@Produce		application/octet-stream
//	@Param			request	body		schema.ExportTestCasesRequest	true	"Export request data"
//	@Success		200		{file}		binary
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/export-file [post]
func ExportFileFromTestCases(logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ExportTestCasesRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid export data", err)
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to parse export request", "error", err)
			return problemdetail.BadRequest(c, "failed to parse export data")
		}

		testCases := make([]services.TestCase, 0, len(request.TestCases))
		for _, tc := range request.TestCases {
			testCases = append(testCases, services.TestCase{
				Title:           tc.Title,
				Description:     tc.Description,
				Kind:            tc.Kind,
				Code:            tc.Code,
				FeatureOrModule: tc.FeatureOrModule,
				Tags:            tc.Tags,
				IsDraft:         tc.IsDraft,
			})
		}

		exportService := services.ExportFileService{
			TestCases: testCases,
		}

		var (
			data        []byte
			err         error
			contentType string
			extension   string
		)

		switch strings.ToUpper(request.FileFormat) {
		case "CSV":
			data, err = exportService.ToCSV()
			contentType = "text/csv"
			extension = ".csv"
		case "XLSX", "":
			data, err = exportService.ToXLSX()
			contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			extension = ".xlsx"
		default:
			return problemdetail.BadRequest(c, "invalid fileformat: must be CSV or XLSX")
		}

		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to export test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to export test cases")
		}

		fileName := strings.TrimSpace(request.FileName)
		if fileName == "" {
			fileName = "qatarina-testcases"
		} else {
			fileName = strings.TrimSuffix(fileName, extension)
		}
		fileName += extension

		c.Set(fiber.HeaderContentType, contentType)
		c.Set(fiber.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s"`, fileName))

		return c.Send(data)
	}
}
