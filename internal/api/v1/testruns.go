// Handlers for TestRuns endpoints
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
func ListTestRuns(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testRuns, err := testRunService.FindAll(context.Background())
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to list test runs")
			return problemdetail.ServerErrorProblem(c, "failed to fetch test runs")
		}
		return c.JSON(fiber.Map{
			"test_runs": testRuns,
		})
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
func SearchTestRuns(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := strconv.Atoi(c.Query("q"))
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "invalid parameter query", "error", err)
			return problemdetail.BadRequest(c, "invalid or missing projectID parameter in query")
		}

		testRun, err := testRunService.FindAllByProjectID(c.Context(), int64(projectID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiTestRuns, "test run not found", "error", err)
				return c.JSON(schema.TestPlanListResponse{})
			}
			logger.Error(loggedmodule.ApiTestRuns, "failed to find test run", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to find a test run")
		}

		return c.JSON(testRun)
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
func GetOneTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testRunID := c.Params("testRunID")
		testRun, err := testRunService.GetOneTestRun(c.Context(), testRunID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to get a test run", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(testRun)
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
func CreateTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.TestRunRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestRuns, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")

		}

		_, err := testRunService.Create(c.Context(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test run created",
		})
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
func UpdateTestRun(testRunservice services.TestRunService, logger logging.Logger) fiber.Handler {
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
func DeleteTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
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
			logger.Debug(loggedmodule.ApiTestRuns, "cannot to commit test-run with mismatching ids", "param", testRunID, "requestBodyID", request.TestRunID)
			return problemdetail.BadRequest(ctx, "'test_run_id' in request body and parameter does not match")
		}
		request.UserID = authutil.GetAuthUserID(ctx)

		testRun, err := testRunService.Commit(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to commit test-run results", "error", err)
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
			logger.Debug(loggedmodule.ApiTestRuns, "failed to commit bulk test results", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to process request")
		}
		return ctx.JSON(fiber.Map{
			"message": "Committed all test test results",
		})
	}
}

// ExecuteTestRun godoc
//
//	@ID				ExecuteTestRun
//	@Summary		Execute a Test Run
//	@Description	Execute a Test Run
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string	true	"Test Run ID"
//	@Param			request	body		schema.ExecuteTestRunRequest	true	"Execution data"
//	@Success		200			{object}	schema.TestRunResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-runs/{testRunID}/execute [post]
func ExecuteTestRun(testRunService services.TestRunService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		pathID := c.Params("testRunID")

		request := new(schema.ExecuteTestRunRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid execution data", err)
			}
			logger.Error(loggedmodule.ApiTestRuns, "failed to parse execution request", "error", err)
			return problemdetail.BadRequest(c, "failed to parse execution data")
		}

		if request.ID != "" && request.ID != pathID {
			return problemdetail.BadRequest(c, "path parameter and body ID do not match")
		}
		request.ID = pathID

		userID := authutil.GetAuthUserID(c)
		request.ExecutedBy = userID

		// Validation checks
		tr, err := testRunService.GetOneTestRun(c.Context(), pathID)
		if errors.Is(err, sql.ErrNoRows) {
			logger.Info(loggedmodule.ApiTestRuns, "test run not found", "testRunID", pathID)
			return problemdetail.BadRequest(c, "test run not found")
		}
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "db error fetching test run", "testRunID", pathID)
			return problemdetail.ServerErrorProblem(c, "error fetching test run")
		}

		if tr.IsClosed.Valid && tr.IsClosed.Bool {
			logger.Debug(loggedmodule.ApiTestRuns, "attempt to execute closed run", "testRunID", pathID)
			return problemdetail.BadRequest(c, "test run already closed")
		}

		if tr.AssignedToID != int32(userID) {
			return problemdetail.BadRequest(c, "cannot execute another user's test run")
		}

		// Check if test plan is active
		planActive, err := testRunService.IsTestPlanActive(c.Context(), int64(tr.TestPlanID))
		if errors.Is(err, sql.ErrNoRows) {
			return problemdetail.BadRequest(c, "test plan not found")
		}
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "db error fetching test plan", "testPlanID", pathID)
			return problemdetail.ServerErrorProblem(c, "error fetching test plan")
		}
		if !planActive {
			return problemdetail.BadRequest(c, "test plan is closed")
		}

		// Check test case active
		caseActive, err := testRunService.IsTestCaseActive(c.Context(), tr.TestCaseID.String())
		if errors.Is(err, sql.ErrNoRows) {
			return problemdetail.BadRequest(c, "test case not found")
		}
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "db error fetching test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "error fetching test case")
		}
		if !caseActive {
			return problemdetail.BadRequest(c, "test case is inactive")
		}

		executed, err := testRunService.Execute(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to execute test run", "testRunID", pathID)
			return problemdetail.ServerErrorProblem(c, "failed to execute test run")
		}

		return c.JSON(fiber.Map{
			"test_run": schema.NewTestRunResponse(executed),
		})
	}
}
