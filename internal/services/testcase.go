package services

import (
	"context"
	"database/sql"
	"errors"
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
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTestCaseService(conn *dbsqlc.Queries, logger logging.Logger) TestCaseService {
	return &testCaseServiceImpl{
		queries: conn,
		logger:  logger,
	}
}

// BulkCreate implements TestCaseService.
func (t *testCaseServiceImpl) BulkCreate(ctx context.Context, bulkRequest *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, error) {
	createList := make([]uuid.UUID, 0)
	for _, request := range bulkRequest.TestCases {
		uuidVal, _ := uuid.NewV7()
		params := dbsqlc.CreateTestCaseParams{
			ID:               uuidVal,
			ProjectID:        sql.NullInt32{Int32: int32(bulkRequest.ProjectID), Valid: true},
			Kind:             dbsqlc.TestKind(request.Kind),
			Code:             request.Code,
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

		createdID, err := t.queries.CreateTestCase(ctx, params)
		if err != nil {
			return nil, err
		}
		createList = append(createList, createdID)
	}

	return []dbsqlc.TestCase{}, nil
}

// BulkDelete implements TestCaseService.
func (t *testCaseServiceImpl) BulkDelete(context.Context, []string) error {
	panic("unimplemented")
}

// Create implements TestCaseService.
func (t *testCaseServiceImpl) Create(ctx context.Context, request *schema.CreateTestCaseRequest) (*dbsqlc.TestCase, error) {
	uuidVal, _ := uuid.NewV7()
	params := dbsqlc.CreateTestCaseParams{
		ID:               uuidVal,
		ProjectID:        sql.NullInt32{Int32: int32(request.ProjectID), Valid: true},
		Kind:             dbsqlc.TestKind(request.Kind),
		Code:             request.Code,
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

	createdID, err := t.queries.CreateTestCase(ctx, params)
	if err != nil {
		return nil, err
	}
	res, err := t.queries.GetTestCase(ctx, createdID)
	return &res, err
}

// DeleteByID implements TestCaseService.
func (t *testCaseServiceImpl) DeleteByID(ctx context.Context, id string) error {

	panic("unimplemented")
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

// FindAllCreatedBy implements TestCaseService.
func (t *testCaseServiceImpl) FindAllCreatedBy(ctx context.Context, createdByID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCasesByCreator(ctx, int32(createdByID))
}

// Update implements TestCaseService.
func (t *testCaseServiceImpl) Update(context.Context, *schema.UpdateTestCaseRequest) (*dbsqlc.TestCase, error) {
	panic("unimplemented")
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
