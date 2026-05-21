package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/riverqueue/river"
)

// TestPlanDueReminderArgs contains the arguments for the due date reminder job
type TestPlanDueReminderArgs struct {
	TestPlanID int64 `json:"test_plan_id"`
	ProjectID  int64 `json:"project_id"`
}

// Kind implements river.Job
func (a TestPlanDueReminderArgs) Kind() string { return "test_plan_due_reminder" }

// TestPlanDueReminderWorker sends reminder emails for test plans with due dates
type TestPlanDueReminderWorker struct {
	river.WorkerDefaults[TestPlanDueReminderArgs]
	queries             *dbsqlc.Queries
	logger              logging.Logger
	notificationService services.NotificationService
}

// NewTestPlanDueReminderWorker creates a new test plan due reminder worker
func NewTestPlanDueReminderWorker(queries *dbsqlc.Queries, logger logging.Logger, notificationService services.NotificationService) *TestPlanDueReminderWorker {
	return &TestPlanDueReminderWorker{
		queries:             queries,
		logger:              logger,
		notificationService: notificationService,
	}
}

// Work implements river.Worker
func (w *TestPlanDueReminderWorker) Work(ctx context.Context, job *river.Job[TestPlanDueReminderArgs]) error {
	testPlanID := job.Args.TestPlanID
	projectID := job.Args.ProjectID

	// Get the test plan
	testPlan, err := w.queries.GetTestPlan(ctx, testPlanID)
	if err != nil {
		w.logger.Error("failed to fetch test plan for due reminder", "error", err, "test_plan_id", testPlanID)
		return fmt.Errorf("failed to fetch test plan: %w", err)
	}

	// Check if the test plan has a scheduled end date
	if !testPlan.ScheduledEndAt.Valid {
		w.logger.Debug("test plan has no scheduled end date, skipping reminder", "test_plan_id", testPlanID)
		return nil
	}

	// Get the project
	project, err := w.queries.GetProject(ctx, int32(projectID))
	if err != nil {
		w.logger.Error("failed to fetch project for due reminder", "error", err, "project_id", projectID)
		return fmt.Errorf("failed to fetch project: %w", err)
	}

	// Get the assigned user for this test plan
	if testPlan.AssignedToID == 0 {
		w.logger.Debug("test plan has no assigned user, skipping reminder", "test_plan_id", testPlanID)
		return nil
	}

	assignedUser, err := w.queries.GetUser(ctx, testPlan.AssignedToID)
	if err != nil {
		w.logger.Error("failed to fetch assigned user for due reminder", "error", err, "user_id", testPlan.AssignedToID)
		return fmt.Errorf("failed to fetch assigned user: %w", err)
	}

	// Send the reminder email
	err = w.notificationService.SendTestPlanDueReminderNotification(
		ctx,
		assignedUser.Email,
		assignedUser.DisplayName.String,
		project.Title,
		testPlan.Description.String,
		projectID,
		testPlanID,
		testPlan.ScheduledEndAt.Time,
	)
	if err != nil {
		w.logger.Error("failed to send due reminder notification", "error", err, "test_plan_id", testPlanID, "user_id", testPlan.AssignedToID)
		return fmt.Errorf("failed to send notification: %w", err)
	}

	w.logger.Info("due reminder notification sent", "test_plan_id", testPlanID, "user_id", testPlan.AssignedToID)
	return nil
}

// ScheduleTestPlanDueReminders schedules reminder emails for all test plans with upcoming due dates
// This should be called periodically by a scheduled task (e.g., every day)
func ScheduleTestPlanDueReminders[TTx any](
	ctx context.Context,
	riverClient *river.Client[TTx],
	queries *dbsqlc.Queries,
	logger logging.Logger,
	notificationService services.NotificationService,
) error {
	// Get all test plans that are not completed and have a scheduled end date
	testPlans, err := queries.ListTestPlans(ctx)
	if err != nil {
		logger.Error("failed to fetch test plans for scheduling reminders", "error", err)
		return fmt.Errorf("failed to fetch test plans: %w", err)
	}

	now := time.Now()
	for _, testPlan := range testPlans {
		// Skip if test plan is already completed
		if testPlan.IsComplete.Bool {
			continue
		}

		// Skip if test plan has no scheduled end date
		if !testPlan.ScheduledEndAt.Valid {
			continue
		}

		dueDate := testPlan.ScheduledEndAt.Time
		// Send reminder if due date is within the next 3 days
		daysUntilDue := dueDate.Sub(now).Hours() / 24
		if daysUntilDue > 0 && daysUntilDue <= 3 {
			// Enqueue the job
			_, err := riverClient.Insert(ctx, TestPlanDueReminderArgs{
				TestPlanID: testPlan.ID,
				ProjectID:  int64(testPlan.ProjectID),
			}, nil)
			if err != nil {
				logger.Error("failed to enqueue due reminder job", "error", err, "test_plan_id", testPlan.ID)
				continue
			}
		}
	}

	return nil
}
