package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/search"
	"github.com/google/uuid"
)

// indexTimeout bounds how long a write request waits on the search engine
const indexTimeout = 5 * time.Second

// searchableTestCaseService decorates a TestCaseService, keeping the search
// index in sync with writes and serving Search from the search engine.
// Index failures are logged and never fail the underlying operation; the
// index can be rebuilt at any time with ReindexTestCases.
type searchableTestCaseService struct {
	TestCaseService
	queries *dbsqlc.Queries
	engine  search.Engine
	logger  logging.Logger
}

// NewSearchableTestCaseService wraps the given service with search indexing.
// When the engine is disabled the service is returned unchanged.
func NewSearchableTestCaseService(inner TestCaseService, conn *dbsqlc.Queries, engine search.Engine, logger logging.Logger) TestCaseService {
	if engine == nil || !engine.Enabled() {
		return inner
	}
	return &searchableTestCaseService{
		TestCaseService: inner,
		queries:         conn,
		engine:          engine,
		logger:          logger,
	}
}

// ReindexTestCases rebuilds the search index from all test cases in the database
func ReindexTestCases(ctx context.Context, conn *dbsqlc.Queries, engine search.Engine) (int, error) {
	if err := engine.Setup(ctx); err != nil {
		return 0, err
	}
	testCases, err := conn.ListTestCases(ctx)
	if err != nil {
		return 0, err
	}
	docs := make([]search.TestCaseDocument, 0, len(testCases))
	for i := range testCases {
		docs = append(docs, search.NewTestCaseDocument(&testCases[i]))
	}
	return len(docs), engine.Reindex(ctx, docs)
}

func (s *searchableTestCaseService) Search(ctx context.Context, keyword string) ([]dbsqlc.TestCase, error) {
	ids, err := s.engine.SearchTestCases(ctx, search.Query{Text: keyword})
	if err != nil {
		s.logger.Warn(loggedmodule.Search, "search engine query failed, falling back to database", "error", err)
		return s.TestCaseService.Search(ctx, keyword)
	}

	testCases := make([]dbsqlc.TestCase, 0, len(ids))
	for _, id := range ids {
		parsed, err := uuid.Parse(id)
		if err != nil {
			continue
		}
		tc, err := s.queries.GetTestCase(ctx, parsed)
		if err != nil {
			// The index may lag behind deletes, the database is the source of truth
			if !errors.Is(err, sql.ErrNoRows) {
				return nil, err
			}
			continue
		}
		testCases = append(testCases, tc)
	}
	return testCases, nil
}

func (s *searchableTestCaseService) Create(ctx context.Context, request *schema.CreateTestCaseRequest) (*dbsqlc.TestCase, error) {
	tc, err := s.TestCaseService.Create(ctx, request)
	if err == nil {
		s.index(ctx, *tc)
	}
	return tc, err
}

func (s *searchableTestCaseService) BulkCreate(ctx context.Context, request *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, int, error) {
	testCases, skipped, err := s.TestCaseService.BulkCreate(ctx, request)
	if err == nil {
		s.index(ctx, testCases...)
	}
	return testCases, skipped, err
}

func (s *searchableTestCaseService) Update(ctx context.Context, request *schema.UpdateTestCaseRequest) (*dbsqlc.TestCase, error) {
	tc, err := s.TestCaseService.Update(ctx, request)
	if err == nil {
		s.index(ctx, *tc)
	}
	return tc, err
}

func (s *searchableTestCaseService) Suggest(ctx context.Context, request *schema.CreateSuggestedTestCaseRequest) (*dbsqlc.TestCase, error) {
	tc, err := s.TestCaseService.Suggest(ctx, request)
	if err == nil {
		s.index(ctx, *tc)
	}
	return tc, err
}

func (s *searchableTestCaseService) Transfer(ctx context.Context, testCaseID string, request schema.TransferTestCaseRequest) (*dbsqlc.TestCase, error) {
	tc, err := s.TestCaseService.Transfer(ctx, testCaseID, request)
	if err == nil {
		s.index(ctx, *tc)
	}
	return tc, err
}

func (s *searchableTestCaseService) MarkAsDraft(ctx context.Context, testCaseID string) error {
	err := s.TestCaseService.MarkAsDraft(ctx, testCaseID)
	if err == nil {
		s.reindexByID(ctx, testCaseID)
	}
	return err
}

func (s *searchableTestCaseService) UnMarkAsDraft(ctx context.Context, testCaseID string) error {
	err := s.TestCaseService.UnMarkAsDraft(ctx, testCaseID)
	if err == nil {
		s.reindexByID(ctx, testCaseID)
	}
	return err
}

func (s *searchableTestCaseService) AcceptSuggested(ctx context.Context, testCaseID string) error {
	err := s.TestCaseService.AcceptSuggested(ctx, testCaseID)
	if err == nil {
		s.reindexByID(ctx, testCaseID)
	}
	return err
}

func (s *searchableTestCaseService) RejectSuggested(ctx context.Context, testCaseID string) error {
	err := s.TestCaseService.RejectSuggested(ctx, testCaseID)
	if err == nil {
		s.delete(ctx, testCaseID)
	}
	return err
}

func (s *searchableTestCaseService) DeleteByID(ctx context.Context, testCaseID string) error {
	err := s.TestCaseService.DeleteByID(ctx, testCaseID)
	if err == nil {
		s.delete(ctx, testCaseID)
	}
	return err
}

func (s *searchableTestCaseService) BulkDelete(ctx context.Context, testCaseIDs []string) error {
	err := s.TestCaseService.BulkDelete(ctx, testCaseIDs)
	if err == nil {
		s.delete(ctx, testCaseIDs...)
	}
	return err
}

func (s *searchableTestCaseService) reindexByID(ctx context.Context, testCaseID string) {
	id, err := uuid.Parse(testCaseID)
	if err != nil {
		return
	}
	tc, err := s.queries.GetTestCase(ctx, id)
	if err != nil {
		s.logger.Error(loggedmodule.Search, "failed to load test case for indexing", "testCaseID", testCaseID, "error", err)
		return
	}
	s.index(ctx, tc)
}

func (s *searchableTestCaseService) index(ctx context.Context, testCases ...dbsqlc.TestCase) {
	if len(testCases) == 0 {
		return
	}
	docs := make([]search.TestCaseDocument, 0, len(testCases))
	for i := range testCases {
		docs = append(docs, search.NewTestCaseDocument(&testCases[i]))
	}
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), indexTimeout)
	defer cancel()
	if err := s.engine.IndexTestCases(ctx, docs...); err != nil {
		s.logger.Error(loggedmodule.Search, "failed to index test cases", "count", len(docs), "error", err)
	}
}

func (s *searchableTestCaseService) delete(ctx context.Context, testCaseIDs ...string) {
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), indexTimeout)
	defer cancel()
	if err := s.engine.DeleteTestCases(ctx, testCaseIDs...); err != nil {
		s.logger.Error(loggedmodule.Search, "failed to remove test cases from index", "count", len(testCaseIDs), "error", err)
	}
}
