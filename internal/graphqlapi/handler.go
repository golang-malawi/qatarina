package graphqlapi

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/graph-gophers/graphql-go"
)

type request struct {
	Query         string         `json:"query"`
	OperationName string         `json:"operationName"`
	Variables     map[string]any `json:"variables"`
}

// Handler serves GraphQL requests sent as POST with a JSON body:
//
//	{"query": "...", "operationName": "...", "variables": {...}}
//
// It must be mounted behind the authentication middleware.
func Handler(s *graphql.Schema) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req request
		if err := json.Unmarshal(c.Body(), &req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"errors": []fiber.Map{{"message": "request body must be JSON with a \"query\" field"}},
			})
		}
		if req.Query == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"errors": []fiber.Map{{"message": "missing \"query\""}},
			})
		}

		resp := s.Exec(c.UserContext(), req.Query, req.OperationName, req.Variables)
		return c.JSON(resp)
	}
}
