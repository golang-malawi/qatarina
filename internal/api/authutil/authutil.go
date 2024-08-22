package authutil

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

func GetAuthUserID(ctx *fiber.Ctx) int64 {
	token := ctx.Locals("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userID := claims["UserID"].(float64)
	return int64(userID)
}

func GetAuthUsername(ctx *fiber.Ctx) string {
	token := ctx.Locals("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	username := claims["Name"].(string)
	return string(username)
}
