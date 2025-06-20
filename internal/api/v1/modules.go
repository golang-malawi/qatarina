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

func CreateModule(module services.ModuleService) fiber.Handler {
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

func GetOneModule(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		moduleID, err := c.ParamsInt("id", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}

		module, err := module.GetOne(context.Background(), int32(moduleID))
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

func GetAllModules(moduleService services.ModuleService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		modules, err := moduleService.GetAll(context.Background())
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"modules": modules,
		})
	}
}

func UpdateModule(module services.ModuleService) fiber.Handler {
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
func DeleteModule(module services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		moduleIdParam := c.Params("id")
		moduleID, err := strconv.Atoi(moduleIdParam)
		if err != nil {
			logger.Error("v1-modules", "failed to parse module projectID data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		err = module.Delete(context.Background(), int32(moduleID))
		if err != nil {
			logger.Error("v1-modules", "failed delete module", "error", err)
			return problemdetail.BadRequest(c, "failed to delete module")
		}
		return c.JSON(fiber.Map{
			"message":  "Module deleted sucessfully",
			"moduleID": moduleID,
		})
	}
}

func GetProjectModules(modules services.ModuleService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		modules, err := modules.GetProjectModules(context.Background(), int32(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error("v1-modules", "modules not found", "error", err)
				return problemdetail.BadRequest(c, "failed to find modules in request")
			}

			logger.Error("v1-modules", "failed retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrive modules")
		}
		return c.JSON(modules)
	}

}
