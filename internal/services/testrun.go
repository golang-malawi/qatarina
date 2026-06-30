package services

import (
	"cmp"
	"context"
	"database/sql"
	"errors"
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
	Create(context.Context, *schema.TestRunRequest) (*dbsqlc.TestRun, error)
	GetOneTestRun(context.Context, string) (*dbsqlc.TestRun, error)
	// CreateFromFailedTest records tests without necessarily first creating TestCases.
	//
	// A common use case for Quality Assurance process is reporting things, right now,
	// having to wait for a scheduled Test Plan/Session. This function covers the scenario
	// where Testers need to just record "Issues" (TODO: reconsider the terminology)
	// This allows Testers to record failed tests which get backlinked to default test plan or
	// a specific test plan if specified
	CreateFromFoundIssues(context.Context, *schema.NewFoundIssuesRequest)
	Execute(ctx context.Context, request *schema.ExecuteTestRunRequest) (*dbsqlc.TestRun, error)
	IsTestPlanActive(ctx context.Context, planID int64) (bool, error)
	IsTestCaseActive(ctx context.Context, caseID string) (bool, error)
	CloseTestRun(ctx context.Context, testRunID string) (*dbsqlc.TestRun, error)
	SubscribeToLogs(runID string) (<-chan schema.RunnerMessage, error)
	PublishLog(runID string, msg schema.RunnerMessage) error
}

type testRunService struct {
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger

	subscribers map[string][]chan schema.RunnerMessage
}

func NewTestRunService(db *sql.DB, conn *dbsqlc.Queries, logger logging.Logger) TestRunService {
	return &testRunService{
		db:          db,
		queries:     conn,
		logger:      logger,
		subscribers: make(map[string][]chan schema.RunnerMessage),
	}
}

