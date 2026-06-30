package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

type TestPlanService interface {
	FindAll(context.Context) ([]dbsqlc.TestPlan, error)
	FindAllByProjectID(context.Context, int64) ([]dbsqlc.TestPlan, error)
	FindAllByTestPlanID(context.Context, int32) ([]dbsqlc.ListTestRunsByPlanRow, error)
	GetOneTestPlan(context.Context, int64) (*schema.TestPlanResponseItem, error)
	Create(context.Context, *schema.CreateTestPlan) (*dbsqlc.GetTestPlanRow, error)
	AddTestCaseToPlan(context.Context, *schema.AssignTestsToPlanRequest) (*dbsqlc.GetTestPlanRow, error)
	DeleteByID(context.Context, int64) error
	Update(context.Context, schema.UpdateTestPlan) (bool, error)
	CloseTestPlan(context.Context, int32) error
	ChangeEnvironment(ctx context.Context, projectID, envID int64) error
}

var _ TestPlanService = &testPlanService{}

type testPlanService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTestPlanService(conn *dbsqlc.Queries, logger logging.Logger) TestPlanService {
	return &testPlanService{
		queries: conn,
		logger:  logger,
	}
}

// Create implements TestPlanService.
func (t *testPlanService) Create(ctx context.Context, request *schema.CreateTestPlan) (*dbsqlc.GetTestPlanRow, error) {
	testPlanParams := dbsqlc.CreateTestPlanParams{
		ProjectID:     int32(request.ProjectID),
		AssignedToID:  int32(request.AssignedToID),
		CreatedByID:   int32(request.CreatedByID),
		UpdatedByID:   int32(request.UpdatedByID),
		Kind:          dbsqlc.TestKind(request.Kind),
		Description:   common.NullString(request.Description),
		EnvironmentID: common.NewNullInt32(int32(request.EnvironmentID)),

		StartAt:        common.NullTime(request.StartAt),
		ScheduledEndAt: common.NullTime(request.ScheduledEndAt),
		ClosedAt:       common.NullTime(common.ZeroOrTime(request.ClosedAt)), // helper for optional
		NumTestCases:   0,
		NumFailures:    0,
		IsComplete:     common.FalseNullBool(),
		IsLocked:       common.FalseNullBool(),
		HasReport:      common.FalseNullBool(),
		CreatedAt:      common.NewNullTime(time.Now()),
		UpdatedAt:      common.NewNullTime(time.Now()),
	}

	testPlanID, err := t.queries.CreateTestPlan(ctx, testPlanParams)
	if err != nil {
		return nil, err
	}

	for _, assignedTestCase := range request.PlannedTests {
		if err := t.queries.AddTestCaseToPlan(ctx, dbsqlc.AddTestCaseToPlanParams{
			TestPlanID: int64(testPlanID),
			TestCaseID: uuid.MustParse(assignedTestCase.TestCaseID),
		}); err != nil {
			return nil, err
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
	return t.queries.ListTestRunsByPlan(ctx, sql.NullInt32{Int32: testPlanID, Valid: true})
}

// AddTestCaseToPlan implements TestPlanService.
func (t *testPlanService) AddTestCaseToPlan(ctx context.Context, request *schema.AssignTestsToPlanRequest) (*dbsqlc.GetTestPlanRow, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, request.PlanID)
	if err != nil {
		return nil, err
	}

	for _, assignedTestCase := range request.PlannedTests {
		for _, uid := range assignedTestCase.UserIDs {
			if err := t.queries.AddTestCaseToPlan(ctx, dbsqlc.AddTestCaseToPlanParams{
				TestPlanID:   request.PlanID,
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				AssignedToID: common.NewNullInt64(uid),
			}); err != nil {
				return nil, err
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

	// Use ListTestCasesByPlan to get assigned cases
	cases, err := t.queries.ListTestCasesByPlan(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to load test cases for plan %d: %w", id, err)
	}

	// Get test run statistics
	runStats, err := t.queries.GetTestPlanRunStats(ctx, sql.NullInt32{Int32: int32(id), Valid: true})
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

	// Build response test cases
	for _, tc := range cases {
		response.TestCases = append(response.TestCases, schema.TestCaseResponseItem{
			ID:                   tc.ID.String(),
			Title:                tc.Title,
			IsAssignedToTestPlan: true,
			TestPlan: &schema.TestPlanSummary{
				ID:   plan.ID,
				Name: plan.Description.String,
			},
			AssignedTesterIDs: func() []int64 {
				if tc.AssignedToID.Valid {
					return []int64{int64(tc.AssignedToID.Int64)}
				}
				return []int64{}
			}(),
		})
	}

	return &response, nil
}

func (t *testPlanService) Update(ctx context.Context, request schema.UpdateTestPlan) (bool, error) {
	err := t.queries.UpdateTestPlan(ctx, dbsqlc.UpdateTestPlanParams{
		ProjectID:      int32(request.ProjectID),
		Kind:           dbsqlc.TestKind(request.Kind),
		Description:    common.NullString(request.Description),
		EnvironmentID:  common.NewNullInt32(int32(request.EnvironmentID)),
		StartAt:        common.NullTime(request.StartAt),
		ClosedAt:       common.NullTime(common.ZeroOrTime(request.ClosedAt)),
		ScheduledEndAt: common.NullTime(request.ScheduledEndAt),
	})
	if err != nil {
		t.logger.Error("failed to update test plan", "error", err)
		return false, err
	}
	return true, nil
}

// CloseTestPlan implements TestRunService
func (t *testPlanService) CloseTestPlan(ctx context.Context, testPlanID int32) error {
	testRuns, err := t.queries.ListTestRunsByPlan(ctx, sql.NullInt32{Int32: testPlanID, Valid: true})
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
