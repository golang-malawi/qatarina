# Email Notifications Implementation Guide

## Overview
This implementation adds automated email notifications for various user actions in Qatarina:
- **Tester Assignment**: User receives email when assigned as a tester to a project
- **Test Plan Assignment**: User receives email when added to a test plan
- **Test Case Assignment**: User receives email when assigned a test case
- **Test Plan Due Date Reminder**: User receives reminder emails when test plan due date approaches

## Architecture

### Components

#### 1. **NotificationService** (`internal/services/notification.go`)
Central service for managing all notification types with specific methods for each notification type:
- `SendNotification()` - Generic notification sender based on type
- `SendTesterAssignedNotification()` - Tester assignment
- `SendTestPlanAddedNotification()` - Test plan assignment
- `SendTestCaseAssignedNotification()` - Test case assignment
- `SendTestPlanDueReminderNotification()` - Due date reminders

#### 2. **Email Templates** (`internal/templates/`)
- `tester_assigned_email.html` - Professional HTML template for tester assignment
- `test_plan_added_email.html` - Professional HTML template for test plan assignment
- `test_case_assigned_email.html` - Professional HTML template for test case assignment
- `test_plan_due_reminder_email.html` - Professional HTML template for due date reminder

#### 3. **River Worker Job** (`internal/worker/jobs/test_plan_due_reminder.go`)
Background job for processing due date reminders:
- `TestPlanDueReminderWorker` - Worker implementation
- `TestPlanDueReminderArgs` - Job arguments
- `ScheduleTestPlanDueReminders()` - Function to schedule reminders

### Service Integration

#### TesterService (`internal/services/tester.go`)
- Updated `Assign()` method to send email when tester is assigned
- Emails are sent asynchronously to avoid blocking the API response

#### TestPlanService (`internal/services/testplan.go`)
- Updated `Create()` method to send emails when test plan is created with assignments
- Updated `AddTestCaseToPlan()` method to send emails when test cases are assigned to users
- Emails are sent asynchronously

## Setup Instructions

### 1. Environment Configuration
Ensure your `qatarina.yaml` has SMTP configuration:
```yaml
smtp:
  host: smtp.gmail.com
  port: 587
  username: your-email@gmail.com
  password: your-app-password
  from: noreply@baseUrl
```

### 2. Enable River Worker (for scheduled reminders)

In `cmd/server.go`, uncomment the River worker initialization:

```go
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the Qatarina server daemon",
	Long:  `Starts the Qatarina server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		apiServer := api.NewAPI(qatarinaConfig)
		var err error
		apiServer.RiverClient, err = worker.StartRiverWorker(qatarinaConfig)
		if err != nil {
			return fmt.Errorf("failed to start river workers %v", err)
		}

		return apiServer.Start(qatarinaConfig.ListenAddress())
	},
}
```

### 3. Register Worker Jobs

Update `internal/worker/worker.go` to register the jobs:

```go
func StartRiverWorker(config *config.Config) (*river.Client[pgx.Tx], error) {
	workers := river.NewWorkers()
	
	// Register notification jobs
	dbConn := dbsqlc.New(config.OpenDB())
	logger := logging.NewFromConfig(&config.Logging)
	notificationService := services.NewNotificationService(logger, config.SMTP)
	
	if err := jobs.RegisterWorkers(workers, dbConn, logger, notificationService); err != nil {
		return nil, err
	}
	
	// ... rest of the worker setup
}
```

### 4. Create Database Table for River (if not exists)

River stores job metadata in PostgreSQL. Ensure the river migrations have been applied by the River client initialization (it handles this automatically).

### 5. Schedule Due Date Reminders

Add a scheduled task to check and send due date reminders. This can be done using a cron job or a periodic timer:

```go
// In your server initialization or a separate scheduler
go func() {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	defer ticker.Stop()

	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		err := jobs.ScheduleTestPlanDueReminders(
			ctx,
			apiServer.RiverClient,
			dbConn,
			logger,
			apiServer.NotificationService,
		)
		cancel()
		
		if err != nil {
			logger.Error("failed to schedule due date reminders", "error", err)
		}
	}
}()
```

## Usage Examples

### Sending Tester Assignment Email
```go
// This happens automatically when a tester is assigned via the API
err := testerService.Assign(ctx, projectID, userID, "lead")
// Email is sent asynchronously in a goroutine
```

### Sending Test Plan Assignment Email
```go
// This happens automatically when a test plan is created with assigned users
testPlan, err := testPlanService.Create(ctx, &schema.CreateTestPlan{
    ProjectID: projectID,
    PlannedTests: []schema.TestCaseAssignment{
        {
            TestCaseID: "test-case-uuid",
            UserIds: []int64{userID1, userID2},
        },
    },
    // ... other fields
})
// Emails are sent asynchronously for each assigned user
```

### Sending Test Case Assignment Email
```go
// This happens automatically when test cases are added to a plan
testPlan, err := testPlanService.AddTestCaseToPlan(ctx, &schema.AssignTestsToPlanRequest{
    ProjectID: projectID,
    PlanID: testPlanID,
    PlannedTests: []schema.TestCaseAssignment{
        {
            TestCaseID: "test-case-uuid",
            UserIds: []int64{userID1, userID2},
        },
    },
})
// Emails are sent asynchronously for each assigned user
```

## Configuration

### SMTP Configuration
```yaml
smtp:
  host: "smtp.example.com"
  port: 587
  username: "your-email@example.com"
  password: "your-password"
  from: "noreply@baseUrl"
```

### Notification Types
Modify `internal/services/notification.go` to customize:
- Email subject lines
- Template file paths
- Additional data passed to templates

### Email Templates
Customize HTML email templates in `internal/templates/`:
- Colors and branding
- Content and tone
- Links and CTAs (calls-to-action)

## Advanced Features

### Error Handling
- Failed email sends are logged but don't block operations
- Notifications are sent asynchronously to avoid impacting API response times
- Jobs can be retried automatically by River

### Async Notifications
All notifications except the immediate API responses are sent in background goroutines. This ensures:
- Fast API response times
- Non-blocking user experience
- Graceful handling of email service failures

### River Job Persistence
Due date reminders are stored as jobs in the database and can be:
- Retried automatically if they fail
- Inspected in the River UI
- Managed via River CLI

## Testing

### Manual Testing
1. Assign a tester to a project - check email received
2. Create a test plan with assignments - check emails received
3. Add test cases to a test plan - check emails received
4. Check River job queue for pending due reminder jobs

### Debug Mode
Enable debug logging in your config to see email sending details:
```yaml
logging:
  level: "debug"
```

## Troubleshooting

### Emails Not Sending
1. Check SMTP configuration in `qatarina.yaml`
2. Verify email provider credentials
3. Check application logs for SMTP errors
4. Ensure firewall allows outbound connections to SMTP server

### River Worker Issues
1. Ensure PostgreSQL has River tables (created automatically)
2. Check that River client is properly initialized in server startup
3. Review River job queue in database: `SELECT * FROM river_job;`

### Missing Notifications
1. Check `NotificationService` is properly injected in services
2. Verify template files exist in `internal/templates/`
3. Check application logs for template rendering errors

## Future Enhancements

- Email notification preferences (opt-in/opt-out)
- Notification digest emails (batch multiple notifications)
- SMS/Slack notifications
- Email templates customization via UI
- Notification history in database
- Failed notification retry dashboard
