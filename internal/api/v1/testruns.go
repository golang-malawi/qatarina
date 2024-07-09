// Handlers for TestRuns endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
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
//	@Router			/api/v1/test-runs [get]
func ListTestRuns(datastore.TestRunService) fiber.Handler {
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
//	@Router			/api/v1/test-runs/query [get]
func SearchTestRuns(datastore.TestRunService) fiber.Handler {
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
//	@Router			/api/v1/test-runs/{testRunID} [get]
func GetOneTestRun(datastore.TestRunService) fiber.Handler {
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
//	@Router			/api/v1/test-runs [post]
func CreateTestRun(datastore.TestRunService) fiber.Handler {
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
//	@Router			/api/v1/test-runs/{testRunID} [post]
func UpdateTestRun(datastore.TestRunService) fiber.Handler {
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
//	@Router			/api/v1/test-runs/{testRunID} [delete]
func DeleteTestRun(datastore.TestRunService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete TestRun")
	}
}

// PassTestRun godoc
//
//	@ID				PassTestRun
//	@Summary		Mark a Test Run as passed
//	@Description	Mark a Test Run as passed
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string		true	"Test Run ID"
//	@Param			request		body		interface{}	true	"Test Run update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-runs/{testRunID}/passed [post]
func PassTestRun(datastore.TestRunService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not yet implemented")
	}
}

// FailTestRun godoc
//
//	@ID				FailTestRun
//	@Summary		Mark a Test Run as failed
//	@Description	Mark a Test Run as failed
//	@Tags			test-runs
//	@Accept			json
//	@Produce		json
//	@Param			testRunID	path		string		true	"Test Run ID"
//	@Param			request		body		interface{}	true	"Test Run update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/test-runs/{testRunID}/failed [post]
func FailTestRun(datastore.TestRunService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return problemdetail.NotImplemented(ctx, "not yet implemented")
	}
}
