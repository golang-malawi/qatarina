package api

import (
	"errors"
	"mime"
	"net/url"
	"os"
	"path"

	"github.com/gofiber/fiber/v2"
)

// serveStoredFile streams a file from the configured storage backend, so
// uploads are served the same way whether they live on disk or in S3.
func (api *API) serveStoredFile(c *fiber.Ctx) error {
	key, err := url.PathUnescape(c.Params("*"))
	if err != nil || key == "" {
		return fiber.ErrNotFound
	}

	info, err := api.Storage.Stat(key)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fiber.ErrNotFound
		}
		return err
	}
	if info.IsDir() {
		return fiber.ErrNotFound
	}

	f, err := api.Storage.Open(key)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fiber.ErrNotFound
		}
		return err
	}

	if contentType := mime.TypeByExtension(path.Ext(key)); contentType != "" {
		c.Set(fiber.HeaderContentType, contentType)
	}
	// SendStream closes f once the response has been written
	return c.SendStream(f, int(info.Size()))
}
