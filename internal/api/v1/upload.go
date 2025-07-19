package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func UploadDocument(uploadService services.UploadService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// uploadRequest := new(schema.UploadDocumentRequest)
		// if validationErrors, err := common.ParseBodyThenValidate(c, uploadRequest); err != nil {
		// 	if validationErrors {
		// 		return problemdetail.ValidationErrors(c, "invalid data in request", err)
		// 	}
		// 	logger.Error(loggedmodule.ApiUploads, "failed to parse request data", "error", err)
		// 	return problemdetail.BadRequest(c, "failed to parse data in request")
		// }
		file, err := c.FormFile("document")
		if err != nil {
			logger.Error(loggedmodule.ApiUploads, "failed to get upload file", "error", err)
			return problemdetail.BadRequest(c, "invalid upload request")
		}

		err = uploadService.CreateUpload(c.Context(), file)
		if err != nil {
			logger.Error(loggedmodule.ApiUploads, "failed to create upload", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create upload")
		}

		return c.JSON(fiber.Map{
			"message": "File uploaded successfully",
		})

	}

}
