// Handlers for Testers endpoints
package v1

import (
	"context"
	"database/sql"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
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
func ListTesters(testerService services.TesterService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testers, err := testerService.FindAll(context.Background())
		if err != nil {
			logger.Error(loggedmodule.ApiTesters, "failed to fetch testers", "error", err)
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
func SearchTesters(testerService services.TesterService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectIDParam := c.Query("q", "")
		projectID, err := strconv.Atoi(projectIDParam)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request project id")
		}
		testers, err := testerService.FindByProjectID(c.Context(), int64(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiTesters, "no testers found", "error", err)
				return c.JSON([]schema.Tester{})
			}
			logger.Error(loggedmodule.ApiTesters, "failed to find testers", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to find testers")
		}
		return c.JSON(testers)
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
func GetOneTester(testerService services.TesterService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testerID, err := c.ParamsInt("testerID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse tester id data in request")
		}

		tester, err := testerService.FindByID(c.Context(), int32(testerID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiTesters, "no project tester found", "error", err)
				return problemdetail.NotFound(c, "no project tester found")
			}
			logger.Error(loggedmodule.ApiTesters, "failed to retrieve project tester", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to retrieve project tester")
		}
		return c.JSON(tester)
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
//	@Param			request	body		schema.InviteTesterRequest true	"Invite data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/testers/invite [post]
func InviteTester(testerService services.TesterService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.InviteTesterRequest
		if validationErrors, err := common.ParseBodyThenValidate(c, &req); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTesters, "failed to parse request body", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		if req.Email == "" {
			return problemdetail.BadRequest(c, "No email address in request")
		}

		senderEmail := authutil.GetAuthUserEmail(c)
		if senderEmail == "" {
			return problemdetail.BadRequest(c, "Sender not authenticated")
		}

		err := testerService.Invite(c.Context(), senderEmail, req.Email, req.TestCaseID, req.ProjectID)
		if err != nil {
			logger.Error(loggedmodule.ApiTesters, "failed to send tester invite", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to send tester invite")
		}

		return c.JSON(fiber.Map{
			"message": "Tester invite sent",
		})
	}
}
