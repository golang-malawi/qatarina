// Handlers for TestCases endpoints
package v1

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/runnerclient"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/internal/validation"
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
//	@Param			page		query		int		false	"Page number (1-based)"
//	@Param			pageSize	query		int		false	"Page size"
//	@Param			sortBy		query		string	false	"Sort field (created_at, updated_at, code, title, kind, is_draft)"
//	@Param			sortOrder	query		string	false	"Sort order (asc, desc)"
//	@Param			search		query		string	false	"Search query (matches code, title, description, feature_or_module)"
//	@Param			kind		query		string	false	"Filter by kind"
//	@Param			isDraft		query		bool	false	"Filter by draft state"
//	@Success		200	{object}	schema.TestCaseListResponse
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases [get]
func ListTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		page, err := strconv.Atoi(c.Query("page", "1"))
		if err != nil {
			return problemdetail.BadRequest(c, "invalid page parameter")
		}
		pageSize, err := strconv.Atoi(c.Query("pageSize", "10"))
		if err != nil {
			return problemdetail.BadRequest(c, "invalid pageSize parameter")
		}
		sortBy := c.Query("sortBy", "created_at")
		sortOrder := c.Query("sortOrder", "desc")
		search := strings.TrimSpace(c.Query("search", ""))
		kind := strings.TrimSpace(c.Query("kind", ""))
		isDraftParam := strings.TrimSpace(c.Query("isDraft", ""))
		var isDraft *bool
		if isDraftParam != "" {
			val, err := strconv.ParseBool(isDraftParam)
			if err != nil {
				return problemdetail.BadRequest(c, "invalid isDraft parameter")
			}
			isDraft = &val
		}
		suggested := false
		testCases, total, err := testCasesService.FindAllPaged(context.Background(), services.TestCaseQueryParams{
			Page:      page,
			PageSize:  pageSize,
			SortBy:    sortBy,
			SortOrder: sortOrder,
			Search:    search,
			Kind:      kind,
			IsDraft:   isDraft,
			Suggested: &suggested,
		})
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch test cases")
		}
		return c.JSON(schema.TestCaseListResponse{
			TestCases: schema.NewTestCaseResponseList(testCases),
			Pagination: &schema.Pagination{
				Total:    total,
				Page:     page,
				PageSize: pageSize,
			},
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
		return c.JSON(schema.NewTestCaseResponse(testCase))
	}
}

