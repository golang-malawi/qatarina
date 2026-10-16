package v1

import (
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
//	@Success        200         {object}    schema.AssignedTestCaseListResponse
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/me/test-cases/inbox [get]
func ListAssignedTestCases(testCasesService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID := authutil.GetAuthUserID(ctx)
		page := ctx.QueryInt("page", 1)
		pageSize := ctx.QueryInt("pageSize", 20)
		offset := (page - 1) * pageSize
		includeClosed := ctx.QueryBool("includeClosed", false)
		var filteredProjects []int32
		if raw := ctx.Query("projects", ""); raw != "" {
			for _, p := range strings.Split(raw, ",") {
				if p = strings.TrimSpace(p); p != "" {
					if projectID, err := strconv.Atoi(p); err == nil {
						filteredProjects = append(filteredProjects, int32(projectID))
					}
				}
			}
		}

		params := &schema.InboxFilterParams{
			UserID:        userID,
			PageSize:      pageSize,
			Page:          offset,
			IncludeClosed: includeClosed,
			Projects:      filteredProjects,
		}

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
