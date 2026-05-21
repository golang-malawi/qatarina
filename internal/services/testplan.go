package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

func parseDate(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, fmt.Errorf("date value is empty")
	}

	layouts := []string{
		"2006-01-02",
		"2006/01/02",
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006/01/02 15:04:05",
	}

	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed, nil
		}
	}

	return time.Time{}, fmt.Errorf("invalid date format: %q", value)
}

type TestPlanService interface {
	FindAll(context.Context) ([]dbsqlc.TestPlan, error)
	FindAllByProjectID(context.Context, int64) ([]dbsqlc.TestPlan, error)
	FindAllByTestPlanID(context.Context, int32) ([]dbsqlc.ListTestRunsByPlanRow, error)
	GetOneTestPlan(context.Context, int64) (*schema.TestPlanResponseItem, error)
	Create(context.Context, *schema.CreateTestPlan, string) (*dbsqlc.GetTestPlanRow, error)
	AddTestCaseToPlan(context.Context, *schema.AssignTestsToPlanRequest, string) (*dbsqlc.GetTestPlanRow, error)
	DeleteByID(context.Context, int64) error
	Update(context.Context, schema.UpdateTestPlan) (bool, error)
	CloseTestPlan(context.Context, int32) error
	ChangeEnvironment(ctx context.Context, projectID, envID int64) error
}

var _ TestPlanService = &testPlanService{}

type testPlanService struct {
	queries             *dbsqlc.Queries
	logger              logging.Logger
	notificationService NotificationService
}

func NewTestPlanService(conn *dbsqlc.Queries, logger logging.Logger, notificationService NotificationService) TestPlanService {
	return &testPlanService{
		queries:             conn,
		logger:              logger,
		notificationService: notificationService,
	}
}

// Create implements TestPlanService.
func (t *testPlanService) Create(ctx context.Context, request *schema.CreateTestPlan, assignedBy string) (*dbsqlc.GetTestPlanRow, error) {
	startAt, err := parseDate(request.StartAt)
	if err != nil {
		return nil, fmt.Errorf("invalid start_at: %w", err)
	}

	scheduledEndAt, err := parseDate(request.ScheduledEndAt)
	if err != nil {
		return nil, fmt.Errorf("invalid scheduled_end_at: %w", err)
	}

	var closedAt sql.NullTime
	if request.ClosedAt != nil && *request.ClosedAt != "" {
		closedTime, cerr := parseDate(*request.ClosedAt)
		if cerr != nil {
			return nil, fmt.Errorf("invalid closed_at: %w", cerr)
		}
		closedAt = sql.NullTime{Time: closedTime, Valid: true}
	}

	testPlanParams := dbsqlc.CreateTestPlanParams{
		ProjectID:      int32(request.ProjectID),
		AssignedToID:   int32(request.AssignedToID),
		CreatedByID:    int32(request.CreatedByID),
		UpdatedByID:    int32(request.UpdatedByID),
		Kind:           dbsqlc.TestKind(request.Kind),
		Description:    sql.NullString{String: request.Description, Valid: true},
		EnvironmentID:  common.NewNullInt32(int32(request.EnvironmentID)),
		StartAt:        sql.NullTime{Time: startAt, Valid: true},
		ClosedAt:       closedAt,
		ScheduledEndAt: sql.NullTime{Time: scheduledEndAt, Valid: true},
		NumTestCases:   0,
		NumFailures:    0,
		IsComplete:     sql.NullBool{Bool: false, Valid: true},
		IsLocked:       sql.NullBool{Bool: false, Valid: true},
		HasReport:      sql.NullBool{Bool: false, Valid: true},
		CreatedAt: sql.NullTime{
			Time: time.Now(), Valid: true,
		},
		UpdatedAt: sql.NullTime{
			Time: time.Now(), Valid: true,
		},
	}

	testPlanID, err := t.queries.CreateTestPlan(ctx, testPlanParams)
	if err != nil {
		return nil, err
	}

	// Get project information for notifications
	project, projErr := t.queries.GetProject(ctx, int32(request.ProjectID))
	if projErr != nil {
		t.logger.Error("failed to get project for notification", "error", err, "project_id", request.ProjectID)
	}

	for _, assignedTestCase := range request.PlannedTests {
		testCase, err := t.queries.GetTestCase(ctx, uuid.MustParse(assignedTestCase.TestCaseID))
		if err != nil {
			return nil, err
		}
		for _, userID := range assignedTestCase.UserIds {
			testRunID, _ := uuid.NewV7()
			testRunParams := dbsqlc.CreateNewTestRunParams{
				ID:           testRunID,
				ProjectID:    int32(request.ProjectID),
				TestPlanID:   int32(testPlanID),
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				OwnerID:      int32(request.CreatedByID),
				TestedByID:   common.NewNullInt32(int32(userID)),
				AssignedToID: common.NewNullInt32(int32(userID)),
				Code:         fmt.Sprintf("TC-%s/%d", testCase.Code, userID),
				CreatedAt: sql.NullTime{
					Time: time.Now(), Valid: true,
				},
				UpdatedAt: sql.NullTime{
					Time: time.Now(), Valid: true,
				},
			}

			_, err = t.queries.CreateNewTestRun(ctx, testRunParams)
			if err != nil {
				return nil, err
			}

			// Send test plan added notification asynchronously
			if projErr == nil {
				go func(uid int64, planID int64) {
					// Get user information
					user, err := t.queries.GetUser(ctx, int32(uid))
					if err != nil {
						t.logger.Error("failed to get user for test plan notification", "error", err, "user_id", uid)
						return
					}

					// Send the notification
					notificationErr := t.notificationService.SendTestPlanAddedNotification(
						ctx,
						user.Email,
						user.DisplayName.String,
						project.Title,
						request.Description,
						int64(project.ID),
						planID,
						assignedBy,
					)
					if notificationErr != nil {
						t.logger.Error("failed to send test plan added notification", "error", notificationErr, "user_id", uid, "test_plan_id", planID)
					}
				}(userID, int64(testPlanID))
			}
		}
	}

	createdTestPlan, err := t.queries.GetTestPlan(ctx, testPlanID)
	return &createdTestPlan, err
}

