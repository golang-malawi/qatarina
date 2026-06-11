package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/riverqueue/river"
)

// DigestArgs contains the arguments for the digest job
type DigestArgs struct {
	UserID int32 `json:"user_id"`
}

// Kind implements river.Job
func (a DigestArgs) Kind() string { return "digest_notifications" }

// DigestWorker batches notifications and sends one digest email per user
type DigestWorker struct {
	river.WorkerDefaults[DigestArgs]
	queries             *dbsqlc.Queries
	logger              logging.Logger
	notificationService services.NotificationService
}

// NewDigestWorker creates a new digest worker
func NewDigestWorker(queries *dbsqlc.Queries, logger logging.Logger, notificationService services.NotificationService) *DigestWorker {
	return &DigestWorker{
		queries:             queries,
		logger:              logger,
		notificationService: notificationService,
	}
}

// Work implements river.Worker
func (w *DigestWorker) Work(ctx context.Context, job *river.Job[DigestArgs]) error {
	userID := job.Args.UserID

	// Get unsent notifications for this user
	notifications, err := w.queries.GetPendingNotifications(ctx, userID)
	if err != nil {
		w.logger.Error("failed to fetch pending notifications", "error", err, "user_id", userID)
		return fmt.Errorf("failed to fetch notifications: %w", err)
	}
	if len(notifications) == 0 {
		return nil
	}

	// Build digest body
	var items []string
	for _, n := range notifications {
		var payload map[string]interface{}
		_ = json.Unmarshal(n.Payload, &payload)
		items = append(items, fmt.Sprintf("- %s", payload["type"]))
	}
	body := "You have new notifications:\n" + strings.Join(items, "\n")

	// Get user info
	user, err := w.queries.GetUser(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to fetch user: %w", err)
	}

	// Send digest email
	err = w.notificationService.SendDigestNotification(ctx, user.Email, user.DisplayName.String, body)
	if err != nil {
		w.logger.Error("failed to send digest notification", "error", err, "user_id", userID)
		return fmt.Errorf("failed to send digest: %w", err)
	}

	// Mark notifications as sent
	err = w.queries.MarkNotificationsSent(ctx, userID)
	if err != nil {
		w.logger.Error("failed to mark notifications sent", "error", err, "user_id", userID)
	}

	return nil
}
