package services

import (
	"cmp"
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

type TestRunService interface {
	FindAll(context.Context) ([]dbsqlc.TestRun, error)
	DeleteByID(context.Context, string) error
	FindAllByProjectID(context.Context, int64) ([]dbsqlc.TestRun, error)
	Commit(context.Context, *schema.CommitTestRunResult) (*dbsqlc.TestRun, error)
	CommitBulk(context.Context, *schema.BulkCommitTestResults) (bool, error)
	// CreateFromFailedTest records tests without necessarily first creating TestCases.
	//
	// A common use case for Quality Assurance process is reporting things, right now,
	// having to wait for a scheduled Test Plan/Session. This function covers the scenario
	// where Testers need to just record "Issues" (TODO: reconsider the terminology)
	// This allows Testers to record failed tests which get backlinked to default test plan or
	// a specific test plan if specified
	CreateFromFoundIssues(context.Context, *schema.NewFoundIssuesRequest)
	CloseTestPlan(context.Context, int32) error
}

type testRunService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTestRunService(conn *dbsqlc.Queries, logger logging.Logger) TestRunService {
	return &testRunService{
		queries: conn,
		logger:  logger,
	}
}

// FindAll implements TestRunService.
func (t *testRunService) FindAll(ctx context.Context) ([]dbsqlc.TestRun, error) {
	return t.queries.ListTestRuns(ctx)
}

// FindAllByProjectID implements TestRunService.
func (t *testRunService) FindAllByProjectID(ctx context.Context, projectID int64) ([]dbsqlc.TestRun, error) {
	return t.queries.ListTestRunsByProject(ctx, int32(projectID))
}

// Commit implements TestRunService.
func (t *testRunService) Commit(ctx context.Context, request *schema.CommitTestRunResult) (*dbsqlc.TestRun, error) {
	testRun, err := t.queries.GetTestRun(ctx, uuid.MustParse(request.TestRunID))
	if err != nil {
		return nil, err
	}

	_, err = t.queries.CommitTestRunResult(ctx, dbsqlc.CommitTestRunResultParams{
		ID:           uuid.MustParse(request.TestRunID),
		TestedByID:   int32(request.UserID),
		Notes:        request.Notes,
		UpdatedAt:    sql.NullTime{Valid: true, Time: time.Now()},
		ResultState:  request.State,
		IsClosed:     sql.NullBool{Valid: true, Bool: request.IsClosed},
		TestedOn:     time.Now(), // TODO: get from the request
		ActualResult: sql.NullString{Valid: true, String: request.ActualResult},
		ExpectedResult: sql.NullString{
			Valid:  true,
			String: cmp.Or(request.ExpectedResult, testRun.ExpectedResult.String),
		},
	})

	if err != nil {
		return nil, err
	}

	testRun, err = t.queries.GetTestRun(ctx, uuid.MustParse(request.TestRunID))
	if err != nil {
		return nil, err
	}
	return &testRun, nil
}

// CommitBulk implements TestRunService.
func (t *testRunService) CommitBulk(ctx context.Context, bulkRequest *schema.BulkCommitTestResults) (bool, error) {
	for _, request := range bulkRequest.TestResults {
		request.UserID = bulkRequest.UserID
		_, err := t.Commit(ctx, &request)
		if err != nil {
			return false, err
		}
	}
	return true, nil
}

// DeleteByID implements TestRunService.
func (t *testRunService) DeleteByID(ctx context.Context, testRunID string) error {
	_, err := t.queries.DeleteTestRun(ctx, uuid.MustParse(testRunID))
	return err
}

// CreateFromFoundIssues implements TestRunService.
func (t *testRunService) CreateFromFoundIssues(ctx context.Context, request *schema.NewFoundIssuesRequest) {
	panic("unimplemented")
}

// CloseTestPlan implements TestRunService
func (t *testRunService) CloseTestPlan(ctx context.Context, testPlanID int32) error {
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
