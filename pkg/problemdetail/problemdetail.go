package problemdetail

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type ProblemDetail struct {
	Type    string `json:"type"`
	Title   string `json:"title"`
	Detail  string `json:"detail"`
	Context any    `json:"context"`
}

func BadRequestProblemDetail(message string) ProblemDetail {
	return ProblemDetail{
		Type:    "problemdetail.example.com/http/types/BadRequest",
		Title:   "Invalid data in the request body",
		Detail:  message,
		Context: nil,
	}
}

func BadRequestProblemDetailWithContext(message string, context any) ProblemDetail {
	return ProblemDetail{
		Type:    "problemdetail.example.com/http/types/BadRequest",
		Title:   "Invalid data in the request body",
		Detail:  message,
		Context: context,
	}
}

func BadRequestWithContext(ctx *fiber.Ctx, message string, context any) error {
	return ctx.Status(http.StatusBadRequest).JSON(BadRequestProblemDetailWithContext(message, context))
}

func PaymentRequiredProblemDetail(message string) ProblemDetail {
	return ProblemDetail{
		Type:    "problemdetail.example.com/http/types/PaymentRequired",
		Title:   "Payment is required to perform the operation....",
		Detail:  message,
		Context: nil,
	}
}

func ServerErrorProblemDetail(message string) ProblemDetail {
	return ProblemDetail{
		Type:    "problemdetail.example.com/http/types/ServerError",
		Title:   message,
		Detail:  message,
		Context: nil,
	}
}

func ServerErrorProblemDetailWithContext(message string, context any) ProblemDetail {
	return ProblemDetail{
		Type:    "problemdetail.example.com/http/types/ServerError",
		Title:   message,
		Detail:  message,
		Context: context,
	}
}

func ServerErrorProblemWithContext(ctx *fiber.Ctx, message string, context any) error {
	return ctx.Status(http.StatusInternalServerError).JSON(ServerErrorProblemDetailWithContext(message, context))
}

func NotAuthorizedProblem(ctx *fiber.Ctx, message string) error {
	return ctx.Status(http.StatusUnauthorized).JSON(BadRequestProblemDetail(message))
}

func ServerErrorProblem(ctx *fiber.Ctx, message string) error {
	return ctx.Status(http.StatusInternalServerError).JSON(ServerErrorProblemDetail(message))
}

func BadRequest(ctx *fiber.Ctx, message string) error {
	return ctx.Status(http.StatusBadRequest).JSON(BadRequestProblemDetail(message))
}

func NotFound(ctx *fiber.Ctx, message string) error {
	return ctx.Status(http.StatusNotFound).JSON(ProblemDetail{
		Type:    "problemdetail.example.com/http/types/NotFound",
		Title:   "Not Found",
		Detail:  message,
		Context: nil,
	})
}

func NotImplemented(ctx *fiber.Ctx, message string) error {
	return ctx.Status(http.StatusNotImplemented).JSON(ProblemDetail{
		Type:    "problemdetail.example.com/http/types/NotImplemented",
		Title:   "Not Implemented",
		Detail:  message,
		Context: nil,
	})
}

func ValidationErrors(ctx *fiber.Ctx, message string, validationErrors any) error {
	return ctx.Status(http.StatusBadRequest).JSON(ProblemDetail{
		Type:    "problemdetail.example.com/http/types/BadRequest",
		Title:   "Invalid data in the request body",
		Detail:  message,
		Context: validationErrors,
	})
}
