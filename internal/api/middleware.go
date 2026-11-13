package api

import (
	"errors"
	"fmt"
	"os"
	"runtime/debug"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	jwtware "github.com/gofiber/jwt/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func (api *API) middleware() {
	app := api.app

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // TODO: use cors origins from configuration
		AllowMethods: "*",
	}))
	app.Use(pprof.New())

	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e interface{}) {
			if api.logger != nil {
				api.logger.Error("failed to process a request", "errorStackTrace", fmt.Sprintf("panic: %v\n%s\n", e, debug.Stack()))
			} else {
				_, _ = os.Stderr.WriteString(fmt.Sprintf("panic: %v\n%s\n", e, debug.Stack())) //nolint:errcheck
			}
		},
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))
}

// RequireAuthentication protects routes: the request must carry a valid JWT
// AND the user it was issued to must still be active. JWTs are stateless, so
// without the second check a deactivated user's token keeps working until it
// expires.
func RequireAuthentication(signingKey []byte, userService services.UserService, logger logging.Logger) fiber.Handler {
	return jwtware.New(jwtware.Config{
		TokenLookup:  "header:Authorization,query:_auth,cookie:_qatarina_auth",
		SigningKey:   signingKey,
		ErrorHandler: jwtError,
		SuccessHandler: func(c *fiber.Ctx) error {
			userID, ok := tokenUserID(c)
			if !ok {
				return jwtError(c, errors.New("token has no UserID claim"))
			}
			active, err := userService.IsActive(c.Context(), int32(userID))
			if err != nil {
				logger.Error("auth-middleware", "failed to check if user is active", "userID", userID, "error", err)
				return problemdetail.ServerErrorProblem(c, "failed to verify user")
			}
			if !active {
				return c.Status(fiber.StatusUnauthorized).
					JSON(fiber.Map{"status": "error", "message": "User account is deactivated", "data": nil})
			}
			return c.Next()
		},
	})
}

func tokenUserID(c *fiber.Ctx) (int64, bool) {
	token, ok := c.Locals("user").(*jwt.Token)
	if !ok {
		return 0, false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, false
	}
	userID, ok := claims["UserID"].(float64)
	return int64(userID), ok
}

func jwtError(c *fiber.Ctx, err error) error {
	if err.Error() == "Missing or malformed JWT" {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": "error", "message": "Missing or malformed JWT", "data": nil})
	}
	return c.Status(fiber.StatusUnauthorized).
		JSON(fiber.Map{"status": "error", "message": "Invalid or expired JWT", "data": nil})
}
