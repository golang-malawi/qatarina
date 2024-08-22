package services

import (
	"context"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
)

type TestRunService interface {
	FindAll(context.Context) ([]dbsqlc.TestRun, error)
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
