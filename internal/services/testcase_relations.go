package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrRelationToSelf  = errors.New("a test case cannot be related to itself")
	ErrRelationExists  = errors.New("these test cases already have a relation of this kind")
	ErrInvalidRelation = errors.New("invalid relation kind")
)

// Postgres error codes, see https://www.postgresql.org/docs/current/errcodes-appendix.html
const (
	pgForeignKeyViolation = "23503"
	pgUniqueViolation     = "23505"
	pgCheckViolation      = "23514"
)

type TestCaseRelationService interface {
	// Create relates testCaseID to the request's related test case, read as
	// "<testCaseID> <relation_kind> <related test case>"
	Create(ctx context.Context, testCaseID string, createdByID int64, req *schema.CreateTestCaseRelationRequest) (*schema.TestCaseRelationResponse, error)
	// FindAllByTestCase lists relations where the test case is on either side
	FindAllByTestCase(ctx context.Context, testCaseID string) ([]schema.TestCaseRelationResponse, error)
	// Delete removes a relation, as long as testCaseID is on one side of it
	Delete(ctx context.Context, testCaseID, relationID string) error
}

func NewTestCaseRelationService(queries *dbsqlc.Queries, logger logging.Logger) TestCaseRelationService {
	return &testCaseRelationServiceImpl{
		queries: queries,
		logger:  logger,
	}
}

type testCaseRelationServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func (s *testCaseRelationServiceImpl) Create(ctx context.Context, testCaseID string, createdByID int64, req *schema.CreateTestCaseRelationRequest) (*schema.TestCaseRelationResponse, error) {
	sourceID, err := uuid.Parse(testCaseID)
	if err != nil {
		return nil, ErrNotFound
	}
	relatedID, err := uuid.Parse(req.RelatedTestCaseID)
	if err != nil {
		return nil, ErrNotFound
	}
	if sourceID == relatedID {
		return nil, ErrRelationToSelf
	}

	id, _ := uuid.NewV7()
	relationID, err := s.queries.CreateTestCaseRelation(ctx, dbsqlc.CreateTestCaseRelationParams{
		ID:                id,
		TestCaseID:        sourceID,
		RelatedTestCaseID: relatedID,
		RelationKind:      req.RelationKind,
		CreatedByID:       int32(createdByID),
	})
	if err != nil {
		return nil, mapRelationError(err)
	}

	relations, err := s.FindAllByTestCase(ctx, testCaseID)
	if err != nil {
		return nil, err
	}
	for _, r := range relations {
		if r.ID == relationID.String() {
			return &r, nil
		}
	}
	return nil, fmt.Errorf("relation %s not found after insert", relationID)
}

func (s *testCaseRelationServiceImpl) FindAllByTestCase(ctx context.Context, testCaseID string) ([]schema.TestCaseRelationResponse, error) {
	id, err := uuid.Parse(testCaseID)
	if err != nil {
		return nil, ErrNotFound
	}
	if _, err := s.queries.GetTestCase(ctx, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to load test case: %w", err)
	}

	rows, err := s.queries.ListTestCaseRelations(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to list test case relations: %w", err)
	}

	res := make([]schema.TestCaseRelationResponse, 0, len(rows))
	for _, row := range rows {
		direction := schema.RelationDirectionIncoming
		if row.IsOutgoing {
			direction = schema.RelationDirectionOutgoing
		}
		res = append(res, schema.TestCaseRelationResponse{
			ID:                row.ID.String(),
			TestCaseID:        row.TestCaseID.String(),
			RelatedTestCaseID: row.RelatedTestCaseID.String(),
			RelationKind:      row.RelationKind,
			Direction:         direction,
			OtherTestCase: schema.RelatedTestCaseSummary{
				ID:        row.OtherID.String(),
				Code:      row.OtherCode,
				Title:     row.OtherTitle,
				ProjectID: int64(row.OtherProjectID.Int32),
			},
			CreatedByID: row.CreatedByID,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		})
	}
	return res, nil
}

func (s *testCaseRelationServiceImpl) Delete(ctx context.Context, testCaseID, relationID string) error {
	tcID, err := uuid.Parse(testCaseID)
	if err != nil {
		return ErrNotFound
	}
	relID, err := uuid.Parse(relationID)
	if err != nil {
		return ErrNotFound
	}

	affected, err := s.queries.DeleteTestCaseRelation(ctx, dbsqlc.DeleteTestCaseRelationParams{
		ID:         relID,
		TestCaseID: tcID,
	})
	if err != nil {
		return fmt.Errorf("failed to delete test case relation: %w", err)
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

// mapRelationError turns constraint violations from test_case_relations into service errors
func mapRelationError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return fmt.Errorf("failed to create test case relation: %w", err)
	}
	switch pgErr.Code {
	case pgUniqueViolation:
		return ErrRelationExists
	case pgForeignKeyViolation:
		// one of the test cases (or the creating user) does not exist
		return ErrNotFound
	case pgCheckViolation:
		if pgErr.ConstraintName == "test_case_relations_not_self" {
			return ErrRelationToSelf
		}
		return ErrInvalidRelation
	}
	return fmt.Errorf("failed to create test case relation: %w", err)
}
