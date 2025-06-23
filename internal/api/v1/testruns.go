// Handlers for TestRuns endpoints
package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListTestRuns godoc
//
//	@ID				ListTestRuns
//	@Summary		List Test Runs
//	@Description	List Test Runs
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs [get]
func ListTestRuns(services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestRuns")
	}
}

// SearchTestRuns godoc
//
//	@ID				SearchTestRuns
//	@Summary		Search for Test Runs
//	@Description	Search for Test Runs
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/query [get]
func SearchTestRuns(services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestRuns")
	}
}

// GetOneTestRun godoc
//
//	@ID				GetOneTestRun
//	@Summary		Get one Test Run
//	@Description	Get one Test Run
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string	true	"Test Run ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/{testRunID} [get]
func GetOneTestRun(services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestRun")
	}
}

// CreateTestRun godoc
//
//	@ID				CreateTestRun
//	@Summary		Create a new Test Run
//	@Description	Create a new Test Run
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"Test Run data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs [post]
func CreateTestRun(services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestRun")
	}
}

// UpdateTestRun godoc
//
//	@ID				UpdateTestRun
//	@Summary		Update a Test Run
//	@Description	Update a Test Run
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string		true	"Test Run ID"
//	@Param			request		body		interface{}	true	"Test Run update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/{testRunID} [post]
func UpdateTestRun(services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestRun")
	}
}

// DeleteTestRun godoc
//
//	@ID				DeleteTestRun
//	@Summary		Delete a Test Run
//	@Description	Delete a Test Run
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string	true	"Test Run ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/{testRunID} [delete]
func DeleteTestRun(testRunService services.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testRunID := c.Params("testRunID", "")
		if testRunID == "" {
			return problemdetail.BadRequest(c, "invalid parameter in url for testRunID")
		}
		err := testRunService.DeleteByID(context.Background(), testRunID)
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(fiber.Map{
			"message": "Test Run deleted successfully",
		})
	}
}

// CommitTestRun godoc
//
//	@ID				CommitTestRun
//	@Summary		Mark a Test Run as committed
//	@Description	Mark a Test Run as committed
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string		true	"Test Run ID"
//	@Param			request		body		schema.CommitTestRunResult	true	"Test Run update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/{testRunID}/commit [post]
func CommitTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		request := new(schema.CommitTestRunResult)
		_, err := common.ParseBodyThenValidate(ctx, request)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid data in the request", err)
		}

		testRunID := ctx.Params("testRunID", "")
		if request.TestRunID != testRunID {
			return problemdetail.BadRequest(ctx, "'test_run_id' in request body and parameter does not match")
		}
		request.UserID = authutil.GetAuthUserID(ctx)

		testRun, err := testRunService.Commit(context.Background(), request)
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"testRun": testRun,
		})
	}
}

func CommitBulkTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		request := new(schema.BulkCommitTestResults)
		_, err := common.ParseBodyThenValidate(ctx, request)
		if err != nil {
			return problemdetail.ValidationErrors(ctx, "invalid data in the request", err)
		}
		request.UserID = authutil.GetAuthUserID(ctx)
		_, err = testRunService.CommitBulk(context.Background(), request)
		if err != nil {
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"message": "Committed all test test results",
		})
	}
}
