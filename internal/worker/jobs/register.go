package jobs

import (
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/riverqueue/river"
)

// RegisterWorkers registers all available workers with the River queue
func RegisterWorkers(
	workers *river.Workers,
	queries *dbsqlc.Queries,
	logger logging.Logger,
	notificationService services.NotificationService,
) error {
	river.AddWorker(workers, NewTestPlanDueReminderWorker(queries, logger, notificationService))
	river.AddWorker(workers, NewDigestWorker(queries, logger, notificationService)) // NEW
	return nil
}
