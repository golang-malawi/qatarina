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

// TestCaseService contains functionality to manage services
type TestCaseService interface {
	// FindAll retrieves all test cases in the database
	FindAll(context.Context) ([]dbsqlc.TestCase, error)

	// FindAllByID retrieves all test cases in the database by Project ID
	FindByID(context.Context, string) (*dbsqlc.TestCase, error)

	// FindAllByProjectID retrieves all test cases in the database by Project ID
	FindAllByProjectID(context.Context, int64) ([]dbsqlc.TestCase, error)

	// FindAllByTestPlanID retrieves all test cases in the database by Test Plan ID
	FindAllByTestPlanID(context.Context, uuid.UUID) ([]dbsqlc.TestCase, error)

	// FindAllCreatedBy retrieves all test cases in the database created by a specific user
	FindAllCreatedBy(context.Context, int64) ([]dbsqlc.TestCase, error)

	// Create creates a new test case
	Create(context.Context, *schema.CreateTestCaseRequest) (*dbsqlc.TestCase, error)

	// BulkCreate creates test cases in bulk. Only valid test cases are created.
	BulkCreate(context.Context, *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, error)

	// Update updates a test case in the system
	Update(context.Context, *schema.UpdateTestCaseRequest) (*dbsqlc.TestCase, error)

	// DeleteByID deletes a single test case by ID
	DeleteByID(context.Context, string) error

	// DeleteByID deletes all test cases linked to the given ProjectID
	DeleteByProjectID(context.Context, string) error

	// DeleteByTestRunID delets all test cases linked to the given TestRun
	DeleteByTestRunID(context.Context, string) error

	// BulkDelete deletes multiple test-cases by ID
	BulkDelete(context.Context, []string) error

	//Search is used to search a test case based on the title or code
	Search(context.Context, string) ([]dbsqlc.TestCase, error)
}

var _ TestCaseService = &testCaseServiceImpl{}

type testCaseServiceImpl struct {
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTestCaseService(db *sql.DB, conn *dbsqlc.Queries, logger logging.Logger) TestCaseService {
	return &testCaseServiceImpl{
		db:      db,
		queries: conn,
		logger:  logger,
	}
}

// BulkCreate implements TestCaseService.
func (t *testCaseServiceImpl) BulkCreate(ctx context.Context, bulkRequest *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, error) {
	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer sqlTx.Rollback()

	tx := dbsqlc.New(sqlTx)

	testCases := make([]dbsqlc.TestCase, 0, len(bulkRequest.TestCases))
	for _, request := range bulkRequest.TestCases {
		uuidVal, _ := uuid.NewV7()

		// Ensure sequence row exists for this project's item
		prefixKey := strings.ToLower(strings.TrimSpace(request.FeatureOrModule))
		if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
			ProjectID: int32(request.ProjectID),
			Prefix:    prefixKey,
		}); err != nil {
			return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
		}

		code, err := GenerateNextCode(ctx, tx, request.ProjectID, request.FeatureOrModule, &request.Code)
		if err != nil {
			return nil, err
		}

		params := dbsqlc.CreateTestCaseParams{
			ID:               uuidVal,
			ProjectID:        sql.NullInt32{Int32: int32(request.ProjectID), Valid: true},
			Kind:             dbsqlc.TestKind(request.Kind),
			Code:             code,
			FeatureOrModule:  sql.NullString{String: request.FeatureOrModule, Valid: true},
			Title:            request.Title,
			Description:      request.Description,
			ParentTestCaseID: sql.NullInt32{},
			IsDraft:          sql.NullBool{Bool: request.IsDraft, Valid: true},
			Tags:             request.Tags,
			CreatedByID:      1,
			CreatedAt:        sql.NullTime{Time: time.Now(), Valid: true},
			UpdatedAt:        sql.NullTime{Time: time.Now(), Valid: true},
		}

		createdID, err := tx.CreateTestCase(ctx, params)
		if err != nil {
			return nil, err
		}
		tc, err := tx.GetTestCase(ctx, createdID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch test case %q after insert: %w", code, err)
		}

		testCases = append(testCases, tc)
	}

	if err := sqlTx.Commit(); err != nil {
		return nil, err
	}

	return testCases, nil
}

// BulkDelete implements TestCaseService.
func (t *testCaseServiceImpl) BulkDelete(context.Context, []string) error {
	panic("unimplemented")
}

