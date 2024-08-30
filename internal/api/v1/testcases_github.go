package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/google/go-github/v62/github"
)

func ImportIssuesFromGitHubAsTestCases(projectService services.ProjectService, testCaseService services.TestCaseService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.ImportFromGithubRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		ghClient := github.NewClient(nil).WithAuthToken(request.GitHubToken)
		githubIntegration := services.NewGitHubIntegration(ghClient, projectService, testCaseService)
		projectID, _ := c.ParamsInt("projecID", -1)

		testCases, err := githubIntegration.CreateTestCasesFromOpenIssues(context.Background(), request.Owner, request.Repository, int64(projectID))
		if err != nil {
			logger.Error("github-api-import", "failed to process data import", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to complete import of issues")
		}
		return c.JSON(fiber.Map{
			"test_cases": testCases,
		})
	}
}
