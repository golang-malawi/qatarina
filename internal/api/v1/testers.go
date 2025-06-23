// Handlers for Testers endpoints
package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListTesters godoc
//
//	@ID				ListTesters
//	@Summary		List all Testers
//	@Description	List all Testers
//	@Tags			testers
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	schema.TesterListResponse
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/testers [get]
func ListTesters(testerService services.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testers, err := testerService.FindAll(context.Background())
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to fetch testers")
		}
		return c.JSON(fiber.Map{
			"testers": testers,
		})
	}
}

// SearchTesters godoc
//
//	@ID				SearchTesters
//	@Summary		Search all Testers
//	@Description	Search all Testers
//	@Tags			testers
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/testers.query [get]
func SearchTesters(services.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search Testers")
	}
}

// GetOneTester godoc
//
//	@ID				GetOneTester
//	@Summary		Get a Tester by ID
//	@Description	Get a Tester by ID
//	@Tags			testers
//	@Accept			json
//	@Produce		json
//	@Param			testerID	path		string	true	"Tester ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/testers/{testerID} [get]
func GetOneTester(services.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one Tester")
	}
}

// InviteTester godoc
//
//	@ID				InviteTester
//	@Summary		Invite a tester by Email
//	@Description	Invite a tester by Email
//	@Tags			testers
//	@Accept			json
//	@Produce		json
//	@Param			email	path		string		true	"Email of tester"
//	@Param			request	body		interface{}	true	"Invite data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/testers/invite/{email} [post]
func InviteTester(services.TesterService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to invite Tester")
	}
}
