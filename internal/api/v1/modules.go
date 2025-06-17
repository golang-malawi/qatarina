package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

var logger logging.Logger

func Module(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateProjectModuleRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-modules", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := module.Create(request)
		if err != nil {
			logger.Error("api-modules", "failed to process request", "error", err)
			return problemdetail.BadRequest(c, "failed to process equest")
		}

		return c.JSON(fiber.Map{
			"message": "Module created sucessfuly",
		})
	}
}

func GetProjectModule(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectIdParam := c.Params("projectID")
		projectID, err := strconv.Atoi(projectIdParam)
		if err != nil {
			logger.Error("v1-modules", "failed to parse module project ID data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		module, err := module.Get(context.Background(), int32(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error("v1-modules", "module not found", "error", err)
				return problemdetail.BadRequest(c, "failed to find module in request")
			}

			logger.Error("v1-modules", "failed retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrive module")
		}
		return c.JSON(module)
	}

}

func UpdateProjectModule(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateProjectModuleRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-modules", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := module.Update(context.Background(), *request)
		if err != nil {
			logger.Error("api-modules", "failed to process request", "error", err)
			return problemdetail.BadRequest(c, "failed to process equest")
		}

		return c.JSON(fiber.Map{
			"message": "Module updated sucessfuly",
		})
	}
}
func DeleteProjectModule(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectIdParam := c.Params("projectID")
		projectID, err := strconv.Atoi(projectIdParam)
		if err != nil {
			logger.Error("v1-modules", "failed to parse module projectID data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		err = module.Delete(context.Background(), int32(projectID))
		if err != nil {
			logger.Error("v1-modules", "failed delete module", "error", err)
			return problemdetail.BadRequest(c, "failed to delete module")
		}
		return c.JSON(fiber.Map{
			"message":   "Module deleted sucessfully",
			"projectID": projectID,
		})
	}
}
