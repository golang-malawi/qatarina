// Handlers for TestCases endpoints
package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListTestCases godoc
//
//	@ID				ListTestCases
//	@Summary		List Test Cases
//	@Description	List Test Cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases [get]
func ListTestCases(testCasesService services.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testCases, err := testCasesService.FindAll(context.Background())
		if err != nil {
			// TODO: log error
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
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases/query [get]
func SearchTestCases(services.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search TestCases")
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
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases/{testCaseID} [get]
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
//	@Param			request	body		interface{}	true	"Create Test Case data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases [post]
func CreateTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateTestCaseRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-test-cases", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := testCaseService.Create(context.Background(), request)
		if err != nil {
			logger.Error("api-test-cases", "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test case created",
		})
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
//	@Param			request	body		interface{}	true	"Bulk Create Test Case data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases/bulk [post]
func BulkCreateTestCases(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.BulkCreateTestCases)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-test-cases", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := testCaseService.BulkCreate(context.Background(), request)
		if err != nil {
			logger.Error("api-test-cases", "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message": "Test cases created",
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
//	@Param			request		body		interface{}	true	"Test Case update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases/{testCaseID} [post]
func UpdateTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateTestCaseRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error("api-test-cases", "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		_, err := testCaseService.Update(context.Background(), request)
		if err != nil {
			logger.Error("api-test-cases", "failed to process request", "error", err)
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
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-cases/{testCaseID} [delete]
func DeleteTestCase(services.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestCase")
	}
}
