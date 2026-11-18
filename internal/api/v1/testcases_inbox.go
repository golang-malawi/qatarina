package v1

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/google/uuid"
)

// parseInboxFilters reads the inbox filter query parameters shared by the inbox list
// and Previous/Next navigation, so both follow the same list
func parseInboxFilters(ctx *fiber.Ctx) *schema.InboxFilterParams {
	var projects []int32
	if raw := ctx.Query("projects", ""); raw != "" {
		for _, p := range strings.Split(raw, ",") {
			if p = strings.TrimSpace(p); p != "" {
				if projectID, err := strconv.Atoi(p); err == nil {
					projects = append(projects, int32(projectID))
				}
			}
		}
	}

	return &schema.InboxFilterParams{
		UserID:        authutil.GetAuthUserID(ctx),
		IncludeClosed: ctx.QueryBool("includeClosed", false),
		Projects:      projects,
		EnvironmentID: int32(ctx.QueryInt("environmentID", 0)),
		Module:        strings.TrimSpace(ctx.Query("module", "")),
		Search:        strings.TrimSpace(ctx.Query("search", "")),
	}
}

// ListAssignedTestCases godoc
//
//	@ID             ListAssignedTestCases
//	@Summary        List Test Cases assigned to the current user
//	@Description    List Test Cases assigned to the current user
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          page        query       int     false   "Page number (1-based)"
//	@Param          pageSize    query       int     false   "Page size"
//	@Param          includeClosed   query   bool    false   "Include closed test cases"
//	@Param          projects        query   string  false   "Comma-separated project IDs to filter by"
//	@Param          environmentID   query   int     false   "Environment ID to filter by"
//	@Param          module          query   string  false   "Feature or module name to filter by"
//	@Param          search          query   string  false   "Search title, code or feature/module"
//	@Success        200         {object}    schema.AssignedTestCaseListResponse
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox [get]
func ListAssignedTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		page := ctx.QueryInt("page", 1)
		pageSize := ctx.QueryInt("pageSize", 20)

		params := parseInboxFilters(ctx)
		params.PageSize = pageSize
		params.Page = (page - 1) * pageSize

		testCases, totalCount, err := testCasesService.FindAllAssignedToUser(ctx.Context(), params)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch assigned test cases", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to fetch assigned test cases")
		}

		return ctx.JSON(schema.AssignedTestCaseListResponse{
			TestCases: testCases,
			Pagination: &schema.Pagination{
				Page:     page,
				PageSize: pageSize,
				Total:    totalCount,
			},
		})

	}
}

// GetInboxFilterOptions godoc
//
//	@ID             GetInboxFilterOptions
//	@Summary        List the filter options for the current user's inbox
//	@Description    List the distinct projects, environments and modules found in the current user's inbox
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          includeClosed   query   bool    false   "Include closed test cases"
//	@Success        200         {object}    schema.InboxFilterOptionsResponse
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox/filter-options [get]
func GetInboxFilterOptions(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)
		includeClosed := ctx.QueryBool("includeClosed", false)

		options, err := testCasesService.FindInboxFilterOptions(ctx.Context(), userID, includeClosed)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch inbox filter options", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to fetch inbox filter options")
		}

		return ctx.JSON(options)
	}
}

// GetAssignedTestCase godoc
//
//	@ID             GetAssignedTestCase
//	@Summary        Get a single Test Case from the current user's inbox
//	@Description    Get a single Test Case assigned to the current user, regardless of which inbox page it is on
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string  true    "Test Case ID"
//	@Success        200         {object}    schema.AssignedTestCase
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        404         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox/{testCaseID} [get]
func GetAssignedTestCase(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)
		testCaseID := ctx.Params("testCaseID", "")
		if _, err := uuid.Parse(testCaseID); err != nil {
			return problemdetail.BadRequest(ctx, "invalid test case id")
		}

		testCase, err := testCasesService.FindAssignedToUserByID(ctx.Context(), userID, testCaseID)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(ctx, "test case not found in inbox")
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to fetch assigned test case", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to fetch assigned test case")
		}

		return ctx.JSON(testCase)
	}
}

// GetInboxNavigation godoc
//
//	@ID             GetInboxNavigation
//	@Summary        Get the previous and next Test Cases in the current user's inbox
//	@Description    Get the neighbouring Test Cases around a Test Case, following the inbox order and the same filters as the inbox list, with its position. Empty IDs mean there is none in that direction.
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string  true    "Test Case ID"
//	@Param          includeClosed   query   bool    false   "Include closed test cases"
//	@Param          projects        query   string  false   "Comma-separated project IDs to filter by"
//	@Param          environmentID   query   int     false   "Environment ID to filter by"
//	@Param          module          query   string  false   "Feature or module name to filter by"
//	@Param          search          query   string  false   "Search title, code or feature/module"
//	@Success        200         {object}    schema.InboxNavigationResponse
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        404         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox/{testCaseID}/navigation [get]
func GetInboxNavigation(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		testCaseID := ctx.Params("testCaseID", "")
		if _, err := uuid.Parse(testCaseID); err != nil {
			return problemdetail.BadRequest(ctx, "invalid test case id")
		}

		nav, err := testCasesService.FindInboxNavigation(ctx.Context(), parseInboxFilters(ctx), testCaseID)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(ctx, "test case not found in inbox")
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to find inbox navigation", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to find inbox navigation")
		}

		return ctx.JSON(nav)
	}
}

// GetInboxUnseenCount godoc
//
//	@ID             GetInboxUnseenCount
//	@Summary        Count unseen Test Cases in the current user's inbox
//	@Description    Count open Test Cases assigned to the current user that they have not viewed yet
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Success        200         {object}    schema.InboxUnseenCountResponse
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox/unseen-count [get]
func GetInboxUnseenCount(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)

		count, err := testCasesService.CountUnseenAssignedToUser(ctx.Context(), userID)
		if err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to count unseen test cases", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to count unseen test cases")
		}

		return ctx.JSON(schema.InboxUnseenCountResponse{UnseenCount: count})
	}
}

// MarkInboxTestCaseViewed godoc
//
//	@ID             MarkInboxTestCaseViewed
//	@Summary        Mark a Test Case in the current user's inbox as viewed
//	@Description    Mark a Test Case in the current user's inbox as viewed
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string  true    "Test Case ID"
//	@Success        204
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox/{testCaseID}/view [post]
func MarkInboxTestCaseViewed(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)
		testCaseID := ctx.Params("testCaseID", "")
		if _, err := uuid.Parse(testCaseID); err != nil {
			return problemdetail.BadRequest(ctx, "invalid test case id")
		}

		if err := testCasesService.MarkAssignedAsViewed(ctx.Context(), userID, testCaseID); err != nil {
			logger.Error(loggedmodule.ApiTestCases, "failed to mark test case as viewed", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to mark test case as viewed")
		}

		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
