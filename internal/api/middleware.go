package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	jwtware "github.com/gofiber/jwt/v2"
)

func (api *API) middleware() {
	app := api.app

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // TODO: use cors origins from configuration
	}))
	app.Use(pprof.New())
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))
}

// Protected protect routes
func RequireAuthentication(signingKey []byte) fiber.Handler {
	return jwtware.New(jwtware.Config{
		TokenLookup:  "header:Authorization,query:_auth,cookie:_qatarina_auth",
		SigningKey:   signingKey,
		ErrorHandler: jwtError,
	})
}

func jwtError(c *fiber.Ctx, err error) error {
	if err.Error() == "Missing or malformed JWT" {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": "error", "message": "Missing or malformed JWT", "data": nil})
	}
	return c.Status(fiber.StatusUnauthorized).
		JSON(fiber.Map{"status": "error", "message": "Invalid or expired JWT", "data": nil})
}
