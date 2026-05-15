package v1

import (
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
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
// @Param request body schema.ImportIssuesRequest true "GitHub import request"
// @Success 200 {object} schema.TestCaseListResponse "List of imported test cases"
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/test-cases/github-import/issues [post]
func ImportIssuesFromGitHubAsTestCases(githubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportIssuesRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		userID := authutil.GetAuthUserID(c)

		owner, repo, err := common.SplitProject(request.Project)
		if err != nil {
			return problemdetail.BadRequest(c, err.Error())
		}

		testCases, err := githubService.CreateTestCasesFromIssues(c.Context(), owner, repo, request.IDs, request.ProjectID, userID)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to import issues as test cases", "error", err)
			if errors.Is(err, services.ErrInstallationNotFound) {
				installURL := githubService.GitHubAppInstallURL()
				return problemdetail.BadRequestWithContext(
					c,
					fmt.Sprintf("GitHub App not installed for %s. Click here to install.", owner),
					fiber.Map{"install_url": installURL},
				)
			}
			return problemdetail.ServerErrorProblem(c, "failed to import GitHub issues as test cases")
		}
		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}

// ImportPullRequestsFromGitHubAsTestCases godoc
//
//	@ID				ImportPullRequestsFromGitHubAsTestCases
//	@Summary		Import GitHub pull requests as test cases
//	@Description	Import GitHub pull requests as test cases
//	@Tags			test-cases
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.ImportIssuesRequest	true	"GitHub import request"
//	@Success		200			{object}	schema.TestCaseListResponse	"List of imported test cases"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/test-cases/github-import/pull-requests [post]
func ImportPullRequestsFromGitHubAsTestCases(githubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportIssuesRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		owner, repo, err := common.SplitProject(request.Project)
		if err != nil {
			return problemdetail.BadRequest(c, err.Error())
		}

		userID := authutil.GetAuthUserID(c)

		testCases, err := githubService.CreateTestCasesFromPullRequests(c.Context(), owner, repo, request.IDs, request.ProjectID, userID)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to import pull requests as test cases", "error", err)
			if errors.Is(err, services.ErrInstallationNotFound) {
				installURL := githubService.GitHubAppInstallURL()
				return problemdetail.BadRequestWithContext(
					c,
					fmt.Sprintf("GitHub App not installed for %s. Click here to install.", owner),
					fiber.Map{"install_url": installURL},
				)
			}
			return problemdetail.ServerErrorProblem(c, "failed to import GitHub pull requests as test cases")
		}
		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}
