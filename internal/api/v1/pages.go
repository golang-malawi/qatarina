package v1

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
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
			logger.Error("api-pages", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		request.LastEditedBy = int32(authutil.GetAuthUserID(c))
		request.CreatedBy = int32(authutil.GetAuthUserID(c))

		_, err := page.Create(context.Background(), request)
		if err != nil {
			logger.Error("api-pages", "failed to process request", "error", err)
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
		fmt.Println("GetOnePage handler triggered with ID:", pageID)

		page, err := pageService.GetOnePage(context.Background(), int32(pageID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error("v1-pages", "page not found", "error", err)
			}

			logger.Error("v1-pages", "failed to retrieve request data", "error", err)
			return problemdetail.BadRequest(c, "failed to retrieve page")
		}
		return c.JSON(page)
	}
}

func GetAllPages(pagesService services.PageService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pages, err := pagesService.GetAllPages(ctx.Context())
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failled to process request")

		}
		return ctx.JSON(fiber.Map{
			"pages": pages,
		})
	}
}