// CreateTestCase godoc
//
//	@ID				CreateTestCase
//	@Summary		Create a new Test Case
//	@Description	Create a new Test Case
//	@Tags			test-cases
//	@Accept			json,multipart/form-data
//	@Produce		json
//	@Param			request	body		schema.CreateTestCaseRequest	true	"Create Test Case data"
//	@Param			script_file	formData	file	false	"Script file"
//	@Success		200		{object}	schema.TestCaseResponse
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases [post]
func CreateTestCase(testCaseService services.TestCaseService, logger logging.Logger, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateTestCaseRequest)

		userID := authutil.GetAuthUserID(c)
		request.CreatedByID = strconv.Itoa(int(userID))

		// Check if a script file is uploaded
		fileHeader, err := c.FormFile("script_file")
		hasFile := err == nil && fileHeader != nil

		if hasFile {
			form, err := c.MultipartForm()
			if err != nil {
				logger.Error(loggedmodule.ApiTestCases, "failed to parse multipart form", "error", err)
				return problemdetail.BadRequest(c, "failed to parse multipart form")
			}

			// Populate request from form values
			if vals, ok := form.Value["project_id"]; ok && len(vals) > 0 {
				if pid, err := strconv.ParseInt(vals[0], 10, 64); err == nil {
					request.ProjectID = pid
				}
			}
			if vals, ok := form.Value["kind"]; ok && len(vals) > 0 {
				request.Kind = vals[0]
			}
			if vals, ok := form.Value["code"]; ok && len(vals) > 0 {
				request.Code = vals[0]
			}
			if vals, ok := form.Value["feature_or_module"]; ok && len(vals) > 0 {
				request.FeatureOrModule = vals[0]
			}
			if vals, ok := form.Value["title"]; ok && len(vals) > 0 {
				request.Title = vals[0]
			}
			if vals, ok := form.Value["description"]; ok && len(vals) > 0 {
				request.Description = vals[0]
			}
			if vals, ok := form.Value["is_draft"]; ok && len(vals) > 0 {
				if draft, err := strconv.ParseBool(vals[0]); err == nil {
					request.IsDraft = draft
				}
			}
			if vals, ok := form.Value["tags"]; ok {
				request.Tags = vals
			} else {
				request.Tags = []string{}
			}
			if vals, ok := form.Value["runner"]; ok && len(vals) > 0 {
				request.Runner = vals[0]
			}

			// Save uploaded file
			saveDir := filepath.Join(cfg.Storage.LocalPath, "scripts")
			if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
				logger.Error(loggedmodule.ApiTestCases, "failed to create save directory", "error", err)
				return problemdetail.ServerErrorProblem(c, "failed to create save directory")
			}

			savePath := filepath.Join(saveDir, fileHeader.Filename)

			// Normalize to forward slashes and store relative path
			normalizedRelative := filepath.ToSlash(filepath.Join("scripts", fileHeader.Filename))
			request.ScriptPath = normalizedRelative

			// Save file physically
			if err := c.SaveFile(fileHeader, savePath); err != nil {
				logger.Error(loggedmodule.ApiTestCases, "failed to save uploaded file", "error", err)
				return problemdetail.ServerErrorProblem(c, "failed to save uploaded file")
			}

			// Validate struct
			if errors := validation.ValidateStruct(request); errors != nil {
				return problemdetail.ValidationErrors(c, "invalid data in request", errors)
			}
		} else {
			if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
				if validationErrors {
					return problemdetail.ValidationErrors(c, "invalid data in request", err)
				}
				logger.Error(loggedmodule.ApiTestCases, "failed to parse request data", "error", err)
				return problemdetail.BadRequest(c, "failed to parse data in request")
			}
		}

		testCase, err := testCaseService.Create(context.Background(), request)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to create a test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create a test case")
		}

		return c.JSON(schema.NewTestCaseResponse(testCase))
	}
}

// ExecuteTestCase godoc
//
//	@ID				ExecuteTestCase
//	@Summary		Execute a Test Case and create a Test Run
//	@Description	Execute a test case by running its script against the configured runner
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			test_case_id	path		string						true	"Test Case ID"
//	@Param			request			body		schema.ExecuteTestCaseRequest	true	"Execution request data"
//	@Success		202		{object}	schema.TestRunResponse
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		404		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{test_case_id}/execute [post]
func ExecuteTestCase(testCaseService services.TestCaseService, testRunService services.TestRunService, logger logging.Logger, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		caseID := c.Params("test_case_id")
		userID := authutil.GetAuthUserID(c)

		testCase, err := testCaseService.FindByID(c.Context(), caseID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch test case", "error", err)
			return problemdetail.NotFound(c, "test case not found")
		}

		request := new(schema.ExecuteTestCaseRequest)
		if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to parse request data", "error", err)
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		// Resolve relative script path to absolute path
		var resolvedScriptPath string
		if testCase.ScriptPath.Valid && testCase.ScriptPath.String != "" {
			resolvedScriptPath = filepath.Join(cfg.Storage.LocalPath, testCase.ScriptPath.String)
		} else {
			resolvedScriptPath = "" // fallback if no script path
		}

		testRunReq := &schema.TestRunRequest{
			ProjectID:    testCase.ProjectID.Int32,
			TestPlanID:   request.TestPlanID,
			TestCaseID:   caseID,
			OwnerID:      int32(userID),
			TestedByID:   int32(userID),
			AssignedToID: int32(userID),
			Code:         testCase.Code,
			Runner:       testCase.Runner.String,
			ScriptPath:   resolvedScriptPath,
		}

		createdRun, err := testRunService.Create(c.Context(), testRunReq)
		if err != nil {
			logger.Error(loggedmodule.ApiTestRuns, "failed to create test run", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create test run")
		}

		// Get WebSocket URL for the runner based on test case runner type
		var wsURL string
		runner := testCase.Runner.String
		if runner == "" {
			runner = request.Runner
		}

		switch runner {
		case "basi":
			wsURL = cfg.Runner.BasiWSURL
		case "playwright":
			wsURL = cfg.Runner.PlaywrightWSURL
		case "cypress":
			wsURL = cfg.Runner.CypressWSURL
		case "browseruse":
			wsURL = cfg.Runner.BrowserUseWSURL
		default:
			logger.Error(loggedmodule.ApiTestCases, "invalid runner type", "runner", runner)
			return problemdetail.BadRequest(c, "invalid runner specified")
		}

		// Start execution asynchronously (non-blocking)
		go func() {
			err := runnerclient.StreamRunnerAndCommit(
				testRunService,
				createdRun.ID.String(),
				testRunReq,
				wsURL,
				userID,
			)
			if err != nil {
				logger.Error(loggedmodule.ApiTestRuns, "failed to stream runner during execution", "error", err, "testRunID", createdRun.ID)
			}
		}()

		// Return immediately with test run details (HTTP 202 Accepted)
		return c.Status(fiber.StatusAccepted).JSON(schema.NewTestRunResponseFromEntity(createdRun))
	}
}