// Create implements TestRunService
func (t *testRunService) Create(ctx context.Context, request *schema.TestRunRequest) (*dbsqlc.TestRun, error) {
	id := uuid.New()

	// Determine result state: use provided state, or default to pending if no feedback provided
	resultState := dbsqlc.TestRunStatePending
	if request.ResultState != nil {
		resultState = *request.ResultState
	}

	var planID sql.NullInt32
	if request.TestPlanID > 0 {
		planID = sql.NullInt32{Int32: request.TestPlanID, Valid: true}
	} else {
		planID = sql.NullInt32{Valid: false}
	}

	_, err := t.queries.CreateNewTestRun(ctx, dbsqlc.CreateNewTestRunParams{
		ID:            id,
		ProjectID:     request.ProjectID,
		TestPlanID:    planID,
		TestCaseID:    uuid.MustParse(request.TestCaseID),
		OwnerID:       request.OwnerID,
		TestedByID:    common.NewNullInt32(request.TestedByID),
		AssignedToID:  common.NewNullInt32(request.AssignedToID),
		Code:          request.Code,
		CreatedAt:     common.NullTime(time.Now()),
		UpdatedAt:     common.NullTime(time.Now()),
		EnvironmentID: common.NewNullInt32(request.EnvironmentID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create test run: %w", err)
	}

	// If feedback is provided (actual_result or result_state), record it immediately
	if request.ActualResult != nil || request.ResultState != nil {
		testedOn := time.Now().UTC()
		if request.TestedOn != nil {
			testedOn = *request.TestedOn
		}

		// Extract pointer values with defaults
		actualResult := ""
		if request.ActualResult != nil {
			actualResult = *request.ActualResult
		}
		expectedResult := ""
		if request.ExpectedResult != nil {
			expectedResult = *request.ExpectedResult
		}
		notes := ""
		if request.Notes != nil {
			notes = *request.Notes
		}

		// Prepare commit data with feedback
		commitRequest := &schema.CommitTestRunResult{
			UserID:         int64(request.TestedByID),
			TestRunID:      id.String(),
			ActualResult:   actualResult,
			ExpectedResult: expectedResult,
			Notes:          notes,
			State:          resultState,
			TestedOn:       testedOn,
			IsClosed:       false,
		}

		// Commit the results
		_, err = t.Commit(ctx, commitRequest)
		if err != nil {
			// Log error but don't fail - test run was created successfully
			t.logger.Error("failed to commit initial feedback", "error", err, "testRunID", id)
		}
	}

	run, err := t.queries.GetTestRun(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch created test run: %w", err)
	}

	return &run, nil
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
		ID:             uuid.MustParse(request.TestRunID),
		TestedByID:     common.NewNullInt32(int32(request.UserID)),
		Notes:          request.Notes,
		UpdatedAt:      common.NullTime(time.Now()),
		ResultState:    request.State,
		IsClosed:       common.NewNullBool(request.IsClosed),
		TestedOn:       request.TestedOn,
		ActualResult:   common.NullString(request.ActualResult),
		ExpectedResult: common.NullString(cmp.Or(request.ExpectedResult, testRun.ExpectedResult.String)),
		EnvironmentID:  common.NewNullInt32(request.EnvironmentID),
	})

	if err != nil {
		return nil, err
	}

	// Update the test_runs_results for historical logging
	_, err = t.queries.InsertTestRunResult(ctx, dbsqlc.InsertTestRunResultParams{
		ID:         uuid.New(),
		TestRunID:  uuid.MustParse(request.TestRunID),
		Status:     request.State,
		Result:     request.ActualResult,
		Notes:      common.NullString(request.Notes),
		ExecutedBy: common.NewNullInt32(int32(request.UserID)),
		ExecutedAt: request.TestedOn,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to insert to test_run_results: %w", err)
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

func (t *testRunService) Execute(ctx context.Context, request *schema.ExecuteTestRunRequest) (*dbsqlc.TestRun, error) {
	runUUID, err := uuid.Parse(request.ID)
	if err != nil {
		return nil, fmt.Errorf("invalid test run ID: %w", err)
	}

	sqlTx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer sqlTx.Rollback()

	tx := dbsqlc.New(sqlTx)

	err = tx.ExecuteTestRun(ctx, dbsqlc.ExecuteTestRunParams{
		ID:             runUUID,
		ResultState:    dbsqlc.TestRunState(request.Status),
		TestedByID:     common.NewNullInt32(int32(request.ExecutedBy)),
		Notes:          request.Notes,
		ActualResult:   common.NullString(request.Result),
		ExpectedResult: common.NullString(request.ExpectedResult),
		EnvironmentID:  common.NewNullInt32(request.EnvironmentID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute test case: %w", err)
	}

	// Insert itnot test_run_results for history
	_, err = tx.InsertTestRunResult(ctx, dbsqlc.InsertTestRunResultParams{
		ID:         uuid.New(),
		TestRunID:  runUUID,
		Status:     dbsqlc.TestRunState(request.Status),
		Result:     request.Result,
		Notes:      common.NullString(request.Notes),
		ExecutedBy: common.NewNullInt32(int32(request.ExecutedBy)),
		ExecutedAt: time.Now(),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to insert test run result: %w", err)
	}

	tr, err := tx.GetTestRun(ctx, runUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated test case: %w", err)
	}

	if err := sqlTx.Commit(); err != nil {
		return nil, err
	}

	return &tr, nil
}

func (t *testRunService) IsTestPlanActive(ctx context.Context, planID int64) (bool, error) {
	plan, err := t.queries.IsTestPlanActive(ctx, planID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return !plan.ClosedAt.Valid && !plan.IsComplete.Bool, nil
}

func (t *testRunService) IsTestCaseActive(ctx context.Context, caseID string) (bool, error) {
	isDraft, err := t.queries.IsTestCaseActive(ctx, uuid.MustParse(caseID))
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if isDraft.Valid && isDraft.Bool {
		return false, nil
	}
	return true, nil
}

func (t *testRunService) CloseTestRun(ctx context.Context, testRunID string) (*dbsqlc.TestRun, error) {
	id := uuid.MustParse(testRunID)
	tr, err := t.queries.GetTestRun(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test run: %w", err)
	}
	if tr.IsClosed.Valid && tr.IsClosed.Bool {
		return &tr, nil
	}
	err = t.queries.CloseTestRun(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to close test run: %w", err)
	}

	closedRun, err := t.queries.GetTestRun(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch closed test run: %w", err)
	}
	return &closedRun, nil
}

func (t *testRunService) SubscribeToLogs(runID string) (<-chan schema.RunnerMessage, error) {
	ch := make(chan schema.RunnerMessage, 100) // buffered channel to avoid blocking
	t.subscribers[runID] = append(t.subscribers[runID], ch)
	return ch, nil
}

func (t *testRunService) PublishLog(runID string, msg schema.RunnerMessage) error {
	subs, ok := t.subscribers[runID]
	if !ok {
		return nil
	}
	for _, ch := range subs {
		select {
		case ch <- msg:
		default:
			t.logger.Warn("subscriber channel full, skipping log message", "runID", runID)
		}
	}
	return nil
}
