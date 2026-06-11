package jobs

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/riverqueue/river"
)

// ScheduleDigestNotifications enqueues digest jobs for all users with pending notifications
func ScheduleDigestNotifications[TTx any](
	ctx context.Context,
	riverClient *river.Client[TTx],
	queries *dbsqlc.Queries,
	logger logging.Logger,
) error {
	users, err := queries.ListUsersWithPendingNotifications(ctx)
	if err != nil {
		logger.Error("failed to fetch users with pending notifications", "error", err)
		return fmt.Errorf("failed to fetch users: %w", err)
	}

	for _, u := range users {
		_, err := riverClient.Insert(ctx, DigestArgs{UserID: u.ID}, nil)
		if err != nil {
			logger.Error("failed to enqueue digest job", "error", err, "user_id", u.ID)
			continue
		}
		logger.Info("digest job enqueued", "user_id", u.ID)
	}

	return nil
}
