package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

func GitHubWebhook(installationStore services.GitHubInstallationStore, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
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

		err := installationStore.UpsertInstallation(int64(idFloat), login)
		if err != nil {
			logger.Error("github-webhook", "failed to store installation", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to store installation")
		}

		return c.JSON(fiber.Map{
			"message": "Installation stored",
		})
	}
}
