// Handlers for TestCases endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
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
func ListTestCases(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list TestCases")
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
func SearchTestCases(datastore.TestCaseService) fiber.Handler {
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
func GetOneTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one TestCase")
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
func CreateTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create TestCase")
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
func UpdateTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update TestCase")
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
func DeleteTestCase(datastore.TestCaseService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestCase")
	}
}
