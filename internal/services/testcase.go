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
	FindAllByTestPlanID(context.Context, int64) ([]schema.TestCaseResponseItem, error)

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
	// FindAllAssignedTo is used to fetch only the testcases that are assigned to a logged in user
	FindAllAssignedToUser(ctx context.Context, userID int64, limit, offset int32) ([]schema.AssignedTestCase, error)
	// MarkAsDraft is used to mark a test case as draft
	MarkAsDraft(ctx context.Context, testCaseID string) error
	// UnMarkAsDraft is used to unmark a draft test case
	UnMarkAsDraft(ctx context.Context, testCaseID string) error
	// GetExecutionSummaryByUser used to dynamically update the counts for 'success', 'failed, and 'test executed'
	GetExecutionSummaryByUser(ctx context.Context, userID int64) ([]schema.TestCaseExecutionSummary, error)
	// FindAllClosed used to list closed test cases by project ID
	FindAllClosed(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error)
	// FindAllFailing used to list failing test cases by project ID
	FindAllFailing(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error)
	// FindAllScheduled used to list scheduled test cases by project ID
	FindAllScheduled(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error)
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
		request.ProjectID = bulkRequest.ProjectID
		project, err := t.queries.GetProject(ctx, int32(request.ProjectID))
		if err != nil {
			return nil, fmt.Errorf("failed to fetch project: %w", err)
		}

		// Ensure sequence row exists for this project's item
		prefixKey := strings.ToLower(project.Code)
		if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
			ProjectID: int32(request.ProjectID),
			Prefix:    prefixKey,
		}); err != nil {
			return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
		}

		code, err := GenerateNextCode(ctx, tx, request.ProjectID, &project, &request.Code)
		if err != nil {
			return nil, err
		}

		uuidVal, _ := uuid.NewV7()
		params := dbsqlc.CreateTestCaseParams{
			ID:               uuidVal,
			ProjectID:        common.NewNullInt32(int32(request.ProjectID)),
			Kind:             dbsqlc.TestKind(request.Kind),
			Code:             code,
			FeatureOrModule:  common.NullString(request.FeatureOrModule),
			Title:            request.Title,
			Description:      request.Description,
			ParentTestCaseID: sql.NullInt32{},
			IsDraft:          common.NewNullBool(request.IsDraft),
			Tags:             request.Tags,
			CreatedByID:      1,
			CreatedAt:        common.NewNullTime(time.Now()),
			UpdatedAt:        common.NewNullTime(time.Now()),
		}

		if strings.TrimSpace(request.Code) != "" {
			_, err := tx.GetTestCaseByCode(ctx, dbsqlc.GetTestCaseByCodeParams{
				ProjectID: common.NewNullInt32(int32(request.ProjectID)),
				Code:      request.Code,
			})
			if err == nil {
				return nil, fmt.Errorf("test case code %q already exists in project %d — please choose a different code or leave it blank to auto-generate", request.Code, request.ProjectID)
			}
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

	project, err := t.queries.GetProject(ctx, int32(request.ProjectID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}

	// Ensure sequence row exists for this project inside the same transaction
	prefixKey := strings.ToLower(project.Code)
	if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
		ProjectID: int32(request.ProjectID),
		Prefix:    prefixKey,
	}); err != nil {
		return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
	}

	code, err := GenerateNextCode(ctx, tx, request.ProjectID, &project, &request.Code)
	if err != nil {
		return nil, err
	}
	uuidVal, _ := uuid.NewV7()
	params := dbsqlc.CreateTestCaseParams{
		ID:               uuidVal,
		ProjectID:        common.NewNullInt32(int32(request.ProjectID)),
		Kind:             dbsqlc.TestKind(request.Kind),
		Code:             code,
		FeatureOrModule:  common.NullString(request.FeatureOrModule),
		Title:            request.Title,
		Description:      request.Description,
		ParentTestCaseID: sql.NullInt32{},
		IsDraft:          common.NewNullBool(request.IsDraft),
		Tags:             request.Tags,
		CreatedByID:      1,
		CreatedAt:        common.NewNullTime(time.Now()),
		UpdatedAt:        common.NewNullTime(time.Now()),
	}

	if strings.TrimSpace(request.Code) != "" {
		_, err := tx.GetTestCaseByCode(ctx, dbsqlc.GetTestCaseByCodeParams{
			ProjectID: common.NewNullInt32(int32(request.ProjectID)),
			Code:      request.Code,
		})
		if err == nil {
			return nil, fmt.Errorf("test case code %q already exists in project %d — please choose a different code or leave it blank to auto-generate", request.Code, request.ProjectID)
		}
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
func (t *testCaseServiceImpl) FindAllByTestPlanID(ctx context.Context, testPlanID int64) ([]schema.TestCaseResponseItem, error) {
	rows, err := t.queries.GetTestCasesWithPlanInfo(ctx, int32(testPlanID))
	if err != nil {
		return nil, err
	}

	cases := make([]schema.TestCaseResponseItem, 0, len(rows))
	for _, r := range rows {
		assigned := r.PlanID.Valid
		var planSummary *schema.TestPlanSummary
		if assigned {
			planSummary = &schema.TestPlanSummary{
				ID:   r.PlanID.Int64,
				Name: r.PlanName.String,
			}
		}
		cases = append(cases, schema.TestCaseResponseItem{
			ID:                   r.TestCaseID.String(),
			Title:                r.Title,
			IsAssignedToTestPlan: assigned,
			TestPlan:             planSummary,
			AssignedTesterIDs:    r.TesterIds,
		})
	}
	return cases, nil
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

func GenerateNextCode(ctx context.Context, db *dbsqlc.Queries, projectID int64, project *dbsqlc.Project, userCode *string) (string, error) {
	if userCode != nil && *userCode != "" {
		return *userCode, nil
	}

	prefixKey := strings.ToLower(project.Code)

	seq, err := db.GetNextTestCaseSequence(ctx, dbsqlc.GetNextTestCaseSequenceParams{
		ProjectID: int32(projectID),
		Prefix:    prefixKey,
	})
	if err != nil {
		return "", fmt.Errorf("failed to get next sequence: %w", err)
	}

	displayPrefix := strings.ToUpper(prefixKey) // used for code formatting
	return fmt.Sprintf("%s%03d", displayPrefix, seq), nil
}

func (t *testCaseServiceImpl) FindAllAssignedToUser(ctx context.Context, userID int64, limit, offset int32) ([]schema.AssignedTestCase, error) {
	rows, err := t.queries.ListTestCasesByAssignedUser(ctx, dbsqlc.ListTestCasesByAssignedUserParams{
		AssignedToID: int32(userID),
		Limit:        limit,
		Offset:       offset,
	})

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []schema.AssignedTestCase{}, nil
		}
		return nil, fmt.Errorf("failed to load assigned test cases: %v", err)
	}

	res := make([]schema.AssignedTestCase, 0)
	for _, row := range rows {
		res = append(res, schema.AssignedTestCase{
			ID:                    row.TestCaseID.String(),
			Kind:                  row.Kind,
			Code:                  row.Code,
			FeatureOrModule:       row.FeatureOrModule.String,
			Title:                 row.Title,
			Description:           row.Description,
			ParentTestCaseID:      int(row.ParentTestCaseID.Int32),
			IsDraft:               row.IsDraft.Bool,
			Tags:                  row.Tags,
			CreatedByID:           row.CreatedByID,
			TestCaseCreatedAt:     row.TestCaseCreatedAt.Time,
			TestCaseUpdatedAt:     row.TestCaseUpdatedAt.Time,
			ProjectID:             int64(row.ProjectID.Int32),
			TestRunID:             row.TestRunID.String(),
			TestPlanID:            row.TestPlanID,
			TestCaseID:            row.TestCaseID.String(),
			OwnerID:               row.OwnerID,
			TestedByID:            row.TestedByID,
			AssignedToID:          row.AssignedToID,
			AssigneeCanChangeCode: row.AssigneeCanChangeCode.Bool,
			ExternalIssueID:       row.ExternalIssueID.String,
			ResultState:           row.ResultState,
			IsClosed:              row.IsClosed.Bool,
			Notes:                 row.Notes,
			ActualResult:          row.ActualResult.String,
			ExpectedResult:        row.ExpectedResult.String,
			Reactions:             row.Reactions.RawMessage,
			TestedOn:              &row.TestedOn,
			CreatedAt:             row.RunCreatedAt.Time,
			UpdatedAt:             row.RunUpdatedAt.Time,
		})
	}
	return res, nil
}

