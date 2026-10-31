// Handlers for link previews
package v1

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// GetLinkPreview godoc
//
// @ID      GetLinkPreview
// @Summary Get preview metadata (title, description, image) for a URL
// @Description Fetches the page server side and reads its Open Graph tags. Only public http and https URLs are allowed.
// @Tags    link-previews
// @Produce json
// @Param   url query string true "URL to preview"
// @Success 200 {object} schema.LinkPreview
// @Failure 400 {object} problemdetail.ProblemDetail
// @Failure 404 {object} problemdetail.ProblemDetail
// @Router  /v1/link-preview [get]
func GetLinkPreview(linkPreviewService services.LinkPreviewService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		preview, err := linkPreviewService.Fetch(c.Context(), c.Query("url"))
		if err != nil {
			switch {
			case errors.Is(err, services.ErrInvalidPreviewURL), errors.Is(err, services.ErrBlockedPreviewHost):
				return problemdetail.BadRequest(c, err.Error())
			default:
				logger.Debug(loggedmodule.ApiLinkPreview, "no link preview", "url", c.Query("url"), "error", err)
				return problemdetail.NotFound(c, "no preview available for url")
			}
		}
		c.Set(fiber.HeaderCacheControl, "private, max-age=3600")
		return c.JSON(preview)
	}
}