// FindAll implements TestPlanService.
func (t *testPlanService) FindAll(ctx context.Context) ([]dbsqlc.TestPlan, error) {
	return t.queries.ListTestPlans(ctx)
}
func (t *testPlanService) FindAllByProjectID(ctx context.Context, projectID int64) ([]dbsqlc.TestPlan, error) {
	return t.queries.ListTestPlansByProject(ctx, int32(projectID))
}

// FindAllByTestPlanID implements TestPlanService
func (t *testPlanService) FindAllByTestPlanID(ctx context.Context, testPlanID int32) ([]dbsqlc.ListTestRunsByPlanRow, error) {
	return t.queries.ListTestRunsByPlan(ctx, testPlanID)
}

// AddTestCaseToPlan implements TestPlanService.
func (t *testPlanService) AddTestCaseToPlan(ctx context.Context, request *schema.AssignTestsToPlanRequest, assignedBy string) (*dbsqlc.GetTestPlanRow, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, request.PlanID)
	if err != nil {
		return nil, err
	}
	testPlanID := request.PlanID

	// Get project information for notifications
	project, projErr := t.queries.GetProject(ctx, int32(request.ProjectID))
	if projErr != nil {
		t.logger.Error("failed to get project for notification", "error", err, "project_id", request.ProjectID)
	}

	for _, assignedTestCase := range request.PlannedTests {
		testCase, err := t.queries.GetTestCase(ctx, uuid.MustParse(assignedTestCase.TestCaseID))
		if err != nil {
			return nil, err
		}
		for _, userID := range assignedTestCase.UserIds {
			testRunID, _ := uuid.NewV7()
			testRunParams := dbsqlc.CreateNewTestRunParams{
				ID:           testRunID,
				ProjectID:    int32(request.ProjectID),
				TestPlanID:   int32(testPlanID),
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				OwnerID:      int32(testPlan.CreatedByID),
				TestedByID:   common.NewNullInt32(int32(userID)),
				AssignedToID: common.NewNullInt32(int32(userID)),
				Code:         fmt.Sprintf("TC-%s/%d", testCase.Code, userID),
				CreatedAt: sql.NullTime{
					Time: time.Now(), Valid: true,
				},
				UpdatedAt: sql.NullTime{
					Time: time.Now(), Valid: true,
				},
			}

			_, err = t.queries.CreateNewTestRun(ctx, testRunParams)
			if err != nil {
				return nil, err
			}

			// Send notification email asynchronously
			if projErr == nil {
				go func(uid int64, planID int64, tcID string, tcName, tcCode string) {
					// Get user information
					user, err := t.queries.GetUser(ctx, int32(uid))
					if err != nil {
						t.logger.Error("failed to get user for test case assignment notification", "error", err, "user_id", uid)
						return
					}

					// Send the notification
					notificationErr := t.notificationService.SendTestCaseAssignedNotification(
						ctx,
						user.Email,
						user.DisplayName.String,
						project.Title,
						tcName,
						tcCode,
						int64(project.ID),
						tcID,
						assignedBy,
					)

					if notificationErr != nil {
						t.logger.Error("failed to send test case assignment notification", "error", notificationErr, "user_id", uid, "test_case_id", tcID)
					}
				}(userID, int64(testPlanID), assignedTestCase.TestCaseID, testCase.Title, testCase.Code)

			}
		}
	}

	return &testPlan, nil
}

func (t *testPlanService) DeleteByID(ctx context.Context, id int64) error {
	_, err := t.queries.DeleteTestPlan(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete test plan %d:%w", id, err)
	}
	return nil
}