func (t *testCaseServiceImpl) MarkAsDraft(ctx context.Context, testCaseID string) error {
	params := dbsqlc.SetTestCaseDraftStatusParams{
		ID:      uuid.MustParse(testCaseID),
		IsDraft: common.TrueNullBool(),
	}

	err := t.queries.SetTestCaseDraftStatus(ctx, params)
	if err != nil {
		t.logger.Error("failed to update draft status", "error", err)
		return err
	}

	return nil
}

func (t *testCaseServiceImpl) UnMarkAsDraft(ctx context.Context, testCaseID string) error {
	params := dbsqlc.SetTestCaseDraftStatusParams{
		ID:      uuid.MustParse(testCaseID),
		IsDraft: common.FalseNullBool(),
	}

	err := t.queries.SetTestCaseDraftStatus(ctx, params)
	if err != nil {
		t.logger.Error("failed to update draft status", "error", err)
		return err
	}

	return nil
}

func (t *testCaseServiceImpl) GetExecutionSummaryByUser(ctx context.Context, userID int64) ([]schema.TestCaseExecutionSummary, error) {
	rows, err := t.queries.GetTestCaseExecutionSummary(ctx, int32(userID))
	if err != nil {
		return nil, err
	}

	summaries := make([]schema.TestCaseExecutionSummary, 0, len(rows))
	for _, r := range rows {
		summaries = append(summaries, schema.TestCaseExecutionSummary{
			TestCaseID:   r.TestCaseID.String(),
			UsageCount:   int(r.UsageCount),
			SuccessCount: int(r.SuccessCount),
			FailureCount: int(r.FailureCount),
		})
	}
	return summaries, nil
}

