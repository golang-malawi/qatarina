package services

import (
	"cmp"
	"context"
	"database/sql"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

type TestRunService interface {
	FindAll(context.Context) ([]dbsqlc.TestRun, error)
	Commit(context.Context, *schema.CommitTestRunResult) (*dbsqlc.TestRun, error)
	CommitBulk(context.Context, *schema.BulkCommitTestResults) (bool, error)
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
func (t *testRunService) FindAll(context.Context) ([]dbsqlc.TestRun, error) {
	// return t.queries.ListTestRuns()
	panic("not implemented")
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
