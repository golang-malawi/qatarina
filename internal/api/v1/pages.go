package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"gorm.io/gorm/logger"
)

func CreatePage(page services.PageService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.PageRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-pages", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := page.Create(request)
		if err != nil {
			logger.Error("api-modules", "failed to process request", "error", err)
			return problemdetail.BadRequest(c, "failed to process equest")
		}

		return c.JSON(fiber.Map{
			"message": "page created sucessfuly",
		})
	}
}
