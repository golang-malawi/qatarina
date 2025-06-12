package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func Modules(c *fiber.Ctx) error {
	request := new(schema.ModulesRequest)
	_, err := common.ParseBodyThenValidate(c, request)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "failed to process request - invalid input",
		})
	}
	var moduleService services.ModuleService
	_, err = moduleService.Create(
		request.ProjectID,
		request.Name,
		request.Code,
		request.Priority,
	)
	if err != nil {
		return c.JSON(fiber.Map{
			"message": "failed to create module",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Module created successfully",
	})
}
