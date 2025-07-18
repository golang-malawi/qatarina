package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

//	 CreateModule godoc
//
//		@ID	CreateModule
//		@Summary	Create a Module
//		@Description	Create a Module
//		@Tags	modules
//		@Accept			json
//		@Produce		json
//		@Param			request	body		schema.CreateProjectModuleRequest	true	"Module data"
//		@Success		200			{object}	interface{}
//		@Failure		400			{object}	problemdetail.ProblemDetail
//		@Failure		500			{object}	problemdetail.ProblemDetail
//		@Router			/v1/modules [post]
func CreateModule(module services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateProjectModuleRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiModules, "failed to parse request data", "error", err)
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

// GetOneModule godoc
//
//	@ID				GetOneModule
//	@Summary		Get one Module
//	@Description	Get one Module
//	@Tags			modules
//	@Accept			json
//	@Produce		json
//	@Param			moduleID	path		string	true	"moduleID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/modules/{moduleID} [get]
func GetOneModule(module services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		moduleID, err := c.ParamsInt("moduleID", 0)
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

// GetAllModules godoc
//
//	@ID				GetAllModules
//	@Summary		Get all Modules
//	@Description	Get all Modules
//	@Tags			modules
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/modules [get]
func GetAllModules(moduleService services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		modules, err := moduleService.GetAll(context.Background())
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return problemdetail.NotFound(ctx, "no modules found for this project")
			}
			logger.Error(loggedmodule.ApiModules, "faild to get modules", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"modules": modules,
		})
	}
}

// UpdateModule godoc
//
//	@ID				UpdateModule
//	@Summary		Update a Module
//	@Description	Update a Module
//	@Tags			modules
//	@Accept			json
//	@Produce		json
//	@Param			moduleID	path		string	true	"moduleID"
//	@Param			request	body		schema.UpdateProjectModuleRequest	true	"id"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/modules/{moduleID} [post]
func UpdateModule(module services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateProjectModuleRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiModules, "failed to parse request data", "error", err)
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

// DeleteModule godoc
//
//	@ID				DeleteModule
//	@Summary		Delete a Module
//	@Description	Delete a Module
//	@Tags			modules
//	@Accept			json
//	@Produce		json
//	@Param			moduleID	path		string	true	"moduleID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/modules/{moduleID} [delete]
func DeleteModule(module services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		moduleIdParam := c.Params("moduleID")
		moduleID, err := strconv.Atoi(moduleIdParam)
		if err != nil {
			logger.Error(loggedmodule.ApiModules, "failed to parse module projectID data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		err = module.Delete(context.Background(), int32(moduleID))
		if err != nil {
			logger.Error(loggedmodule.ApiModules, "failed delete module", "error", err)
			return problemdetail.BadRequest(c, "failed to delete module")
		}
		return c.JSON(fiber.Map{
			"message":  "Module deleted sucessfully",
			"moduleID": moduleID,
		})
	}
}

// GetProjectModule godoc
//
//	@ID				GetProjectModule
//	@Summary		Get a Modules by project
//	@Description	Get a Modules by project
//	@Tags			modules
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"projectID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/modules/{projectID} [get]
func GetProjectModules(modules services.ModuleService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse projectID data in request")
		}

		modules, err := modules.GetProjectModules(context.Background(), int32(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error(loggedmodule.ApiModules, "modules not found", "error", err)
				return problemdetail.BadRequest(c, "failed to find modules in request")
			}

			logger.Error(loggedmodule.ApiModules, "failed retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrive modules")
		}
		return c.JSON(modules)
	}

}
