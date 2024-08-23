package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

type TestPlanService interface {
	FindAll(context.Context) ([]dbsqlc.TestPlan, error)
	Create(context.Context, *schema.CreateTestPlan) (*dbsqlc.TestPlan, error)
	AddTestCaseToPlan(context.Context, *schema.AssignTestsToPlanRequest) (*dbsqlc.TestPlan, error)
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
				Code:         fmt.Sprintf("TC-%d-%d", request.ProjectID, userID),
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

// AddTestCaseToPlan implements TestPlanService.
func (t *testPlanService) AddTestCaseToPlan(ctx context.Context, request *schema.AssignTestsToPlanRequest) (*dbsqlc.TestPlan, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, request.PlanID)
	if err != nil {
		return nil, err
	}
	testPlanID := request.PlanID
	for _, assignedTestCase := range request.PlannedTests {
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
				Code:         fmt.Sprintf("TC-%d-%d", request.ProjectID, userID),
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
