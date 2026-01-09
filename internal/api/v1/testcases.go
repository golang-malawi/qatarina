// Handlers for TestCases endpoints
package v1

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/google/uuid"
)

// ListTestCases godoc
//
//	@ID				ListTestCases
//	@Summary		List Test Cases
//	@Description	List Test Cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	schema.TestCaseListResponse
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases [get]
func ListTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCases, err := testCasesService.FindAll(context.Background())
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch test cases")
		}
		return c.JSON(fiber.Map{
			"test_cases": schema.NewTestCaseResponseList(testCases),
		})
	}
}

// SearchTestCases godoc
//
//	@ID				SearchTestCases
//	@Summary		Search for Test Cases
//	@Description	Search for Test Cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	schema.TestCaseListResponse
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/query [get]
func SearchTestCases(testCaseService services.TestCaseService) fiber.Handler {
	return func(q *fiber.Ctx) error {
		keyword := q.Query("keyword", "")
		if keyword == "" {
			return problemdetail.BadRequest(q, "missing keyword parameter")
		}

		testCases, err := testCaseService.Search(q.Context(), keyword)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return q.JSON([]dbsqlc.TestCase{})
			}
		}
		return q.JSON(testCases)
	}
}

// GetOneTestCase godoc
//
//	@ID				GetOneTestCase
//	@Summary		Get a single Test Case
//	@Description	Get a single Test Case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	schema.TestCaseResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID} [get]
func GetOneTestCase(testCaseService services.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCaseID := c.Params("testCaseId", "")
		testCase, err := testCaseService.FindByID(context.Background(), testCaseID)
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to fetch test case with given id")
		}
		return c.JSON(fiber.Map{
			"test_case": schema.NewTestCaseResponse(testCase),
		})
	}
}

// CreateTestCase godoc
//
//	@ID				CreateTestCase
//	@Summary		Create a new Test Case
//	@Description	Create a new Test Case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.CreateTestCaseRequest	true	"Create Test Case data"
//	@Success		200		{object}	schema.TestCaseResponse
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases [post]
func CreateTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateTestCaseRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		testCase, err := testCaseService.Create(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to create a test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create a test case")
		}

		return c.JSON(schema.NewTestCaseResponse(testCase))
	}
}

// BulkCreateTestCases godoc
//
//	@ID				BulkCreateTestCases
//	@Summary		Create multiple Test Cases at once
//	@Description	Create multiple Test Cases at once
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.BulkCreateTestCases	true	"Bulk Create Test Case data"
//	@Success		200		{object}	schema.TestCaseListResponse
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/bulk [post]
func BulkCreateTestCases(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.BulkCreateTestCases)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		testCases, err := testCaseService.BulkCreate(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to create test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create test cases")
		}

		return c.JSON(schema.TestCaseListResponse{
			TestCases: schema.NewTestCaseResponseList(testCases),
		})
	}
}

// UpdateTestCase godoc
//
//	@ID				UpdateTestCase
//	@Summary		Update a Test Case
//	@Description	Update a Test Case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string		true	"Test Case ID"
//	@Param			request		body		schema.UpdateTestCaseRequest	true	"Test Case update data"
//	@Success		200			{object}	schema.TestCaseResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID} [post]
func UpdateTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateTestCaseRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := testCaseService.Update(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test cases updated",
		})
	}
}

// DeleteTestCase godoc
//
//	@ID				DeleteTestCase
//	@Summary		Delete a test case
//	@Description	Delete a test case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	map[string]string	"Success message"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID} [delete]
func DeleteTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCaseIDParam := c.Params("testCaseID")

		err := testCaseService.DeleteByID(c.Context(), testCaseIDParam)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Error("test case not found", "error", err)
				return problemdetail.ServerErrorProblem(c, "no test case to delete")
			}
			logger.Error("failed to delete test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to delete case")
		}

		return c.JSON(fiber.Map{
			"message": "Test case deleted successfully",
		})
	}
}

// ListAssignedTestCases godoc
//
//	@ID				ListAssignedTestCases
//	@Summary		List Test Cases assigned to the current user
//	@Description	List Test Cases assigned to the current user
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	schema.AssignedTestCaseListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/me/test-cases/inbox [get]
func ListAssignedTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)
		page := ctx.QueryInt("page", 1)
		pageSize := ctx.QueryInt("pageSize", 20)
		offset := (page - 1) * pageSize

		testCases, err := testCasesService.FindAllAssignedToUser(ctx.Context(), userID, int32(pageSize), int32(offset))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch assigned test cases", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to fetch assigned test cases")
		}

		// Copy TestCaseID into ID before returning
		for i := range testCases {
			testCases[i].ID = testCases[i].TestCaseID
		}

		return ctx.JSON(schema.AssignedTestCaseListResponse{
			TestCases: testCases,
		})
	}
}

// MarkTestCaseAsDraft godoc
//
//	@ID				MarkTestCaseAsDraft
//	@Summary		Mark a test case as draft
//	@Description	Mark a test case as draft
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID}/mark-draft [post]
func MarkTestCaseAsDraft(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCaseID := c.Params("testCaseID", "")
		if testCaseID == "" {
			return problemdetail.BadRequest(c, "missing testCaseID")
		}
		_, err := uuid.Parse(testCaseID)
		if err != nil {
			return problemdetail.BadRequest(c, "invalid testCaseID")
		}

		err = testCaseService.MarkAsDraft(c.Context(), testCaseID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to mark test case as draft ", slog.String("testCaseID", testCaseID), "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to mark test case as draft")
		}

		return c.JSON(fiber.Map{
			"message": "Test case marked as draft",
		})
	}
}

// UnMarkTestCaseAsDraft godoc
//
//	@ID				UnMarkTestCaseAsDraft
//	@Summary		Mark a test case as draft
//	@Description	Mark a test case as draft
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID}/unmark-draft [post]
func UnMarkTestCaseAsDraft(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCaseID := c.Params("testCaseID", "")
		if testCaseID == "" {
			return problemdetail.BadRequest(c, "missing testCaseID")
		}
		_, err := uuid.Parse(testCaseID)
		if err != nil {
			return problemdetail.BadRequest(c, "invalid testCaseID")
		}
		err = testCaseService.UnMarkAsDraft(c.Context(), testCaseID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to unmark test case as draft", slog.String("testCaseID", testCaseID), "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to unmark test case as draft")
		}

		return c.JSON(fiber.Map{
			"message": "Test case unmarked as draft",
		})
	}
}
