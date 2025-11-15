package v1

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

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
			logger.Error("github-webhook", "failed to store installation", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to store installation")
		}

		return c.JSON(fiber.Map{
			"message": "Installation stored",
		})
	}
}

func ListGitHubIssues(gitHubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.ListGitHubRequest
		if err := c.BodyParser(&req); err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		issues, err := gitHubService.ListIssues(c.Context(), req.Project)
		if err != nil {
			logger.Error("github-list-issues", "failed to list issues", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to list GitHub issues")
		}

		return c.JSON(fiber.Map{
			"issues": issues,
		})
	}
}

func ListGitHubPullRequests(gitHubService services.GitHubService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.ListGitHubRequest
		if err := c.BodyParser(&req); err != nil {
			return problemdetail.BadRequest(c, "invalid request body")
		}

		parts := splitProject(req.Project)
		if parts == nil {
			return problemdetail.BadRequest(c, "invalid project format")
		}
		owner, repo := parts[0], parts[1]

		prs, err := gitHubService.ListPullRequests(c.Context(), owner, repo)
		if err != nil {
			logger.Error("github-list-prs", "failed to list pull requests", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to list GitHub pull requests")
		}

		return c.JSON(fiber.Map{
			"pull_requests": prs,
		})
	}
}

func splitProject(project string) []string {
	for i := range project {
		if project[i] == '/' {
			return []string{project[:i], project[i+1:]}
		}
	}
	return nil
}

func verifySignature(secret, body []byte, signature string) bool {
	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
