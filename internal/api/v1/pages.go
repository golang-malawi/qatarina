package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func CreatePage(page services.PageService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.PageRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiPages, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		request.LastEditedBy = int32(authutil.GetAuthUserID(c))
		request.CreatedBy = int32(authutil.GetAuthUserID(c))

		_, err := page.Create(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiPages, "failed to process request", "error", err)
			return problemdetail.BadRequest(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "page created successfully",
		})
	}
}

func GetOnePage(pageService services.PageService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		pageID, err := c.ParamsInt("id", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}

		page, err := pageService.GetOnePage(context.Background(), int32(pageID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiPages, "page not found", "error", err)
				return problemdetail.NotFound(c, "page not found")
			}

			logger.Error(loggedmodule.ApiPages, "failed to retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrieve page")
		}
		return c.JSON(page)
	}
}

func GetAllPages(pagesService services.PageService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pages, err := pagesService.GetAllPages(ctx.Context())
		if err != nil {
			logger.Error(loggedmodule.ApiPages, "failed to get all pages", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failled to process request")
		}
		return ctx.JSON(fiber.Map{
			"pages": pages,
		})
	}
}

func UpdatePage(pageService services.PageService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		request := new(schema.UpdatePageRequest)
		if validationErrors, err := common.ParseBodyThenValidate(ctx, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(ctx, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiPages, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(ctx, "failed to parse data in request")
		}

		request.LastEditedBy = int32(authutil.GetAuthUserID(ctx))
		request.CreatedBy = int32(authutil.GetAuthUserID(ctx))
		_, err := pageService.UpdatePage(ctx.Context(), *request)
		if err != nil {
			logger.Error(loggedmodule.ApiPages, "failed to process request", "error", err)
			return problemdetail.BadRequest(ctx, "failed to process request")
		}

		return ctx.JSON(fiber.Map{
			"message": "Page updated successfully",
		})
	}
}

func DeletePage(pageService services.PageService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pageIDParam := ctx.Params("id")
		pageID, err := strconv.Atoi(pageIDParam)
		if err != nil {
			return problemdetail.BadRequest(ctx, "failed to parse pageID data in request")
		}

		err = pageService.DeletePage(ctx.Context(), int32(pageID))
		if err != nil {
			logger.Error(loggedmodule.ApiPages, "failed to delete page", "error", err)
			return problemdetail.BadRequest(ctx, "failed to delete page")
		}
		return ctx.JSON(fiber.Map{
			"message": "Page deleted successfully",
			"pageID":  pageID,
		})
	}
}
