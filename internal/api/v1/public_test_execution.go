package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// GetPublicTestCase godoc
//
//	@ID				GetPublicTestCase
//	@Summary		Get a testcase by invite token
//	@Description	Get a testcase by invite token
//	@Tags			public-test-execution
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string	true	"Invite token"
//	@Success		200			{object}	schema.PublicTestCaseResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/test-execution/{token} [get]
func GetPublicTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Params("token", "")
		if token == "" {
			return problemdetail.BadRequest(c, "missing invite token")
		}

		testCase, err := testCaseService.FindByInviteToken(context.Background(), token)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to get test case by token", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch testcase")
		}
		if testCase == nil {
			return problemdetail.NotFound(c, "no testcase found for this invite")
		}

		return c.JSON(schema.NewPublicTestCaseResponse(testCase))
	}
}

// RecordPublicTestResult godoc
//
//	@ID				RecordPublicTestResult
//	@Summary		Record a testcase execution result
//	@Description	Record a testcase execution result
//	@Tags			public-test-execution
//	@Accept			json
//	@Produce		json
//	@Param			token	path		string	true	"Invite token"
//	@Param			request	body		schema.PublicTestResultRequest	true	"Execution result"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/test-execution/{token} [post]
func RecordPublicTestResult(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Params("token", "")
		if token == "" {
			return problemdetail.BadRequest(c, "missing invite token")
		}

		request := new(schema.PublicTestResultRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestRuns, "failed to parse request body", "error", err)
			return problemdetail.BadRequest(c, "failed to parse request body")
		}

		err := testRunService.RecordPublicResult(context.Background(), token, request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to record test result", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to record result")
		}

		return c.JSON(fiber.Map{
			"message": "Result recorded successfully",
		})
	}
}