func (t *testPlanService) GetOneTestPlan(ctx context.Context, id int64) (*schema.TestPlanResponseItem, error) {
	plan, err := t.queries.GetTestPlan(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("test plan %d not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to load test plan: %w", err)
	}

	cases, err := t.queries.GetTestCasesWithTestersByPlan(ctx, int32(id))
	if err != nil {
		return nil, fmt.Errorf("failed to load test cases with testers for plan %d: %w", id, err)
	}

	// Get test run statistics
	runStats, err := t.queries.GetTestPlanRunStats(ctx, int32(id))
	if err != nil {
		return nil, fmt.Errorf("failed to load test run statistics for plan %d: %w", id, err)
	}

	response := schema.TestPlanResponseItem{
		ID:              plan.ID,
		ProjectID:       plan.ProjectID,
		EnvironmentID:   plan.EnvironmentID.Int32,
		AssignedToID:    plan.AssignedToID,
		CreatedByID:     plan.CreatedByID,
		UpdatedByID:     plan.UpdatedByID,
		Kind:            string(plan.Kind),
		Description:     plan.Description.String,
		StartAt:         plan.StartAt.Time.Format(time.DateTime),
		ClosedAt:        plan.ClosedAt.Time.Format(time.DateTime),
		ScheduledEndAt:  plan.ScheduledEndAt.Time.Format(time.DateTime),
		NumTestCases:    int32(plan.NumTestCases),
		NumFailures:     plan.NumFailures,
		PassedCount:     runStats.PassedCount,
		FailedCount:     runStats.FailedCount,
		PendingCount:    runStats.PendingCount,
		AssignedTesters: runStats.AssignedTestersCount,
		IsComplete:      plan.IsComplete.Bool,
		IsLocked:        plan.IsLocked.Bool,
		HasReport:       plan.HasReport.Bool,
		CreatedAt:       plan.CreatedAt.Time.Format(time.DateTime),
		UpdatedAt:       plan.UpdatedAt.Time.Format(time.DateTime),
		TestCases:       []schema.TestCaseResponseItem{},
	}

	for _, tc := range cases {
		response.TestCases = append(response.TestCases, schema.TestCaseResponseItem{
			ID:                   tc.TestCaseID.String(),
			Title:                tc.Title,
			IsAssignedToTestPlan: true,
			TestPlan: &schema.TestPlanSummary{
				ID:   plan.ID,
				Name: plan.Description.String,
			},
			AssignedTesterIDs: tc.TesterIds,
		})
	}

	return &response, nil
}

func (t *testPlanService) Update(ctx context.Context, request schema.UpdateTestPlan) (bool, error) {
	startAt, err := parseDate(request.StartAt)
	if err != nil {
		return false, fmt.Errorf("invalid start_at: %w", err)
	}

	var closedAt sql.NullTime
	if request.ClosedAt != nil && *request.ClosedAt != "" {
		closedTime, cerr := parseDate(*request.ClosedAt)
		if cerr != nil {
			return false, fmt.Errorf("invalid closed_at: %w", cerr)
		}
		closedAt = sql.NullTime{Time: closedTime, Valid: true}
	}

	scheduledEndAt, err := parseDate(request.ScheduledEndAt)
	if err != nil {
		return false, fmt.Errorf("invalid scheduled_end_at: %w", err)
	}

	err = t.queries.UpdateTestPlan(ctx, dbsqlc.UpdateTestPlanParams{
		ProjectID:      int32(request.ProjectID),
		Kind:           dbsqlc.TestKind(request.Kind),
		Description:    common.NullString(request.Description),
		EnvironmentID:  common.NewNullInt32(int32(request.EnvironmentID)),
		StartAt:        common.NullTime(startAt),
		ClosedAt:       closedAt,
		ScheduledEndAt: common.NullTime(scheduledEndAt),
	})
	if err != nil {
		t.logger.Error("failed to update test plan", "error", err)
		return false, err
	}
	return true, nil
}

// CloseTestPlan implements TestRunService
func (t *testPlanService) CloseTestPlan(ctx context.Context, testPlanID int32) error {
	testRuns, err := t.queries.ListTestRunsByPlan(ctx, testPlanID)
	if err != nil {
		t.logger.Error("error listing test runs", "error", err)
		return err
	}

	for _, testRun := range testRuns {
		if testRun.ResultState == "pending" || !testRun.IsClosed.Bool {
			t.logger.Error("failed to close test plan", "error", err)
			return fmt.Errorf("cannot close: some test run %v is still pending", testRun.ID)
		}
	}

	rowsAffected, err := t.queries.CloseTestPlan(ctx, dbsqlc.CloseTestPlanParams{
		ID:       int64(testPlanID),
		ClosedAt: common.NullTime(time.Now()),
	})
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("test plan %d not found", testPlanID)
	}

	return nil
}

func (t *testPlanService) ChangeEnvironment(ctx context.Context, testPlanID, envID int64) error {
	params := dbsqlc.ChangeEnvironmentParams{
		ID:            testPlanID,
		EnvironmentID: common.NewNullInt32(int32(envID)),
	}
	return t.queries.ChangeEnvironment(ctx, params)
}
