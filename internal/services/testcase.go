package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"
)

// TestCaseService contains functionality to manage services
type TestCaseService interface {
	// FindAll retrieves all test cases in the database
	FindAll(context.Context) ([]dbsqlc.TestCase, error)
	// FindAllPaged retrieves test cases with pagination, sorting, and filtering
	FindAllPaged(context.Context, TestCaseQueryParams) ([]dbsqlc.TestCase, int64, error)

	// FindAllByID retrieves all test cases in the database by test case ID
	FindByID(context.Context, string) (*dbsqlc.GetTestCaseWithParentRow, error)

	// FindAllByProjectID retrieves all test cases in the database by Project ID
	FindAllByProjectID(context.Context, int64) ([]dbsqlc.TestCase, error)
	// FindAllByProjectIDPaged retrieves test cases by Project ID with pagination, sorting, and filtering
	FindAllByProjectIDPaged(context.Context, int64, TestCaseQueryParams) ([]dbsqlc.TestCase, int64, error)

	// FindAllByTestPlanID retrieves all test cases in the database by Test Plan ID
	FindAllByTestPlanID(context.Context, int64) ([]schema.TestCaseResponseItem, error)

	// FindAllCreatedBy retrieves all test cases in the database created by a specific user
	FindAllCreatedBy(context.Context, int64) ([]dbsqlc.TestCase, error)

	// Create creates a new test case
	Create(context.Context, *schema.CreateTestCaseRequest) (*dbsqlc.TestCase, error)

	// BulkCreate creates test cases in bulk. Only valid test cases are created.
	BulkCreate(context.Context, *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, int, error)

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
	// FindAllAssignedToUser fetches test cases assigned to a logged in user (via test_plan_cases), with option to include/exclude closed runs
	FindAllAssignedToUser(ctx context.Context, params *schema.InboxFilterParams) ([]schema.AssignedTestCase, int64, error)
	// FindAssignedToUserByID fetches a single test case from the user's inbox, regardless of which page it is on
	FindAssignedToUserByID(ctx context.Context, userID int64, testCaseID string) (*schema.AssignedTestCase, error)
	// CountUnseenAssignedToUser counts open test cases in the user's inbox that they have not viewed yet
	CountUnseenAssignedToUser(ctx context.Context, userID int64) (int64, error)
	// MarkAssignedAsViewed marks a test case in the user's inbox as viewed
	MarkAssignedAsViewed(ctx context.Context, userID int64, testCaseID string) error
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
	// FindAllBlocked is used to list bloked test cases by project ID
	FindAllBlocked(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error)
	// GetExistingCodes is used to check existing test cases codes during file import
	GetExistingCodes(ctx context.Context, projectID int64) (map[string]bool, error)
	// Suggest is used to make a tester suggest a test case
	Suggest(ctx context.Context, req *schema.CreateSuggestedTestCaseRequest) (*dbsqlc.TestCase, error)
	// FindAllSuggested is used to list all suggested test cases
	FindAllSuggested(ctx context.Context, projectID int64) ([]dbsqlc.TestCase, error)
	// AcceptSuggested is used to accept a suggested test case
	AcceptSuggested(ctx context.Context, testCaseID string) error
	// RejectSuggested is used to reject a suggested test case
	RejectSuggested(ctx context.Context, testCaseID string) error

	// FindScriptCasesByPlanID is used to list all script test cases assigned to a test plan
	FindScriptCasesByPlanID(ctx context.Context, testPlanID int64) ([]dbsqlc.TestCase, error)

	Transfer(ctx context.Context, testCaseID string, req schema.TransferTestCaseRequest) (*dbsqlc.TestCase, error)

	// FindBySelection lists the test cases picked in a project's test case list
	FindBySelection(ctx context.Context, selection schema.TestCaseSelection) ([]dbsqlc.TestCase, error)
	// DeleteBySelection deletes the test cases picked in a project's test case list
	DeleteBySelection(ctx context.Context, selection schema.TestCaseSelection) (int64, error)
	// TransferBySelection moves the test cases picked in a project's test case list to another project
	TransferBySelection(ctx context.Context, req schema.BulkTransferTestCasesRequest) (int64, error)

	// GetSummary is used to get the summary of test cases in a project
	GetSummary(ctx context.Context, projectID int64) (*schema.ProjectTestCaseSummaryResponse, error)

	// FindUntested lists a project's test cases that have no recorded result yet.
	// A non-zero testPlanID narrows it to the plan's test cases and results.
	FindUntested(ctx context.Context, projectID, testPlanID int64) ([]dbsqlc.TestCase, error)
	// FindLatestFailed lists a project's test cases whose most recent result is a failure.
	// A non-zero testPlanID only counts results recorded in that plan.
	FindLatestFailed(ctx context.Context, projectID, testPlanID int64) ([]schema.FailedTestCase, error)
}

