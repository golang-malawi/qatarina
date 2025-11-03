package v1

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
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
// @Param request body schema.ImportFromGithubRequest true "GitHub import request"
// @Success 200 {object} schema.TestCaseListResponse "List of imported test cases"
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/test-cases/import/github [post]
func ImportIssuesFromGitHubAsTestCases(projectService services.ProjectService, testCaseService services.TestCaseService, githubConfig config.GitHubConfiguration, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportFromGithubRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		githubIntegration, err := services.NewGitHubIntegration(c.Context(), githubConfig.AppID, []byte(githubConfig.PrivateKeyPEM), request.InstallationID, projectService, testCaseService)
		if err != nil {
			logger.Error("github-api-import", "failed to authenticate GitHub App", "error", err)
			return problemdetail.ServerErrorProblem(c, "GitHub App authentication failed")
		}

		testCases, err := githubIntegration.CreateTestCasesFromOpenIssues(context.Background(), request.Owner, request.Repository, request.ProjectID)
		if err != nil {
			logger.Error("github-api-import", "failed to process data import", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to complete import of issues")
		}
		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}

// ListGitHubIssues godoc
//
//	@ID				ListGitHubIssues
//	@Summary		List GitHub issues for a repository
//	@Description	List GitHub issues for a repository
//	@Tags			github
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.ImportFromGithubRequest	true	"GitHub repositoy details"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/github/issues [post]
func ListGitHubIssues(projectService services.ProjectService, githubConfig config.GitHubConfiguration, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportFromGithubRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		githubIntegration, err := services.NewGitHubIntegration(c.Context(), githubConfig.AppID, []byte(githubConfig.PrivateKeyPEM), request.InstallationID, projectService, nil)
		if err != nil {
			logger.Error("github-api-import", "failed to authenticate GitHub App", "error", err)
			return problemdetail.ServerErrorProblem(c, "GitHub App authentication failed")
		}

		issues, err := githubIntegration.ListIssues(c.Context(), fmt.Sprintf("%s/%s", request.Owner, request.Repository))
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to list issues", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to list issues")
		}
		return c.JSON(fiber.Map{
			"issues": issues,
		})

	}
}

// ListGitubPullRequests godoc
//
//	@ID				ListGitubPullRequests
//	@Summary		List GitHub pull requests for a repository
//	@Description	List GitHub pull requests for a repository
//	@Tags			github
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.ImportFromGithubRequest	true	"GitHub repository details"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/github/pull-requests [post]
func ListGitHubPullRequests(projectService services.ProjectService, githubConfig config.GitHubConfiguration, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportFromGithubRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		githubIntegration, err := services.NewGitHubIntegration(c.Context(), githubConfig.AppID, []byte(githubConfig.PrivateKeyPEM), request.InstallationID, projectService, nil)
		if err != nil {
			logger.Error("github-api-import", "failed to authenticate GitHub App", "error", err)
			return problemdetail.ServerErrorProblem(c, "GitHub App authentication failed")
		}
		prs, err := githubIntegration.ListPullRequests(c.Context(), request.Owner, request.Repository)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to list pull requests", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to list pull requests")
		}
		return c.JSON(fiber.Map{
			"pull_requests": prs,
		})
	}
}
