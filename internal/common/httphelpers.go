package common

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/validation"
)

func ParseBodyThenValidate(ctx *fiber.Ctx, v any) (bool, error) {
	err := ctx.BodyParser(v)
	if err != nil {
		return false, err
	}

	errors := validation.ValidateStruct(v)
	if errors != nil {
		return true, errors
	}

	return false, nil
}
