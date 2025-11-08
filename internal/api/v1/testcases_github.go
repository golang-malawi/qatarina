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

// ImportIssuesFromGitHubAsTestCases godoc
//
// @ID ImportIssuesFromGitHubAsTestCases
// @Summary Import GitHub issues as test cases
// @Description Imports open issues from a GitHub repository as test cases for a project
// @Tags test-cases
// @Accept json
// @Produce json
// @Param request body schema.ImportFromGithubRequest true "GitHub import request"
// @Success 200 {object} schema.TestCaseListResponse "List of imported test cases"
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/test-cases/import/github [post]
func ImportIssuesFromGitHubAsTestCases(githubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportFromGithubRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		testCases, err := githubService.CreateTestCasesFromOpenIssues(context.Background(), request.Owner, request.Repository, request.ProjectID)
		if err != nil {
			logger.Error("github-api-import", "failed to process data import", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to complete import of issues")
		}
		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}
