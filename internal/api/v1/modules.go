package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

var logger logging.Logger

func Modules(c *fiber.Ctx) error {
	request := new(schema.ModulesRequest)
	_, err := common.ParseBodyThenValidate(c, request)
	if err != nil {
		logger.Error("v1-modules", "failed to parse request data", "error", err)
		return problemdetail.BadRequest(c, "failed to parse data in request")
	}
	var moduleService services.ModuleService
	_, err = moduleService.Create(
		request.ProjectID,
		request.Name,
		request.Code,
		request.Priority,
	)
	if err != nil {
		logger.Error("v1-modules", "failed to process request", "error", err)
		return problemdetail.ServerErrorProblem(c, "failed to process request")
	}

	return c.JSON(fiber.Map{
		"message": "Module created successfully",
	})
}
