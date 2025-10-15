// Handlers for TestCases endpoints
package v1

import (
	"context"
	"database/sql"
	"encoding/csv"
	"errors"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/xuri/excelize/v2"
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

		_, err := testCaseService.Create(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to process request", "error", err)
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

		_, err := testCaseService.BulkCreate(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to process request", "error", err)
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

// ImportTestCasesFromFile godoc
//
//	@ID				ImportTestCasesFromFile
//	@Summary		Import test cases from Excel or CSV file
//	@Description	Import test cases from Excel or CSV file
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID formData	path		string	true	"Project ID"
//	@Param			request	body		file	true	"Excel or CSV file"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/import-file [post]
func ImportTestCasesFromFile(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectIDStr := c.FormValue("projectID")
		projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "invalid project ID")
		}

		fileHeader, err := c.FormFile("file")
		if err != nil {
			return problemdetail.BadRequest(c, "file is required")
		}

		file, err := fileHeader.Open()
		if err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to open uploaded file")
		}
		defer file.Close()

		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		var rows [][]string

		if ext == ".csv" {
			reader := csv.NewReader(file)
			rows, err = reader.ReadAll()
			if err != nil {
				return problemdetail.BadRequest(c, "failed to parse CSV file")
			}

		} else if ext == ".xlsx" {
			f, err := excelize.OpenReader(file)
			if err != nil {
				return problemdetail.BadRequest(c, "failed to parse Excel file")
			}
			rows, err = f.GetRows("Sheet1")
			if err != nil {
				return problemdetail.BadRequest(c, "failed to read Excel rows")
			}
		} else {
			return problemdetail.BadRequest(c, "unsupported file type")
		}

		var testCases []schema.CreateTestCaseRequest
		start := 1
		for i, row := range rows {
			if len(row) >= 7 && strings.ToLower(row[0]) == "title" && strings.ToLower(row[2]) == "kind" {
				start = i + 1
				break
			}
		}
		for _, row := range rows[start:] {
			if len(row) < 7 {
				continue
			}
			tags := strings.Split(row[5], ",")
			for i := range tags {
				tags[i] = strings.TrimSpace(tags[i])
			}
			testCases = append(testCases, schema.CreateTestCaseRequest{
				Title:           row[0],
				Description:     row[1],
				Kind:            row[2],
				Code:            row[3],
				FeatureOrModule: row[4],
				Tags:            tags,
				IsDraft:         strings.ToLower(row[6]) == "true",
			})
		}

		if len(testCases) == 0 {
			return problemdetail.BadRequest(c, "no valid test cases found")
		}

		request := &schema.BulkCreateTestCases{
			ProjectID: projectID,
			TestCases: testCases,
		}

		_, err = testCaseService.BulkCreate(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to import test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to import test cases")
		}

		message := fmt.Sprintf("Imported %d test cases", len(testCases))
		return c.JSON(fiber.Map{
			"message": message,
		})
	}
}