// ValidateTestCaseScript godoc
//
//	@ID             ValidateTestCaseScript
//	@Summary        Validate a runner script without creating a test case
//	@Description    Validate a test script by sending it to the configured runner before creation
//	@Tags           test-cases
//	@Accept         multipart/form-data
//	@Produce        json
//	@Param          script_file formData file true "Script file"
//	@Param          runner      formData string true "Runner"
//	@Success        200 {object} map[string]interface{}
//	@Failure        400 {object} problemdetail.ProblemDetail
//	@Failure        500 {object} problemdetail.ProblemDetail
//	@Router         /v1/test-cases/validate-script [post]
func ValidateTestCaseScript(logger logging.Logger, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		fileHeader, err := c.FormFile("script_file")
		if err != nil || fileHeader == nil {
			return problemdetail.BadRequest(c, "script file is required")
		}

		runner := c.FormValue("runner")
		if runner == "" {
			return problemdetail.BadRequest(c, "runner is required")
		}

		file, err := fileHeader.Open()
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to open script file", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to read script file")
		}
		defer file.Close()

		output, state, status, err := postScriptToRunner(file, fileHeader.Filename, runner, cfg)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to validate script", "error", err)
			return problemdetail.BadRequest(c, fmt.Sprintf("script validation failed: %v", err))
		}

		if status != http.StatusOK || state == dbsqlc.TestRunStateFailed {
			return problemdetail.BadRequest(c, fmt.Sprintf("script validation failed: %s", output))
		}

		// Build relative path for consistency
		normalizedRelative := filepath.ToSlash(filepath.Join("scripts", fileHeader.Filename))

		return c.JSON(fiber.Map{
			"valid":       true,
			"output":      output,
			"state":       string(state),
			"script_path": normalizedRelative,
		})
	}
}