func (s *testCaseServiceImpl) FindAllClosed(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	rows, err := s.queries.FindClosedCasesByProjectID(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, schema.TestCaseResponse{
			ID:              row.ID.String(),
			ProjectID:       int64(row.ProjectID.Int32),
			CreatedByID:     int64(row.CreatedByID),
			Kind:            string(row.Kind),
			Code:            row.Code,
			FeatureOrModule: row.FeatureOrModule.String,
			Title:           row.Title,
			Description:     row.Description,
			IsDraft:         row.IsDraft.Bool,
			Tags:            row.Tags,
			CreatedAt:       common.FormatNullTime(row.CreatedAt),
			UpdatedAt:       common.FormatNullTime(row.UpdatedAt),
			Status:          row.Status,
			Result:          string(row.ResultState),
			ExecutedBy:      int64(row.TestedByID),
			Notes:           row.Notes,
		})
	}

	return responses, nil
}

func (s *testCaseServiceImpl) FindAllFailing(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	rows, err := s.queries.FindFailingCasesByProjectID(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, schema.TestCaseResponse{
			ID:              row.ID.String(),
			ProjectID:       int64(row.ProjectID.Int32),
			CreatedByID:     int64(row.CreatedByID),
			Kind:            string(row.Kind),
			Code:            row.Code,
			FeatureOrModule: row.FeatureOrModule.String,
			Title:           row.Title,
			Description:     row.Description,
			IsDraft:         row.IsDraft.Bool,
			Tags:            row.Tags,
			CreatedAt:       common.FormatNullTime(row.CreatedAt),
			UpdatedAt:       common.FormatNullTime(row.UpdatedAt),
			Status:          row.Status,
			Result:          string(row.ResultState),
			ExecutedBy:      int64(row.TestedByID),
			Notes:           row.Notes,
		})
	}
	return responses, nil

}

func (s *testCaseServiceImpl) FindAllScheduled(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	rows, err := s.queries.FindScheduledCasesByProjectID(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, schema.TestCaseResponse{
			ID:              row.ID.String(),
			ProjectID:       int64(row.ProjectID.Int32),
			CreatedByID:     int64(row.CreatedByID),
			Kind:            string(row.Kind),
			Code:            row.Code,
			FeatureOrModule: row.FeatureOrModule.String,
			Title:           row.Title,
			Description:     row.Description,
			IsDraft:         row.IsDraft.Bool,
			Tags:            row.Tags,
			CreatedAt:       common.FormatNullTime(row.CreatedAt),
			UpdatedAt:       common.FormatNullTime(row.UpdatedAt),
			Status:          row.Status,
			Result:          string(row.ResultState),
			ExecutedBy:      int64(row.TestedByID),
			Notes:           row.Notes,
		})
	}
	return responses, nil
}
