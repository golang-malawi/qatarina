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
	Create(context.Context, *schema.TestRunRequest) (bool, error)
	GetOneTestRun(context.Context, string) (*dbsqlc.TestRun, error)
	// CreateFromFailedTest records tests without necessarily first creating TestCases.
	//
	// A common use case for Quality Assurance process is reporting things, right now,
	// having to wait for a scheduled Test Plan/Session. This function covers the scenario
	// where Testers need to just record "Issues" (TODO: reconsider the terminology)
	// This allows Testers to record failed tests which get backlinked to default test plan or
	// a specific test plan if specified
	CreateFromFoundIssues(context.Context, *schema.NewFoundIssuesRequest)
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

// Create implements TestRunService
func (t *testRunService) Create(ctx context.Context, request *schema.TestRunRequest) (bool, error) {
	_, err := t.queries.CreateNewTestRun(ctx, dbsqlc.CreateNewTestRunParams{
		ProjectID:    request.ProjectID,
		TestPlanID:   request.TestPlanID,
		TestCaseID:   uuid.MustParse(request.TestCaseID),
		OwnerID:      request.OwnerID,
		TestedByID:   request.TestedByID,
		AssignedToID: request.AssignedToID,
		Code:         request.Code,
		CreatedAt:    common.NullTime(time.Now()),
		UpdatedAt:    common.NullTime(time.Now()),
	})
	if err != nil {
		return false, fmt.Errorf("failed to create page %w", err)
	}

	return true, nil
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

// GetOneTestRun implements TestRunService
func (t *testRunService) GetOneTestRun(ctx context.Context, testRunID string) (*dbsqlc.TestRun, error) {
	testRun, err := t.queries.GetTestRun(ctx, uuid.MustParse(testRunID))
	if err != nil {
		return nil, fmt.Errorf("failed to get test run %s: %w", testRunID, err)
	}

	return &testRun, nil
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