func postScriptToRunner(file multipart.File, filename, runner string, cfg *config.Config) (string, dbsqlc.TestRunState, int, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	formFile, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", dbsqlc.TestRunStateFailed, 0, err
	}

	if _, err := io.Copy(formFile, file); err != nil {
		return "", dbsqlc.TestRunStateFailed, 0, err
	}

	writer.WriteField("runner", runner)
	if err := writer.Close(); err != nil {
		return "", dbsqlc.TestRunStateFailed, 0, err
	}

	var runnerURL string
	switch runner {
	case "basi":
		runnerURL = cfg.Runner.BasiURL
	case "playwright":
		runnerURL = cfg.Runner.PlaywrightURL
	case "cypress":
		runnerURL = cfg.Runner.CypressURL
	case "browseruse":
		runnerURL = cfg.Runner.BrowserUseURL
	default:
		return "", dbsqlc.TestRunStateFailed, 0, fmt.Errorf("invalid runner specified")
	}

	resp, err := http.Post(runnerURL, writer.FormDataContentType(), &buf)
	if err != nil {
		return "", dbsqlc.TestRunStateFailed, 0, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var output string
	var msgs []schema.RunnerMessage
	if err := json.Unmarshal(body, &msgs); err != nil {
		output = string(body)
	} else {
		var logs []string
		for _, m := range msgs {
			logs = append(logs, fmt.Sprintf("[%s] %s", m.Type, m.Content))
		}
		output = strings.Join(logs, "\n")
	}

	return output, determineStateFromRunnerOutput(output), resp.StatusCode, nil
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

		testCases, _, err := testCaseService.BulkCreate(context.Background(), request)
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
//	@ID             UpdateTestCase
//	@Summary        Update a Test Case
//	@Description    Update a Test Case
//	@Tags           test-cases
//	@Accept         json,multipart/form-data
//	@Produce        json
//	@Param          testCaseID  path        string      true    "Test Case ID"
//	@Param          request     body        schema.UpdateTestCaseRequest    true    "Test Case update data"
//	@Param          script_file formData    file    false   "Script file"
//	@Success        200         {object}    schema.TestCaseResponse
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/test-cases/{testCaseID} [post]
func UpdateTestCase(testCaseService services.TestCaseService, logger logging.Logger, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.UpdateTestCaseRequest)
		fileHeader, err := c.FormFile("script_file")
		hasFile := err == nil && fileHeader != nil

		if hasFile {
			form, err := c.MultipartForm()
			if err != nil {
				logger.Error("failed to parse multipart form", "error", err)
				return problemdetail.BadRequest(c, "failed to parse multipart form")
			}

			if vals, ok := form.Value["id"]; ok && len(vals) > 0 {
				request.ID = vals[0]
			}
			if vals, ok := form.Value["kind"]; ok && len(vals) > 0 {
				request.Kind = vals[0]
			}
			if vals, ok := form.Value["code"]; ok && len(vals) > 0 {
				request.Code = vals[0]
			}
			if vals, ok := form.Value["feature_or_module"]; ok && len(vals) > 0 {
				request.FeatureOrModule = vals[0]
			}
			if vals, ok := form.Value["title"]; ok && len(vals) > 0 {
				request.Title = vals[0]
			}
			if vals, ok := form.Value["description"]; ok && len(vals) > 0 {
				request.Description = vals[0]
			}
			if vals, ok := form.Value["is_draft"]; ok && len(vals) > 0 {
				if draft, err := strconv.ParseBool(vals[0]); err == nil {
					request.IsDraft = draft
				}
			}
			if vals, ok := form.Value["tags"]; ok {
				request.Tags = vals
			} else {
				request.Tags = []string{}
			}
			if vals, ok := form.Value["runner"]; ok && len(vals) > 0 {
				request.Runner = vals[0]
			}

			saveDir := filepath.Join(cfg.Storage.LocalPath, "scripts")
			if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
				logger.Error("failed to create save directory", "error", err)
				return problemdetail.ServerErrorProblem(c, "failed to create save directory")
			}

			savePath := filepath.Join(saveDir, fileHeader.Filename)

			// Normalize to forward slashes and store relative path
			normalizedRelative := filepath.ToSlash(filepath.Join("scripts", fileHeader.Filename))
			request.ScriptPath = normalizedRelative

			// Save file physically
			if err := c.SaveFile(fileHeader, savePath); err != nil {
				logger.Error("failed to save uploaded file", "error", err)
				return problemdetail.ServerErrorProblem(c, "failed to save uploaded file")
			}

		} else {
			if validationErrors, err := common.ParseBodyThenValidate(c, request); err != nil {
				if validationErrors {
					return problemdetail.ValidationErrors(c, "invalid data in request", err)
				}
				logger.Error("failed to parse request data", "error", err)
				return problemdetail.BadRequest(c, "failed to parse data in request")
			}
		}

		updated, err := testCaseService.Update(context.Background(), request)
		if err != nil {
			logger.Error("failed to update test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to update test case")
		}

		return c.JSON(schema.NewTestCaseResponse(updated))
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
		includeClosed := ctx.QueryBool("includeClosed", false)

		testCases, err := testCasesService.FindAllAssignedToUser(ctx.Context(), userID, int32(pageSize), int32(offset), includeClosed)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch assigned test cases", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to fetch assigned test cases")
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

