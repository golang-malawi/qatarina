package services

import (
	"cmp"
	"context"
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
	RecordPublicResult(context.Context, string, *schema.PublicTestResultRequest) error
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
		ID:             uuid.MustParse(request.TestRunID),
		TestedByID:     int32(request.UserID),
		Notes:          request.Notes,
		UpdatedAt:      common.NullTime(time.Now()),
		ResultState:    request.State,
		IsClosed:       common.NewNullBool(request.IsClosed),
		TestedOn:       request.TestedOn,
		ActualResult:   common.NullString(request.ActualResult),
		ExpectedResult: common.NullString(cmp.Or(request.ExpectedResult, testRun.ExpectedResult.String)),
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
		ExecutedBy: int32(request.UserID),
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

func (t *testRunService) RecordPublicResult(ctx context.Context, token string, req *schema.PublicTestResultRequest) error {
	invite, err := t.queries.GetInviteByToken(ctx, token)
	if err != nil {
		return fmt.Errorf("invalid or expired token: %w", err)
	}

	user, err := t.queries.FindUserLoginByEmail(ctx, invite.ReceiverEmail)
	var testedByID int32
	if err != nil {
		// guest tester: no registered user found
		testedByID = 0
	} else {
		testedByID = user.ID
	}

	testRun, err := t.queries.FindTestRunByCaseAndUser(ctx, dbsqlc.FindTestRunByCaseAndUserParams{
		TestCaseID: invite.TestCaseID.UUID,
		TestedByID: testedByID,
	})
	if err != nil {
		return fmt.Errorf("no test run found for case %s and user %d: %w", invite.TestCaseID.UUID, testedByID, err)
	}

	commitReq := &schema.CommitTestRunResult{
		TestRunID:    testRun.ID.String(),
		UserID:       int64(testedByID),
		State:        dbsqlc.TestRunState(req.Result),
		Notes:        req.Comment,
		TestedOn:     time.Now(),
		IsClosed:     true,
		ActualResult: req.Result,
	}

	_, err = t.Commit(ctx, commitReq)
	if err != nil {
		return fmt.Errorf("failed to commit pubic result: %w", err)
	}

	return nil
}
