package v1

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// GitHubHealth godoc
//
//	@ID				GitHubHealth
//	@Summary		Github integration health check
//	@Description	Github integration health check
//	@Tags			github
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	map[string]any	"Health status"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/github/health [get]
func GitHubHealth(githubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		health, err := githubService.Health(c.Context())
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to check GitHub health", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to check GitHub health")
		}

		return c.JSON(fiber.Map{
			"status": health,
		})
	}
}

func GitHubWebhook(installationStore services.GitHubService, secret string, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		signature := c.Get("X-Hub-Signature-256")
		if !verifySignature([]byte(secret), c.Body(), signature) {
			return problemdetail.BadRequest(c, "invalid signature")
		}
		var payload map[string]any
		if err := c.BodyParser(&payload); err != nil {
			return problemdetail.BadRequest(c, "invalid webhook payload")
		}

		installation, ok := payload["installation"].(map[string]any)
		if !ok {
			return problemdetail.BadRequest(c, "missing installation block")
		}

		idFloat, ok := installation["id"].(float64)
		if !ok {
			return problemdetail.BadRequest(c, "invalid installation ID")
		}
		account := installation["account"].(map[string]any)
		login := account["login"].(string)

		err := installationStore.UpsertInstallation(c.Context(), int64(idFloat), login)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to store installation", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to store installation")
		}

		return c.JSON(fiber.Map{
			"message": "Installation stored",
		})
	}
}

// ListGitHubIssues godoc
//
//	@ID				ListGitHubIssues
//	@Summary		List GitHub issues
//	@Description	List GitHub issues
//	@Tags			github
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.GitHubRepoRequest	true	"GitHub repository request"
//	@Success		200			{object}	map[string]any	"List of GitHub issues"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/github/issues [post]
func ListGitHubIssues(gitHubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.GitHubRepoRequest
		if err := c.BodyParser(&req); err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		issues, err := gitHubService.ListIssues(c.Context(), req.Project)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to list issues", "error", err)
			if errors.Is(err, services.ErrInstallationNotFound) {
				owner, _, parseErr := common.SplitProject(req.Project)
				installURL := gitHubService.GitHubAppInstallURL()
				message := fmt.Sprintf("GitHub App not installed for %s. Click here to install.", owner)
				context := fiber.Map{"install_url": installURL}
				if parseErr != nil {
					message = "GitHub App not installed for this account. Click here to install."
				}
				return problemdetail.BadRequestWithContext(c, message, context)
			}
			return problemdetail.ServerErrorProblem(c, "failed to list issues")
		}
		return c.JSON(fiber.Map{
			"issues": issues,
		})
	}
}

// ListGitHubPullRequest godoc
//
//	@ID				ListGitHubPullRequest
//	@Summary		List GitHub pull requests
//	@Description	List GitHub pull requests
//	@Tags			github
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.GitHubRepoRequest	true	"GitHub repository request"
//	@Success		200			{object}	map[string]any	"List of GitHub pull requests"
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/github/pull-requests [post]
func ListGitHubPullRequests(gitHubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.GitHubRepoRequest
		if err := c.BodyParser(&req); err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		owner, repo, err := common.SplitProject(req.Project)
		if err != nil {
			return problemdetail.BadRequest(c, err.Error())
		}

		prs, err := gitHubService.ListPullRequests(c.Context(), owner, repo)
		if err != nil {
			logger.Error(loggedmodule.ApiGitHubIntegration, "failed to list pull requests", "error", err)
			if errors.Is(err, services.ErrInstallationNotFound) {
				installURL := gitHubService.GitHubAppInstallURL()
				return problemdetail.BadRequestWithContext(
					c,
					fmt.Sprintf("GitHub App not installed for %s. Click here to install.", owner),
					fiber.Map{"install_url": installURL},
				)
			}
			return problemdetail.ServerErrorProblem(c, "failed to list pull requests")
		}
		return c.JSON(fiber.Map{
			"pull_requests": prs,
		})
	}
}

func verifySignature(secret, body []byte, signature string) bool {
	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