type TestCaseQueryParams struct {
	Page      int
	PageSize  int
	SortBy    string
	SortOrder string
	Search    string
	Kind      string
	IsDraft   *bool
	Suggested *bool
	Module    string
	Priority  string
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
func (t *testCaseServiceImpl) BulkCreate(ctx context.Context, bulkRequest *schema.BulkCreateTestCases) ([]dbsqlc.TestCase, int, error) {
	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, 0, err
	}
	defer sqlTx.Rollback()

	tx := dbsqlc.New(sqlTx)

	testCases := make([]dbsqlc.TestCase, 0, len(bulkRequest.TestCases))
	skipped := 0

	for _, request := range bulkRequest.TestCases {
		request.ProjectID = bulkRequest.ProjectID
		project, err := t.queries.GetProject(ctx, int32(request.ProjectID))
		if err != nil {
			return nil, skipped, fmt.Errorf("failed to fetch project: %w", err)
		}

		// Ensure sequence row exists for this project's item
		prefixKey := strings.ToLower(project.Code)
		if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
			ProjectID: int32(request.ProjectID),
			Prefix:    prefixKey,
		}); err != nil {
			return nil, skipped, fmt.Errorf("failed to ensure sequence row: %w", err)
		}

		code, err := GenerateNextCode(ctx, tx, request.ProjectID, &project, &request.Code)
		if err != nil {
			return nil, skipped, err
		}

		userID, _ := strconv.Atoi(request.CreatedByID)
		uuidVal, _ := uuid.NewV7()
		params := dbsqlc.CreateTestCaseParams{
			ID:               uuidVal,
			ProjectID:        common.NewNullInt32(int32(request.ProjectID)),
			Kind:             dbsqlc.TestKind(request.Kind),
			Code:             code,
			FeatureOrModule:  common.NullString(request.FeatureOrModule),
			Title:            request.Title,
			Description:      request.Description,
			Preconditions:    common.NullString(request.Preconditions),
			ExternalID:       common.NullString(request.ExternalID),
			ParentTestCaseID: common.NewNullUUID(request.ParentTestCaseID),
			IsDraft:          common.NewNullBool(request.IsDraft),
			Tags:             request.Tags,
			CreatedByID:      int32(userID),
			CreatedAt:        common.NewNullTime(time.Now()),
			UpdatedAt:        common.NewNullTime(time.Now()),
			Runner:           common.NullString(request.Runner),
			ScriptPath:       common.NullString(request.ScriptPath),
			Priority:         schema.ParsePriorityLevel(request.Priority),
		}

		if strings.TrimSpace(request.Code) != "" {
			_, err := tx.GetTestCaseByCode(ctx, dbsqlc.GetTestCaseByCodeParams{
				ProjectID: common.NewNullInt32(int32(request.ProjectID)),
				Code:      request.Code,
			})
			if err == nil {
				skipped++
				continue
			}
		}

		createdID, err := tx.CreateTestCase(ctx, params)
		if err != nil {
			return nil, skipped, err
		}
		tc, err := tx.GetTestCase(ctx, createdID)
		if err != nil {
			return nil, skipped, fmt.Errorf("failed to fetch test case %q after insert: %w", code, err)
		}

		testCases = append(testCases, tc)
	}

	if err := sqlTx.Commit(); err != nil {
		return nil, skipped, err
	}

	return testCases, skipped, nil
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
	userID, _ := strconv.Atoi(request.CreatedByID)
	uuidVal, _ := uuid.NewV7()
	params := dbsqlc.CreateTestCaseParams{
		ID:               uuidVal,
		ProjectID:        common.NewNullInt32(int32(request.ProjectID)),
		Kind:             dbsqlc.TestKind(request.Kind),
		Code:             code,
		FeatureOrModule:  common.NullString(request.FeatureOrModule),
		Title:            request.Title,
		Description:      request.Description,
		Preconditions:    common.NullString(request.Preconditions),
		ExternalID:       common.NullString(request.ExternalID),
		ParentTestCaseID: common.NewNullUUID(request.ParentTestCaseID),
		IsDraft:          common.NewNullBool(request.IsDraft),
		Tags:             request.Tags,
		CreatedByID:      int32(userID),
		CreatedAt:        common.NewNullTime(time.Now()),
		UpdatedAt:        common.NewNullTime(time.Now()),
		Runner:           common.NullString(request.Runner),
		ScriptPath:       common.NullString(request.ScriptPath),
		Priority:         schema.ParsePriorityLevel(request.Priority),
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

// FindAllPaged implements TestCaseService.
func (t *testCaseServiceImpl) FindAllPaged(ctx context.Context, params TestCaseQueryParams) ([]dbsqlc.TestCase, int64, error) {
	page := params.Page
	pageSize := params.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	sortKey := strings.ToLower(strings.TrimSpace(params.SortBy))
	sortMap := map[string]string{
		"created_at": "created_at",
		"createdat":  "created_at",
		"updated_at": "updated_at",
		"updatedat":  "updated_at",
		"code":       "code",
		"title":      "title",
		"kind":       "kind",
		"is_draft":   "is_draft",
		"isdraft":    "is_draft",
		"priority":   "priority",
	}
	sortColumn, ok := sortMap[sortKey]
	if !ok || sortColumn == "" {
		sortColumn = "created_at"
	}
	sortOrder := strings.ToLower(strings.TrimSpace(params.SortOrder))
	if sortOrder != "asc" {
		sortOrder = "desc"
	}

	conditions := []string{"1=1"}
	args := []interface{}{}
	argPos := 1

	search := strings.TrimSpace(params.Search)
	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(code ILIKE $%d OR title ILIKE $%d OR description ILIKE $%d OR feature_or_module ILIKE $%d)", argPos, argPos, argPos, argPos))
		args = append(args, "%"+search+"%")
		argPos++
	}

	if params.Kind != "" {
		conditions = append(conditions, fmt.Sprintf("kind = $%d", argPos))
		args = append(args, params.Kind)
		argPos++
	}

	if params.Priority != "" {
		conditions = append(conditions, fmt.Sprintf("priority = $%d", argPos))
		args = append(args, params.Priority)
		argPos++
	}

	if params.IsDraft != nil {
		conditions = append(conditions, fmt.Sprintf("is_draft = $%d", argPos))
		args = append(args, *params.IsDraft)
		argPos++
	}

	if params.Suggested != nil {
		conditions = append(conditions, fmt.Sprintf("suggested = $%d", argPos))
		args = append(args, *params.Suggested)
		argPos++
	} else {
		// Default: exclude suggested cases
		conditions = append(conditions, "(suggested IS NULL OR suggested = false)")
	}

	whereClause := strings.Join(conditions, " AND ")

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM test_cases WHERE %s", whereClause)
	if err := t.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := pageSize
	offset := (page - 1) * pageSize
	args = append(args, limit, offset)
	limitPos := argPos
	offsetPos := argPos + 1

	query := fmt.Sprintf(`SELECT id, kind, code, feature_or_module, title, description, parent_test_case_id, is_draft, tags, created_by_id, created_at, updated_at, project_id, priority
FROM test_cases WHERE %s ORDER BY %s %s LIMIT $%d OFFSET $%d`, whereClause, sortColumn, sortOrder, limitPos, offsetPos)

	rows, err := t.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []dbsqlc.TestCase{}
	for rows.Next() {
		var item dbsqlc.TestCase
		if err := rows.Scan(
			&item.ID,
			&item.Kind,
			&item.Code,
			&item.FeatureOrModule,
			&item.Title,
			&item.Description,
			&item.ParentTestCaseID,
			&item.IsDraft,
			pq.Array(&item.Tags),
			&item.CreatedByID,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.ProjectID,
			&item.Priority,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// FindAllByID implements TestCaseService.
func (t *testCaseServiceImpl) FindByID(ctx context.Context, id string) (*dbsqlc.GetTestCaseWithParentRow, error) {
	uuidID := uuid.MustParse(id)
	tc, err := t.queries.GetTestCaseWithParent(ctx, uuidID)
	if err != nil {
		return nil, err
	}
	return &tc, nil
}

// FindAllByProjectID implements TestCaseService.
func (t *testCaseServiceImpl) FindAllByProjectID(ctx context.Context, projectID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListTestCasesByProject(ctx, sql.NullInt32{Int32: int32(projectID), Valid: true})
}

// FindAllByProjectIDPaged implements TestCaseService.
func (t *testCaseServiceImpl) FindAllByProjectIDPaged(ctx context.Context, projectID int64, params TestCaseQueryParams) ([]dbsqlc.TestCase, int64, error) {
	page := params.Page
	pageSize := params.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	search := strings.TrimSpace(params.Search)
	rows, err := t.queries.TestCaseListByProjectPaged(ctx, dbsqlc.TestCaseListByProjectPagedParams{
		ProjectID: sql.NullInt32{Int32: int32(projectID), Valid: true},
		Search:    search,
		RowLimit:  int32(pageSize),
		RowOffset: int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := t.queries.TestCaseCountByProjectPaged(ctx, dbsqlc.TestCaseCountByProjectPagedParams{
		ProjectID: sql.NullInt32{Int32: int32(projectID), Valid: true},
		Search:    search,
	})
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

// FindAllByProjectID implements TestCaseService.
func (t *testCaseServiceImpl) FindAllByTestPlanID(ctx context.Context, testPlanID int64) ([]schema.TestCaseResponseItem, error) {
	rows, err := t.queries.ListTestCasesByPlan(ctx, testPlanID)
	if err != nil {
		return nil, err
	}

	plan, err := t.queries.GetTestPlan(ctx, testPlanID)
	if err != nil {
		return nil, err
	}

	cases := make([]schema.TestCaseResponseItem, 0, len(rows))
	for _, r := range rows {
		var testerIDs []int64
		if r.AssignedTesterIds != nil {
			testerIDs = r.AssignedTesterIds
		}

		cases = append(cases, schema.TestCaseResponseItem{
			ID:                   r.ID.String(),
			Code:                 r.Code,
			Title:                r.Title,
			Priority:             string(r.Priority),
			Urgency:              string(r.Urgency),
			IsAssignedToTestPlan: true,
			TestPlan: &schema.TestPlanSummary{
				ID:   int64(plan.ID),
				Name: plan.Description.String,
			},
			AssignedTesterIDs: testerIDs,
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
		Preconditions:   common.NullString(req.Preconditions),
		ExternalID:      common.NullString(req.ExternalID),
		FeatureOrModule: common.NullString(req.FeatureOrModule),
		IsDraft:         common.NewNullBool(req.IsDraft),
		Tags:            req.Tags,
		UpdatedAt:       common.NullTime(time.Now()),
		Runner:          common.NullString(req.Runner),
		ScriptPath:      common.NullString(req.ScriptPath),
		Priority:        schema.ParsePriorityLevel(req.Priority),
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

func (t *testCaseServiceImpl) FindAllAssignedToUser(ctx context.Context, params *schema.InboxFilterParams) ([]schema.AssignedTestCase, int64, error) {
	rows, err := t.queries.TestCaseListByAssignedUser(ctx, dbsqlc.TestCaseListByAssignedUserParams{
		UserID:        params.UserID,
		RowLimit:      int32(params.PageSize),
		RowOffset:     int32(params.Page),
		IncludeClosed: params.IncludeClosed,
		Projects:      params.Projects,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []schema.AssignedTestCase{}, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to load assigned test cases: %v", err)
	}

	res := make([]schema.AssignedTestCase, 0, len(rows))
	for _, row := range rows {
		res = append(res, schema.AssignedTestCase{
			ID:              row.ID.String(),
			Kind:            row.Kind,
			Code:            row.Code,
			FeatureOrModule: row.FeatureOrModule.String,
			Title:           row.Title,
			Description:     row.Description,
			Preconditions:   row.Preconditions.String,
			ExternalID:      row.ExternalID.String,
			IsDraft:         row.IsDraft.Bool,
			Tags:            row.Tags,
			CreatedByID:     row.CreatedByID,
			CreatedAt:       row.CreatedAt.Time,
			UpdatedAt:       row.UpdatedAt.Time,
			ProjectID:       int64(row.ProjectID.Int32),
			TestPlanID:      int32(row.TestPlanID),
			AssignedToID:    int32(row.AssignedToID),
			EnvironmentID:   row.EnvironmentID,
			IsClosed:        row.IsClosed,
			IsViewed:        row.IsViewed,
			Priority:        string(row.Priority),
			Urgency:         string(row.Urgency),
		})
	}

	// Count query
	total, err := t.queries.TestCaseCountByAssignedUser(ctx, dbsqlc.TestCaseCountByAssignedUserParams{
		UserID:        params.UserID,
		IncludeClosed: params.IncludeClosed,
	})
	if err != nil {
		return res, 0, err
	}

	return res, total, nil
}

func (t *testCaseServiceImpl) FindAssignedToUserByID(ctx context.Context, userID int64, testCaseID string) (*schema.AssignedTestCase, error) {
	id, err := uuid.Parse(testCaseID)
	if err != nil {
		return nil, fmt.Errorf("invalid test case id: %w", err)
	}

	row, err := t.queries.TestCaseGetByAssignedUser(ctx, dbsqlc.TestCaseGetByAssignedUserParams{
		UserID:     userID,
		TestCaseID: id,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to load assigned test case: %w", err)
	}

	return &schema.AssignedTestCase{
		ID:              row.ID.String(),
		Kind:            row.Kind,
		Code:            row.Code,
		FeatureOrModule: row.FeatureOrModule.String,
		Title:           row.Title,
		Description:     row.Description,
		Preconditions:   row.Preconditions.String,
		ExternalID:      row.ExternalID.String,
		IsDraft:         row.IsDraft.Bool,
		Tags:            row.Tags,
		CreatedByID:     row.CreatedByID,
		CreatedAt:       row.CreatedAt.Time,
		UpdatedAt:       row.UpdatedAt.Time,
		ProjectID:       int64(row.ProjectID.Int32),
		TestPlanID:      int32(row.TestPlanID),
		AssignedToID:    int32(row.AssignedToID),
		EnvironmentID:   row.EnvironmentID,
		IsClosed:        row.IsClosed,
		IsViewed:        row.IsViewed,
		Priority:        string(row.Priority),
		Urgency:         string(row.Urgency),
	}, nil
}

func (t *testCaseServiceImpl) CountUnseenAssignedToUser(ctx context.Context, userID int64) (int64, error) {
	count, err := t.queries.TestCaseCountUnseenByAssignedUser(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to count unseen assigned test cases: %w", err)
	}
	return count, nil
}

func (t *testCaseServiceImpl) MarkAssignedAsViewed(ctx context.Context, userID int64, testCaseID string) error {
	id, err := uuid.Parse(testCaseID)
	if err != nil {
		return fmt.Errorf("invalid test case id: %w", err)
	}

	err = t.queries.MarkAssignedTestCaseViewed(ctx, dbsqlc.MarkAssignedTestCaseViewedParams{
		TestCaseID: id,
		UserID:     userID,
	})
	if err != nil {
		return fmt.Errorf("failed to mark test case as viewed: %w", err)
	}
	return nil
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
	rows, err := t.queries.GetTestCaseExecutionSummary(ctx, common.NewNullInt32(int32(userID)))
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

func (t *testCaseServiceImpl) FindAllClosed(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	params := dbsqlc.FindTestCasesByProjectIDParams{
		ProjectID:    common.NewNullInt32(int32(projectID)),
		IsClosed:     common.TrueNullBool(),
		ResultStates: []dbsqlc.TestRunState{dbsqlc.TestRunStatePassed},
	}
	rows, err := t.queries.FindTestCasesByProjectID(ctx, params)
	if err != nil {
		return nil, err
	}
	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, toTestCaseResponse(row))
	}
	return responses, nil
}

func (t *testCaseServiceImpl) FindAllFailing(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	params := dbsqlc.FindTestCasesByProjectIDParams{
		ProjectID:    common.NewNullInt32(int32(projectID)),
		IsClosed:     common.TrueNullBool(),
		ResultStates: []dbsqlc.TestRunState{dbsqlc.TestRunStateFailed},
	}
	rows, err := t.queries.FindTestCasesByProjectID(ctx, params)
	if err != nil {
		return nil, err
	}
	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, toTestCaseResponse(row))
	}
	return responses, nil
}

func (t *testCaseServiceImpl) FindAllScheduled(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	params := dbsqlc.FindTestCasesByProjectIDParams{
		ProjectID:    common.NewNullInt32(int32(projectID)),
		IsClosed:     common.FalseNullBool(),
		ResultStates: []dbsqlc.TestRunState{dbsqlc.TestRunStatePending},
	}
	rows, err := t.queries.FindTestCasesByProjectID(ctx, params)
	if err != nil {
		return nil, err
	}
	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, toTestCaseResponse(row))
	}
	return responses, nil
}

func (t *testCaseServiceImpl) FindAllBlocked(ctx context.Context, projectID int64) ([]schema.TestCaseResponse, error) {
	params := dbsqlc.FindTestCasesByProjectIDParams{
		ProjectID:    common.NewNullInt32(int32(projectID)),
		IsClosed:     common.FalseNullBool(),
		ResultStates: []dbsqlc.TestRunState{dbsqlc.TestRunStateBlocked},
	}

	rows, err := t.queries.FindTestCasesByProjectID(ctx, params)
	if err != nil {
		return nil, err
	}

	responses := make([]schema.TestCaseResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, toTestCaseResponse(row))
	}
	return responses, nil

}

func toTestCaseResponse(row dbsqlc.FindTestCasesByProjectIDRow) schema.TestCaseResponse {
	return schema.TestCaseResponse{
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
		ExecutedBy:      int64(row.TestedByID.Int32),
		Notes:           row.Notes,
	}
}

func (t *testCaseServiceImpl) GetExistingCodes(ctx context.Context, projectID int64) (map[string]bool, error) {
	params := dbsqlc.FindTestCasesByProjectIDParams{
		ProjectID:    common.NewNullInt32(int32(projectID)),
		IsClosed:     common.FalseNullBool(),
		ResultStates: []dbsqlc.TestRunState{},
	}
	rows, err := t.queries.FindTestCasesByProjectID(ctx, params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return map[string]bool{}, nil
		}
		return nil, err
	}

	codes := make(map[string]bool, len(rows))
	for _, tc := range rows {
		codes[tc.Code] = true
	}
	return codes, nil
}

func (t *testCaseServiceImpl) Suggest(ctx context.Context, req *schema.CreateSuggestedTestCaseRequest) (*dbsqlc.TestCase, error) {
	uuidVal, _ := uuid.NewV7()

	project, err := t.queries.GetProject(ctx, int32(req.ProjectID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}

	prefixKey := strings.ToLower(project.Code)
	if err := t.queries.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
		ProjectID: int32(req.ProjectID),
		Prefix:    prefixKey,
	}); err != nil {
		return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
	}

	code, err := GenerateNextCode(ctx, t.queries, req.ProjectID, &project, &req.Code)
	if err != nil {
		return nil, err
	}

	params := dbsqlc.CreateTestCaseParams{
		ID:              uuidVal,
		ProjectID:       common.NewNullInt32(int32(req.ProjectID)),
		Kind:            dbsqlc.TestKind(req.Kind),
		Code:            code,
		FeatureOrModule: common.NullString(req.FeatureOrModule),
		Title:           req.Title,
		Description:     req.Description,
		Preconditions:   common.NullString(req.Preconditions),
		IsDraft:         common.FalseNullBool(),
		Tags:            req.Tags,
		CreatedByID:     int32(req.CreatedByID),
		CreatedAt:       common.NewNullTime(time.Now()),
		UpdatedAt:       common.NewNullTime(time.Now()),
		Suggested:       common.TrueNullBool(),
		Runner:          common.NullString(req.Runner),
		ScriptPath:      common.NullString(req.ScriptPath),
		Priority:        schema.ParsePriorityLevel(req.Priority),
	}

	_, err = t.queries.CreateTestCase(ctx, params)
	if err != nil {
		return nil, err
	}

	tc, err := t.queries.GetTestCase(ctx, uuidVal)
	if err != nil {
		return nil, err
	}
	return &tc, nil
}

func (t *testCaseServiceImpl) FindAllSuggested(ctx context.Context, projectID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.FindAllSuggestedByProject(ctx, dbsqlc.FindAllSuggestedByProjectParams{
		ProjectID: common.NewNullInt32(int32(projectID)),
		Suggested: common.TrueNullBool(),
	})
}

func (t *testCaseServiceImpl) AcceptSuggested(ctx context.Context, testCaseID string) error {
	id := uuid.MustParse(testCaseID)
	return t.queries.UpdateSuggestedFlag(ctx, dbsqlc.UpdateSuggestedFlagParams{
		ID:        id,
		Suggested: common.FalseNullBool(),
	})
}
func (t *testCaseServiceImpl) RejectSuggested(ctx context.Context, testCaseID string) error {
	id := uuid.MustParse(testCaseID)
	_, err := t.queries.DeleteTestCase(ctx, id)
	return err
}

func (t *testCaseServiceImpl) FindScriptCasesByPlanID(ctx context.Context, testPlanID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListScriptTestCasesByPlan(ctx, int64(testPlanID))
}

func (t *testCaseServiceImpl) Transfer(ctx context.Context, testCaseID string, req schema.TransferTestCaseRequest) (*dbsqlc.TestCase, error) {
	id, err := uuid.Parse(testCaseID)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer sqlTx.Rollback()
	tx := dbsqlc.New(sqlTx)

	// Fetch target project to generate proper code prefix
	targetProject, err := t.queries.GetProject(ctx, int32(req.TargetProjectID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch target project: %w", err)
	}

	prefixKey := strings.ToLower(targetProject.Code)
	if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
		ProjectID: int32(req.TargetProjectID),
		Prefix:    prefixKey,
	}); err != nil {
		return nil, fmt.Errorf("failed to ensure sequence row: %w", err)
	}

	newCode, err := GenerateNextCode(ctx, tx, req.TargetProjectID, &targetProject, nil)
	if err != nil {
		return nil, err
	}

	// Update the test case with the new project ID, new code, and target feature/module
	if err := tx.TransferTestCase(ctx, dbsqlc.TransferTestCaseParams{
		ID:              id,
		ProjectID:       common.NewNullInt32(int32(req.TargetProjectID)),
		Code:            newCode,
		FeatureOrModule: common.NullString(req.FeatureOrModule),
	}); err != nil {
		return nil, err
	}

	if err := sqlTx.Commit(); err != nil {
		return nil, err
	}

	tc, err := t.queries.GetTestCase(ctx, id)
	if err != nil {
		return nil, err
	}
	return &tc, nil
}

// ErrEmptyTestCaseSelection is returned when a selection neither selects all test
// cases nor lists any
var ErrEmptyTestCaseSelection = errors.New("no test cases selected")

// ErrSelectionHasUnselectedBranches is returned when deleting a selection would
// leave a branch pointing at a deleted parent test case
var ErrSelectionHasUnselectedBranches = errors.New("some selected test cases have branches that aren't selected. Select the branches too or delete them first")

// isParentTestCaseFKViolation reports whether err is a delete blocked by a branch
// still referencing its parent test case
func isParentTestCaseFKViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503" && pgErr.ConstraintName == "fk_parent_test_case"
}

func parseUUIDs(ids []string) ([]uuid.UUID, error) {
	parsed := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		u, err := uuid.Parse(id)
		if err != nil {
			return nil, fmt.Errorf("invalid test case id %q: %w", id, err)
		}
		parsed = append(parsed, u)
	}
	return parsed, nil
}

// findBySelection resolves the selection with db, so it can run inside a transaction
func findBySelection(ctx context.Context, db *dbsqlc.Queries, selection schema.TestCaseSelection) ([]dbsqlc.TestCase, error) {
	if selection.IsEmpty() {
		return nil, ErrEmptyTestCaseSelection
	}
	testCaseIDs, err := parseUUIDs(selection.TestCaseIDs)
	if err != nil {
		return nil, err
	}
	excluded, err := parseUUIDs(selection.ExcludedTestCaseIDs)
	if err != nil {
		return nil, err
	}
	return db.ListTestCasesBySelection(ctx, dbsqlc.ListTestCasesBySelectionParams{
		ProjectID:           int32(selection.ProjectID),
		SelectAll:           selection.SelectAll,
		Search:              strings.TrimSpace(selection.Search),
		ExcludedTestCaseIds: excluded,
		TestCaseIds:         testCaseIDs,
	})
}

// FindBySelection implements TestCaseService.
func (t *testCaseServiceImpl) FindBySelection(ctx context.Context, selection schema.TestCaseSelection) ([]dbsqlc.TestCase, error) {
	return findBySelection(ctx, t.queries, selection)
}

// DeleteBySelection implements TestCaseService. Either every selected test case is
// deleted or none is.
func (t *testCaseServiceImpl) DeleteBySelection(ctx context.Context, selection schema.TestCaseSelection) (int64, error) {
	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer sqlTx.Rollback()
	tx := dbsqlc.New(sqlTx)

	testCases, err := findBySelection(ctx, tx, selection)
	if err != nil {
		return 0, err
	}
	if len(testCases) == 0 {
		return 0, nil
	}

	ids := make([]uuid.UUID, 0, len(testCases))
	for _, tc := range testCases {
		ids = append(ids, tc.ID)
	}
	deleted, err := tx.DeleteTestCasesByIDs(ctx, ids)
	if err != nil {
		if isParentTestCaseFKViolation(err) {
			return 0, ErrSelectionHasUnselectedBranches
		}
		return 0, fmt.Errorf("failed to delete test cases: %w", err)
	}

	if err := sqlTx.Commit(); err != nil {
		return 0, err
	}
	return deleted, nil
}

// TransferBySelection implements TestCaseService. Each test case gets a new code in
// the target project, in the order they were created. Either every selected test
// case is transferred or none is.
func (t *testCaseServiceImpl) TransferBySelection(ctx context.Context, req schema.BulkTransferTestCasesRequest) (int64, error) {
	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer sqlTx.Rollback()
	tx := dbsqlc.New(sqlTx)

	testCases, err := findBySelection(ctx, tx, req.Selection)
	if err != nil {
		return 0, err
	}
	if len(testCases) == 0 {
		return 0, nil
	}

	targetProject, err := tx.GetProject(ctx, int32(req.TargetProjectID))
	if err != nil {
		return 0, fmt.Errorf("failed to fetch target project: %w", err)
	}
	if err := tx.InitTestCaseSequence(ctx, dbsqlc.InitTestCaseSequenceParams{
		ProjectID: int32(req.TargetProjectID),
		Prefix:    strings.ToLower(targetProject.Code),
	}); err != nil {
		return 0, fmt.Errorf("failed to ensure sequence row: %w", err)
	}

	for _, tc := range testCases {
		newCode, err := GenerateNextCode(ctx, tx, req.TargetProjectID, &targetProject, nil)
		if err != nil {
			return 0, err
		}
		if err := tx.TransferTestCase(ctx, dbsqlc.TransferTestCaseParams{
			ID:              tc.ID,
			ProjectID:       common.NewNullInt32(int32(req.TargetProjectID)),
			Code:            newCode,
			FeatureOrModule: common.NullString(req.FeatureOrModule),
		}); err != nil {
			return 0, fmt.Errorf("failed to transfer test case %s: %w", tc.ID, err)
		}
	}

	if err := sqlTx.Commit(); err != nil {
		return 0, err
	}
	return int64(len(testCases)), nil
}

func (t *testCaseServiceImpl) GetSummary(ctx context.Context, projectID int64) (*schema.ProjectTestCaseSummaryResponse, error) {
	total, err := t.queries.CountTestCasesByProject(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	completed, err := t.queries.CountCompletedTestCasesByProject(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	incomplete := int(total) - int(completed)

	passed, err := t.queries.CountTestRunsByResultState(ctx, dbsqlc.CountTestRunsByResultStateParams{
		ProjectID:   int32(projectID),
		ResultState: dbsqlc.TestRunStatePassed,
	})
	if err != nil {
		return nil, err
	}

	failed, err := t.queries.CountTestRunsByResultState(ctx, dbsqlc.CountTestRunsByResultStateParams{
		ProjectID:   int32(projectID),
		ResultState: dbsqlc.TestRunStateFailed,
	})
	if err != nil {
		return nil, err
	}

	pending, err := t.queries.CountTestRunsByResultState(ctx, dbsqlc.CountTestRunsByResultStateParams{
		ProjectID:   int32(projectID),
		ResultState: dbsqlc.TestRunStatePending,
	})
	if err != nil {
		return nil, err
	}

	blocked, err := t.queries.CountTestRunsByResultState(ctx, dbsqlc.CountTestRunsByResultStateParams{
		ProjectID:   int32(projectID),
		ResultState: dbsqlc.TestRunStateBlocked,
	})
	if err != nil {
		return nil, err
	}

	return &schema.ProjectTestCaseSummaryResponse{
		Total:      int(total),
		Completed:  int(completed),
		Incomplete: incomplete,
		Passed:     int(passed),
		Failed:     int(failed),
		Pending:    int(pending),
		Blocked:    int(blocked),
	}, nil
}

func (t *testCaseServiceImpl) FindUntested(ctx context.Context, projectID, testPlanID int64) ([]dbsqlc.TestCase, error) {
	return t.queries.ListUntestedTestCasesByProject(ctx, dbsqlc.ListUntestedTestCasesByProjectParams{
		ProjectID:  int32(projectID),
		TestPlanID: common.NewNullInt64(testPlanID),
	})
}

func (t *testCaseServiceImpl) FindLatestFailed(ctx context.Context, projectID, testPlanID int64) ([]schema.FailedTestCase, error) {
	rows, err := t.queries.ListFailedTestCasesByProject(ctx, dbsqlc.ListFailedTestCasesByProjectParams{
		ProjectID:  int32(projectID),
		TestPlanID: common.NewNullInt64(testPlanID),
	})
	if err != nil {
		return nil, err
	}
	failed := make([]schema.FailedTestCase, 0, len(rows))
	for _, row := range rows {
		failed = append(failed, schema.FailedTestCase{
			ID:              row.ID.String(),
			Code:            row.Code,
			Title:           row.Title,
			FeatureOrModule: row.FeatureOrModule.String,
			Priority:        string(row.Priority),
			TestRunID:       row.TestRunID.String(),
			TestPlanID:      int64(row.TestPlanID.Int32),
			TestedByID:      int64(row.TestedByID.Int32),
			TestedBy:        row.TestedBy,
			ActualResult:    row.ActualResult.String,
			Notes:           row.Notes,
			FailedAt:        common.FormatNullTime(row.FailedAt),
		})
	}
	return failed, nil
}
