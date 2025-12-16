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
	FindAllByTestPlanID(context.Context, int32) ([]dbsqlc.TestRun, error)
	GetOneTestPlan(context.Context, int64) (*schema.TestPlanResponseItem, error)
	Create(context.Context, *schema.CreateTestPlan) (*dbsqlc.TestPlan, error)
	AddTestCaseToPlan(context.Context, *schema.AssignTestsToPlanRequest) (*dbsqlc.TestPlan, error)
	DeleteByID(context.Context, int64) error
	Update(context.Context, schema.UpdateTestPlan) (bool, error)
	CloseTestPlan(context.Context, int32) error
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
func (t *testPlanService) Create(ctx context.Context, request *schema.CreateTestPlan) (*dbsqlc.TestPlan, error) {

	// TODO: create the test plan
	// TODO: create test-runs for the plan from assigned
	testPlanParams := dbsqlc.CreateTestPlanParams{
		ProjectID:    int32(request.ProjectID),
		AssignedToID: int32(request.AssignedToID),
		CreatedByID:  int32(request.CreatedByID),
		UpdatedByID:  int32(request.UpdatedByID),
		Kind:         dbsqlc.TestKind(request.Kind),
		Description:  sql.NullString{String: request.Description, Valid: true},
		// TODO: handle time fields
		// StartAt:        sql.NullTime{Time: time.Now, Valid: true},
		// ScheduledEndAt: sql.NullTime{Time: request.ScheduledEndAt, Valid: true},
		NumTestCases: 0,
		NumFailures:  0,
		IsComplete:   sql.NullBool{Bool: false, Valid: true},
		IsLocked:     sql.NullBool{Bool: false, Valid: true},
		HasReport:    sql.NullBool{Bool: false, Valid: true},
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
	for _, assignedTestCase := range request.PlannedTests {
		testCase, err := t.queries.GetTestCase(ctx, uuid.MustParse(assignedTestCase.TestCaseID))
		if err != nil {
			return nil, err
		}
		for _, userID := range assignedTestCase.UserIds {
			testRunID, err := uuid.NewV7()
			testRunParams := dbsqlc.CreateNewTestRunParams{
				ID:           testRunID,
				ProjectID:    int32(request.ProjectID),
				TestPlanID:   int32(testPlanID),
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				OwnerID:      int32(request.CreatedByID),
				TestedByID:   int32(userID),
				AssignedToID: int32(userID),
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
func (t *testPlanService) FindAllByTestPlanID(ctx context.Context, testPlanID int32) ([]dbsqlc.TestRun, error) {
	return t.queries.ListTestRunsByPlan(ctx, testPlanID)
}

// AddTestCaseToPlan implements TestPlanService.
func (t *testPlanService) AddTestCaseToPlan(ctx context.Context, request *schema.AssignTestsToPlanRequest) (*dbsqlc.TestPlan, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, request.PlanID)
	if err != nil {
		return nil, err
	}
	testPlanID := request.PlanID
	for _, assignedTestCase := range request.PlannedTests {
		testCase, err := t.queries.GetTestCase(ctx, uuid.MustParse(assignedTestCase.TestCaseID))
		if err != nil {
			return nil, err
		}
		for _, userID := range assignedTestCase.UserIds {
			testRunID, err := uuid.NewV7()
			testRunParams := dbsqlc.CreateNewTestRunParams{
				ID:           testRunID,
				ProjectID:    int32(request.ProjectID),
				TestPlanID:   int32(testPlanID),
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				OwnerID:      int32(testPlan.CreatedByID),
				TestedByID:   int32(userID),
				AssignedToID: int32(userID),
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
	rows, err := t.queries.GetTestPlanWithTestCases(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("test plan %d not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to load test plan with cases: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("test plan %d not found", id)
	}

	firstRow := rows[0]

	response := schema.TestPlanResponseItem{
		ID:             firstRow.ID,
		ProjectID:      firstRow.ProjectID,
		AssignedToID:   firstRow.AssignedToID,
		CreatedByID:    firstRow.CreatedByID,
		UpdatedByID:    firstRow.UpdatedByID,
		Kind:           string(firstRow.Kind),
		Description:    firstRow.Description.String,
		StartAt:        firstRow.StartAt.Time.Format(time.DateTime),
		ClosedAt:       firstRow.ClosedAt.Time.Format(time.DateTime),
		ScheduledEndAt: firstRow.ScheduledEndAt.Time.Format(time.DateTime),
		NumTestCases:   firstRow.NumTestCases,
		NumFailures:    firstRow.NumFailures,
		IsComplete:     firstRow.IsComplete.Bool,
		IsLocked:       firstRow.IsLocked.Bool,
		HasReport:      firstRow.HasReport.Bool,
		CreatedAt:      firstRow.CreatedAt.Time.Format(time.DateTime),
		UpdatedAt:      firstRow.UpdatedAt.Time.Format(time.DateTime),
		TestCases:      []schema.TestCaseResponseItem{},
	}

	for _, row := range rows {
		if row.TestCaseID.Valid {
			response.TestCases = append(response.TestCases, schema.TestCaseResponseItem{
				ID:    row.TestCaseID.UUID.String(),
				Title: row.TestCaseTitle.String,
			})
		}
	}

	return &response, nil
}

func (t *testPlanService) Update(ctx context.Context, request schema.UpdateTestPlan) (bool, error) {
	err := t.queries.UpdateTestPlan(ctx, dbsqlc.UpdateTestPlanParams{
		ProjectID:      int32(request.ProjectID),
		Kind:           dbsqlc.TestKind(request.Kind),
		Description:    common.NullString(request.Description),
		StartAt:        common.NullTime(request.StartAt),
		ClosedAt:       common.NullTime(request.ClosedAt),
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

	_, err = t.queries.CloseTestPlan(ctx, dbsqlc.CloseTestPlanParams{
		ID:       int64(testPlanID),
		ClosedAt: common.NullTime(time.Now()),
	})
	return err
}
