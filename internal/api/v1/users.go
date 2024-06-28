package v1

import "github.com/gofiber/fiber/v2"

func UsersRoutes(router fiber.Router) {
	router.Get("/", nil)
}
