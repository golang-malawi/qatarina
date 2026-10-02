package v1

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
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
		var filteredProjects []string
		if raw := ctx.Query("projects", ""); raw != "" {
			for _, p := range strings.Split(raw, ",") {
				if p = strings.TrimSpace(p); p != "" {
					filteredProjects = append(filteredProjects, p)
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