// Create implements TestCaseService.
func (t *testCaseServiceImpl) Create(ctx context.Context, request *schema.CreateTestCaseRequest) (*dbsqlc.TestCase, error) {
	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer sqlTx.Rollback()

	tx := dbsqlc.New(sqlTx)

	// Ensure sequence row exists for this project inside the same transaction
	prefixKey := strings.ToLower(strings.TrimSpace(request.FeatureOrModule))
	if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
		ProjectID: int32(request.ProjectID),
		Prefix:    prefixKey,
	}); err != nil {
		return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
	}

	code, err := GenerateNextCode(ctx, tx, request.ProjectID, request.FeatureOrModule, &request.Code)
	if err != nil {
		return nil, err
	}
	uuidVal, _ := uuid.NewV7()
	params := dbsqlc.CreateTestCaseParams{
		ID:               uuidVal,
		ProjectID:        sql.NullInt32{Int32: int32(request.ProjectID), Valid: true},
		Kind:             dbsqlc.TestKind(request.Kind),
		Code:             code,
		FeatureOrModule:  sql.NullString{String: request.FeatureOrModule, Valid: true},
		Title:            request.Title,
		Description:      request.Description,
		ParentTestCaseID: sql.NullInt32{},
		IsDraft:          sql.NullBool{Bool: request.IsDraft, Valid: true},
		Tags:             request.Tags,
		CreatedByID:      1,
		CreatedAt:        sql.NullTime{Time: time.Now(), Valid: true},
		UpdatedAt:        sql.NullTime{Time: time.Now(), Valid: true},
	}

	createdID, err := tx.CreateTestCase(ctx, params)
	if err != nil {
		return nil, err
	}

	tc, err := tx.GetTestCase(ctx, createdID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test case %q after insert: %w", code, err)
	}

	if err := sqlTx.Commit(); err != nil {
		return nil, err
	}

	return &tc, err
}

// DeleteByID implements TestCaseService.
func (t *testCaseServiceImpl) DeleteByID(ctx context.Context, id string) error {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	_, err = t.queries.DeleteTestCase(ctx, uuidID)
	if err != nil {
		return err
	}

	return nil
}

// DeleteByProjectID implements TestCaseService.
func (t *testCaseServiceImpl) DeleteByProjectID(context.Context, string) error {
	panic("unimplemented")
}

// DeleteByTestRunID implements TestCaseService.
func (t *testCaseServiceImpl) DeleteByTestRunID(context.Context, string) error {
	panic("unimplemented")
}

// FindAll implements TestCaseService.
func (t *testCaseServiceImpl) FindAll(ctx context.Context) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCases(ctx)
}

// FindAllByID implements TestCaseService.
func (t *testCaseServiceImpl) FindByID(ctx context.Context, id string) (*dbsqlc.TestCase, error) {
	tc, err := t.queries.GetTestCase(ctx, uuid.MustParse(id))
	return &tc, err
}

// FindAllByProjectID implements TestCaseService.
func (t *testCaseServiceImpl) FindAllByProjectID(ctx context.Context, projectID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCasesByProject(ctx, sql.NullInt32{Int32: int32(projectID), Valid: true})
}

// FindAllByProjectID implements TestCaseService.
func (t *testCaseServiceImpl) FindAllByTestPlanID(ctx context.Context, testPlanID uuid.UUID) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCasesByPlan(ctx, testPlanID)
}

// FindAllCreatedBy implements TestCaseService.
func (t *testCaseServiceImpl) FindAllCreatedBy(ctx context.Context, createdByID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCasesByCreator(ctx, int32(createdByID))
}

// Update implements TestCaseService.
func (t *testCaseServiceImpl) Update(ctx context.Context, req *schema.UpdateTestCaseRequest) (*dbsqlc.TestCase, error) {
	id, err := uuid.Parse(req.ID)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	params := dbsqlc.UpdateTestCaseParams{
		ID:              id,
		Title:           req.Title,
		Kind:            dbsqlc.TestKind(req.Kind),
		Code:            req.Code,
		Description:     req.Description,
		FeatureOrModule: common.NullString(req.FeatureOrModule),
		IsDraft:         common.NewNullBool(req.IsDraft),
		Tags:            req.Tags,
		UpdatedAt:       common.NullTime(time.Now()),
	}

	if err := t.queries.UpdateTestCase(ctx, params); err != nil {
		return nil, err
	}

	tc, err := t.queries.GetTestCase(ctx, id)
	if err != nil {
		return nil, err
	}
	return &tc, nil
}

func (t *testCaseServiceImpl) Search(ctx context.Context, keyword string) ([]dbsqlc.TestCase, error) {
	testCases, err := t.queries.SearchTestCases(ctx, common.NullString(keyword))
	if err != nil {
		t.logger.Error("failed to search test cases with keyword %q", keyword, err)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
	}

	return testCases, nil

}

func GenerateNextCode(ctx context.Context, db *dbsqlc.Queries, projectID int64, module string, userCode *string) (string, error) {
	if userCode != nil && *userCode != "" {
		return *userCode, nil
	}

	prefixKey := strings.ToLower(strings.TrimSpace(module)) // used for sequence lookup
	seq, err := db.GetNextTestCaseSequence(ctx, dbsqlc.GetNextTestCaseSequenceParams{
		ProjectID: int32(projectID),
		Prefix:    prefixKey,
	})
	if err != nil {
		return "", fmt.Errorf("failed to get next sequence: %w", err)
	}

	displayPrefix := generatePrefix(module) // used for code formatting
	return fmt.Sprintf("%s%03d", displayPrefix, seq), nil
}

func generatePrefix(module string) string {
	module = strings.TrimSpace(strings.ToLower(module))
	words := strings.Fields(module)

	if len(words) >= 2 {
		return strings.ToUpper(string(words[0][0]) + string(words[1][0]))
	}

	if len(module) >= 2 {
		return strings.ToUpper(module[:2])
	}

	return strings.ToUpper(module)
}