// GetExecutionSummary godoc
//
//	@ID				GetExecutionSummary
//	@Summary		Get execution summary for assigned test cases
//	@Description	Get execution summary for assigned test cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Success		200			{array}	schema.TestCaseExecutionSummary
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/me/test-cases/summary [get]
func GetExecutionSummary(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(c)

		summaries, err := testCasesService.GetExecutionSummaryByUser(c.Context(), userID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch execution summary", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch execution summary")
		}

		return c.JSON(summaries)
	}
}

// ListClosedTestCases godoc
//
//	@ID				ListClosedTestCases
//	@Summary		List Completed/Closed Test Cases
//	@Description	List Completed/Closed Test Cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	schema.TestCaseListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/test-cases/closed [get]
func ListClosedTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "missing projectID")
		}

		testCases, err := testCasesService.FindAllClosed(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch closed test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch closed test cases")
		}

		return c.JSON(schema.TestCaseListResponse{TestCases: testCases})
	}
}

// ListFailingTestCases godoc
//
//	@ID				ListFailingTestCases
//	@Summary		List Failing Test Cases
//	@Description	List Failing Test Cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	schema.TestCaseListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/test-cases/failing [get]
func ListFailingTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "missing projectID")
		}

		testCases, err := testCasesService.FindAllFailing(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch feailing test cases")
			return problemdetail.ServerErrorProblem(c, "failed to fetch failing test cases")
		}

		return c.JSON(schema.TestCaseListResponse{TestCases: testCases})
	}
}

// ListScheduledTestCases godoc
//
// @ID          ListScheduledTestCases
// @Summary     List Scheduled Test Cases
// @Description List all test cases scheduled for execution
// @Tags        test-cases
// @Accept      json
// @Produce     json
// @Param       projectID path string true "Project ID"
// @Success     200 {object} schema.TestCaseListResponse
// @Failure     400 {object} problemdetail.ProblemDetail
// @Failure     500 {object} problemdetail.ProblemDetail
// @Router      /v1/projects/{projectID}/test-cases/scheduled [get]
func ListScheduledTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "missing projectID")
		}

		testCases, err := testCasesService.FindAllScheduled(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch scheduled test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch scheduled test cases")
		}

		return c.JSON(schema.TestCaseListResponse{TestCases: testCases})
	}
}

// ListBlockedTestCases godoc
//
//	@ID				ListBlockedTestCases
//	@Summary		List all test cases that are currently blocked
//	@Description	List all test cases that are currently blocked
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	schema.TestCaseListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/test-cases/blocked [get]
func ListBlockedTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "missing projectID")
		}

		testCases, err := testCasesService.FindAllBlocked(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch blocked test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch blocked test cases")
		}

		return c.JSON(schema.TestCaseListResponse{TestCases: testCases})
	}
}

// SuggestTestCase godoc
//
//	@ID				SuggestTestCase
//	@Summary		Suggest a new Test Case
//	@Description	Suggest a new Test Case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.CreateSuggestedTestCaseRequest 	true	"Suggest Test Case data"
//	@Success		200			{object}	schema.TestCaseResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/suggest [post]
func SuggestTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		req := new(schema.CreateSuggestedTestCaseRequest)
		fmt.Printf("Debug: struct type = %T\n", req) // TODO DELETE TEST CODE
		if validationErrors, err := common.ParseBodyThenValidate(c, req); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in the request", err)
			}
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		userID := authutil.GetAuthUserID(c)
		req.CreatedByID = userID

		tc, err := testCaseService.Suggest(c.Context(), req)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to suggest test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to suggest test case")
		}

		return c.JSON(schema.NewTestCaseResponse(tc))
	}
}

