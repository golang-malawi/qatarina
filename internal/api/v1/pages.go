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

// CreatePage godoc
//
//	@ID				CreatePage
//	@Summary		Create a page
//	@Description	Create a page
//	@Tags			pages
//	@Accept			json
//	@Produce		json
//	@Param			request	body	schema.PageRequest			true	"Page data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/pages/pages [post]
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

// GetOnePage godoc
//
//	@ID				GetOnePage
//	@Summary		Get one page
//	@Description	Get one page
//	@Tags			pages
//	@Accept			json
//	@Produce		json
//	@Param			pageID	path		string	true	"pageID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/pages/{pageID} [get]
func GetOnePage(pageService services.PageService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		pageID, err := c.ParamsInt("pageID", 0)
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

// GetAllPages godoc
//
//	@ID				GetAllPages
//	@Summary		Get all pages
//	@Description	Get all pages
//	@Tags			pages
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/pages/pages [get]
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

// UpdatePage godoc
//
//	@ID				UpdatePage
//	@Summary		Update a page
//	@Description	Update a page
//	@Tags			pages
//	@Accept			json
//	@Produce		json
//	@Param			pageID	path		string	true	"id"
//	@Param			request	body		schema.UpdatePageRequest	true	"id"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/pages/pages/{id} [post]
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

// DeletePage godoc
//
//	@ID				DeletePage
//	@Summary		Delete a page
//	@Description	Delete a page
//	@Tags			pages
//	@Accept			json
//	@Produce		json
//	@Param			pageID	path		string	true	"pageID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/pages/{pageID} [delete]
func DeletePage(pageService services.PageService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pageIDParam := ctx.Params("pageID")
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