// ListSuggestedTestCases godoc
//
//	@ID				ListSuggestedTestCases
//	@Summary		List suggested test cases for a project
//	@Description	List suggested test cases for a project
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path 		string	true	"Project ID"
//	@Success		200			{object}	schema.TestCaseListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/test-cases/suggested [get]
func ListSuggestedTestCases(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := c.ParamsInt("projectID")
		if err != nil || projectID == 0 {
			return problemdetail.BadRequest(c, "missing or invalid project ID")
		}

		testCases, err := testCaseService.FindAllSuggested(c.Context(), int64(projectID))
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch suggested test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch suggested test cases")
		}

		return c.JSON(schema.TestCaseListResponse{TestCases: schema.NewTestCaseResponseList(testCases)})
	}
}

// AcceptSuggestedTestCase godoc
//
//	@ID				AcceptSuggestedTestCase
//	@Summary		Accept a suggested test case
//	@Description	Accept a suggested test case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID}/accept [post]
func AcceptSuggestedTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params("testCaseID", "")
		if id == "" {
			return problemdetail.BadRequest(c, "missing testCaseID")
		}

		if err := testCaseService.AcceptSuggested(c.Context(), id); err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to accept suggested test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to accept suggested test case")
		}

		return c.JSON(fiber.Map{
			"message": "Suggested test case accepted",
		})
	}
}

// RejectSuggestedTestCase godoc
//
//	@ID				RejectSuggestedTestCase
//	@Summary		Reject a suggested Test Case
//	@Description	Reject a suggested Test Case
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			testCaseID	path		string	true	"Test Case ID"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/{testCaseID}/reject [delete]
func RejectSuggestedTestCase(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params("testCaseID", "")
		if id == "" {
			return problemdetail.BadRequest(c, "missing testCaseID")
		}

		if err := testCaseService.RejectSuggested(c.Context(), id); err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to reject suggested test case", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to reject suggested test case")
		}

		return c.JSON(fiber.Map{
			"message": "Suggested test case rejected",
		})
	}
}

// determineStateFromRunnerOutput inspects the runner output and decides pass/fail
func determineStateFromRunnerOutput(output string) dbsqlc.TestRunState {
	lower := strings.ToLower(output)

	// treat common success phrases
	if strings.Contains(lower, "pass") ||
		strings.Contains(lower, "success") ||
		strings.Contains(lower, "all tests passed") {
		return dbsqlc.TestRunStatePassed
	}

	// treat common failure/error phrases
	if strings.Contains(lower, "fail") ||
		strings.Contains(lower, "error") ||
		strings.Contains(lower, "stderr") ||
		strings.Contains(lower, "assertion failed") ||
		strings.Contains(lower, "exception") {
		return dbsqlc.TestRunStateFailed
	}

	// fallback if nothing matched
	return dbsqlc.TestRunStatePending
}

// GetScriptTestPlanTestCases godoc
//
// @ID          GetScriptTestPlanTestCases
// @Summary     List all script-based test cases of a test plan
// @Description Returns only test cases that have a runner and script_path set
// @Tags        test-cases, test-plans
// @Accept      json
// @Produce     json
// @Param       testPlanID path int true "Test Plan ID"
// @Success     200 {object} schema.TestCaseListResponse
// @Failure     400 {object} problemdetail.ProblemDetail
// @Failure     500 {object} problemdetail.ProblemDetail
// @Router      /v1/test-plans/{testPlanID}/script-test-cases [get]
func GetScriptTestPlanTestCases(testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		testPlanID, err := c.ParamsInt("testPlanID", 0)
		if err != nil || testPlanID == 0 {
			return problemdetail.BadRequest(c, "invalid testPlanID in request")
		}

		testCases, err := testCaseService.FindScriptCasesByPlanID(c.Context(), int64(testPlanID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				logger.Info(loggedmodule.ApiTestPlans, "no script test cases found", "error", err)
				return c.JSON(schema.TestCaseListResponse{})
			}
			logger.Error(loggedmodule.ApiTestPlans, "failed to fetch script test cases", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch script test cases")
		}

		return c.JSON(schema.TestCaseListResponse{
			TestCases: schema.NewTestCaseResponseList(testCases),
		})
	}
}
