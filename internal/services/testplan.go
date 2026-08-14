package services

import (
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

type TestPlanService interface {
	FindAll(context.Context) ([]schema.TestPlanResponseItem, error)
	FindAllByProjectID(context.Context, int64) ([]schema.TestPlanResponseItem, error)
	FindAllByTestPlanID(context.Context, int32) ([]dbsqlc.ListTestRunsByPlanRow, error)
	GetOneTestPlan(context.Context, int64) (*schema.TestPlanResponseItem, error)
	Create(context.Context, *schema.CreateTestPlan) (*dbsqlc.GetTestPlanRow, error)
	AddTestCaseToPlan(context.Context, *schema.AssignTestsToPlanRequest) (*dbsqlc.GetTestPlanRow, error)
	DeleteByID(context.Context, int64) error
	Update(context.Context, schema.UpdateTestPlan) (bool, error)
	CloseTestPlan(context.Context, int32) error
	ChangeEnvironment(ctx context.Context, projectID, envID int64) error
	ListComments(ctx context.Context, testPlanID int64) ([]schema.CommentResponseItem, error)
	CreateComment(ctx context.Context, req *schema.CreateComment) (*schema.CommentResponseItem, error)
	DeleteComment(ctx context.Context, commentID string) error
	ConvertCommentToTestCase(ctx context.Context, commentID string) (string, error)

	BatchAssignTestCasesToPlan(context.Context, *schema.BatchAssignTestCasesToPlanRequest) (*dbsqlc.GetTestPlanRow, error)
}

var _ TestPlanService = &testPlanService{}

type testPlanService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTestPlanService(conn *dbsqlc.Queries, logger logging.Logger) TestPlanService {
	return &testPlanService{
		queries: conn,
		logger:  logger,
	}
}

// Create implements TestPlanService.
func (t *testPlanService) Create(ctx context.Context, request *schema.CreateTestPlan) (*dbsqlc.GetTestPlanRow, error) {
	testPlanParams := dbsqlc.CreateTestPlanParams{
		ProjectID:     int32(request.ProjectID),
		AssignedToID:  int32(request.AssignedToID),
		CreatedByID:   int32(request.CreatedByID),
		UpdatedByID:   int32(request.UpdatedByID),
		Kind:          dbsqlc.TestKind(request.Kind),
		Description:   common.NullString(request.Description),
		EnvironmentID: common.NewNullInt32(int32(request.EnvironmentID)),

		StartAt:        common.NullTime(request.StartAt),
		ScheduledEndAt: common.NullTime(request.ScheduledEndAt),
		ClosedAt:       common.NullTime(common.ZeroOrTime(request.ClosedAt)), // helper for optional
		NumTestCases:   0,
		NumFailures:    0,
		IsComplete:     common.FalseNullBool(),
		IsLocked:       common.FalseNullBool(),
		HasReport:      common.FalseNullBool(),
		CreatedAt:      common.NewNullTime(time.Now()),
		UpdatedAt:      common.NewNullTime(time.Now()),
	}

	testPlanID, err := t.queries.CreateTestPlan(ctx, testPlanParams)
	if err != nil {
		return nil, err
	}

	for _, assignedTestCase := range request.PlannedTests {
		for _, uid := range assignedTestCase.UserIDs {
			if err := t.queries.AddTestCaseToPlan(ctx, dbsqlc.AddTestCaseToPlanParams{
				TestPlanID:   int64(testPlanID),
				TestCaseID:   uuid.MustParse(assignedTestCase.TestCaseID),
				AssignedToID: uid,
			}); err != nil {
				return nil, err
			}
		}
	}

	createdTestPlan, err := t.queries.GetTestPlan(ctx, testPlanID)
	return &createdTestPlan, err
}

// FindAll implements TestPlanService.
func (t *testPlanService) FindAll(ctx context.Context) ([]schema.TestPlanResponseItem, error) {
	plans, err := t.queries.ListTestPlans(ctx)
	if err != nil {
		return nil, err
	}

	var enriched []schema.TestPlanResponseItem
	for _, plan := range plans {
		cases, _ := t.queries.ListTestCasesByPlan(ctx, plan.ID)
		runStats, _ := t.queries.GetTestPlanRunStats(ctx, sql.NullInt32{Int32: int32(plan.ID), Valid: true})

		enriched = append(enriched, schema.TestPlanResponseItem{
			ID:              plan.ID,
			Description:     plan.Description.String,
			Kind:            string(plan.Kind),
			NumTestCases:    int32(len(cases)),
			PassedCount:     runStats.PassedCount,
			FailedCount:     runStats.FailedCount,
			PendingCount:    runStats.PendingCount,
			AssignedTesters: runStats.AssignedTestersCount,
			IsComplete:      plan.IsComplete.Bool,
			IsLocked:        plan.IsLocked.Bool,
			HasReport:       plan.HasReport.Bool,
		})
	}
	return enriched, nil
}

func (t *testPlanService) FindAllByProjectID(ctx context.Context, projectID int64) ([]schema.TestPlanResponseItem, error) {
	plans, err := t.queries.ListTestPlansByProject(ctx, int32(projectID))
	if err != nil {
		return nil, err
	}

	var enriched []schema.TestPlanResponseItem
	for _, plan := range plans {
		cases, _ := t.queries.ListTestCasesByPlan(ctx, plan.ID)
		runStats, _ := t.queries.GetTestPlanRunStats(ctx, sql.NullInt32{Int32: int32(plan.ID), Valid: true})

		enriched = append(enriched, schema.TestPlanResponseItem{
			ID:              plan.ID,
			Description:     plan.Description.String,
			Kind:            string(plan.Kind),
			NumTestCases:    int32(len(cases)),
			PassedCount:     runStats.PassedCount,
			FailedCount:     runStats.FailedCount,
			PendingCount:    runStats.PendingCount,
			AssignedTesters: runStats.AssignedTestersCount,
			IsComplete:      plan.IsComplete.Bool,
			IsLocked:        plan.IsLocked.Bool,
			HasReport:       plan.HasReport.Bool,
		})
	}
	return enriched, nil
}

// FindAllByTestPlanID implements TestPlanService
func (t *testPlanService) FindAllByTestPlanID(ctx context.Context, testPlanID int32) ([]dbsqlc.ListTestRunsByPlanRow, error) {
	return t.queries.ListTestRunsByPlan(ctx, sql.NullInt32{Int32: testPlanID, Valid: true})
}

type testCaseAssignment struct {
	TestCaseID   uuid.UUID
	AssignedToID int64
}

func (t *testPlanService) assignTestCases(ctx context.Context, planID int64, assignments []testCaseAssignment) (*dbsqlc.GetTestPlanRow, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, planID)
	if err != nil {
		return nil, err
	}

	for _, a := range assignments {
		if err := t.queries.AddTestCaseToPlan(ctx, dbsqlc.AddTestCaseToPlanParams{
			TestPlanID:   planID,
			TestCaseID:   a.TestCaseID,
			AssignedToID: a.AssignedToID,
		}); err != nil {
			return nil, err
		}
	}

	return &testPlan, nil
}

// AddTestCaseToPlan implements TestPlanService.
func (t *testPlanService) AddTestCaseToPlan(ctx context.Context, request *schema.AssignTestsToPlanRequest) (*dbsqlc.GetTestPlanRow, error) {
	var assignments []testCaseAssignment
	for _, pt := range request.PlannedTests {
		tcID := uuid.MustParse(pt.TestCaseID)
		for _, uid := range pt.UserIDs {
			assignments = append(assignments, testCaseAssignment{TestCaseID: tcID, AssignedToID: uid})
		}
	}
	return t.assignTestCases(ctx, request.PlanID, assignments)
}

// BatchAssignTestCasesToPlan implements TestPlanService.
func (t *testPlanService) BatchAssignTestCasesToPlan(ctx context.Context, request *schema.BatchAssignTestCasesToPlanRequest) (*dbsqlc.GetTestPlanRow, error) {
	var assignments []testCaseAssignment
	for _, tcIDStr := range request.TestCaseIDs {
		tcID, err := uuid.Parse(tcIDStr)
		if err != nil {
			return nil, err
		}
		for _, uid := range request.UserIDs {
			assignments = append(assignments, testCaseAssignment{TestCaseID: tcID, AssignedToID: uid})
		}
	}
	return t.assignTestCases(ctx, request.PlanID, assignments)
}

func (t *testPlanService) DeleteByID(ctx context.Context, id int64) error {
	_, err := t.queries.DeleteTestPlan(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete test plan %d:%w", id, err)
	}
	return nil
}

func (t *testPlanService) GetOneTestPlan(ctx context.Context, id int64) (*schema.TestPlanResponseItem, error) {
	plan, err := t.queries.GetTestPlan(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("test plan %d not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to load test plan: %w", err)
	}

	cases, err := t.queries.ListTestCasesByPlan(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to load test cases for plan %d: %w", id, err)
	}

	runStats, err := t.queries.GetTestPlanRunStats(ctx, sql.NullInt32{Int32: int32(id), Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to load test run statistics for plan %d: %w", id, err)
	}

	response := schema.TestPlanResponseItem{
		ID:              plan.ID,
		ProjectID:       plan.ProjectID,
		EnvironmentID:   plan.EnvironmentID.Int32,
		AssignedToID:    plan.AssignedToID,
		CreatedByID:     plan.CreatedByID,
		UpdatedByID:     plan.UpdatedByID,
		Kind:            string(plan.Kind),
		Description:     plan.Description.String,
		StartAt:         plan.StartAt.Time.Format(time.DateTime),
		ClosedAt:        plan.ClosedAt.Time.Format(time.DateTime),
		ScheduledEndAt:  plan.ScheduledEndAt.Time.Format(time.DateTime),
		NumTestCases:    int32(len(cases)),
		NumFailures:     plan.NumFailures,
		PassedCount:     runStats.PassedCount,
		FailedCount:     runStats.FailedCount,
		PendingCount:    runStats.PendingCount,
		AssignedTesters: runStats.AssignedTestersCount,
		IsComplete:      plan.IsComplete.Bool,
		IsLocked:        plan.IsLocked.Bool,
		HasReport:       plan.HasReport.Bool,
		CreatedAt:       plan.CreatedAt.Time.Format(time.DateTime),
		UpdatedAt:       plan.UpdatedAt.Time.Format(time.DateTime),
		TestCases:       []schema.TestCaseResponseItem{},
	}

	for _, tc := range cases {
		response.TestCases = append(response.TestCases, schema.TestCaseResponseItem{
			ID:                   tc.ID.String(),
			Title:                tc.Title,
			IsAssignedToTestPlan: true,
			TestPlan: &schema.TestPlanSummary{
				ID:   plan.ID,
				Name: plan.Description.String,
			},
			AssignedTesterIDs: tc.AssignedTesterIds,
		})
	}

	return &response, nil
}

func (t *testPlanService) Update(ctx context.Context, request schema.UpdateTestPlan) (bool, error) {
	err := t.queries.UpdateTestPlan(ctx, dbsqlc.UpdateTestPlanParams{
		ProjectID:      int32(request.ProjectID),
		Kind:           dbsqlc.TestKind(request.Kind),
		Description:    common.NullString(request.Description),
		EnvironmentID:  common.NewNullInt32(int32(request.EnvironmentID)),
		StartAt:        common.NullTime(request.StartAt),
		ClosedAt:       common.NullTime(common.ZeroOrTime(request.ClosedAt)),
		ScheduledEndAt: common.NullTime(request.ScheduledEndAt),
	})
	if err != nil {
		t.logger.Error("failed to update test plan", "error", err)
		return false, err
	}
	return true, nil
}

// CloseTestPlan implements TestRunService
func (t *testPlanService) CloseTestPlan(ctx context.Context, testPlanID int32) error {
	testRuns, err := t.queries.ListTestRunsByPlan(ctx, sql.NullInt32{Int32: testPlanID, Valid: true})
	if err != nil {
		t.logger.Error("error listing test runs", "error", err)
		return err
	}

	for _, testRun := range testRuns {
		if testRun.ResultState == "pending" || !testRun.IsClosed.Bool {
			t.logger.Error("failed to close test plan", "error", err)
			return fmt.Errorf("cannot close: some test run %v is still pending", testRun.ID)
		}
	}

	rowsAffected, err := t.queries.CloseTestPlan(ctx, dbsqlc.CloseTestPlanParams{
		ID:       int64(testPlanID),
		ClosedAt: common.NullTime(time.Now()),
	})
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("test plan %d not found", testPlanID)
	}

	return nil
}

func (t *testPlanService) ChangeEnvironment(ctx context.Context, testPlanID, envID int64) error {
	params := dbsqlc.ChangeEnvironmentParams{
		ID:            testPlanID,
		EnvironmentID: common.NewNullInt32(int32(envID)),
	}
	return t.queries.ChangeEnvironment(ctx, params)
}

func (t *testPlanService) ListComments(ctx context.Context, testPlanID int64) ([]schema.CommentResponseItem, error) {
	rows, err := t.queries.ListCommentsByTestPlan(ctx, testPlanID)
	if err != nil {
		return nil, err
	}

	commentMap := make(map[string]*schema.CommentResponseItem)
	var rootComments []schema.CommentResponseItem

	for _, r := range rows {
		item := schema.CommentResponseItem{
			ID:         r.ID.String(),
			TestPlanID: r.TestPlanID,
			UserID:     r.UserID,
			UserName:   r.DisplayName.String,
			Content:    r.Content,
			CreatedAt:  r.CreatedAt.Time.Format(time.RFC3339),
			UpdatedAt:  r.UpdatedAt.Time.Format(time.RFC3339),
		}
		if r.ParentCommentID.Valid {
			parentStr := r.ParentCommentID.UUID.String()
			item.ParentCommentID = &parentStr
		}
		commentMap[item.ID] = &item
	}

	for _, item := range commentMap {
		if item.ParentCommentID != nil {
			if parent, exists := commentMap[*item.ParentCommentID]; exists {
				parent.Replies = append(parent.Replies, *item)
			}
		} else {
			rootComments = append(rootComments, *item)
		}
	}

	return rootComments, nil
}

func (t *testPlanService) CreateComment(ctx context.Context, req *schema.CreateComment) (*schema.CommentResponseItem, error) {
	id := uuid.New()

	var parentUUID uuid.NullUUID
	if req.ParentCommentID != nil && *req.ParentCommentID != "" {
		parsedUUID, err := uuid.Parse(*req.ParentCommentID)
		if err != nil {
			return nil, fmt.Errorf("invalid parent comment ID: %w", err)
		}
		parentUUID = uuid.NullUUID{UUID: parsedUUID, Valid: true}
	}

	row, err := t.queries.CreateComment(ctx, dbsqlc.CreateCommentParams{
		ID:              id,
		TestPlanID:      req.TestPlanID,
		ParentCommentID: parentUUID,
		UserID:          req.UserID,
		Content:         req.Content,
	})
	if err != nil {
		return nil, err
	}

	var parentStr *string
	if row.ParentCommentID.Valid {
		s := row.ParentCommentID.UUID.String()
		parentStr = &s
	}

	return &schema.CommentResponseItem{
		ID:              row.ID.String(),
		TestPlanID:      row.TestPlanID,
		ParentCommentID: parentStr,
		UserID:          row.UserID,
		Content:         row.Content,
		CreatedAt:       row.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:       row.UpdatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (t *testPlanService) DeleteComment(ctx context.Context, commentID string) error {
	id, err := uuid.Parse(commentID)
	if err != nil {
		return err
	}
	_, err = t.queries.DeleteComment(ctx, id)
	return err
}

func (t *testPlanService) ConvertCommentToTestCase(ctx context.Context, commentID string) (string, error) {
	cid, err := uuid.Parse(commentID)
	if err != nil {
		return "", err
	}
	newID := uuid.New()
	id, err := t.queries.ConvertCommentToTestCase(ctx, dbsqlc.ConvertCommentToTestCaseParams{
		ID:        cid,
		NewTestID: newID,
	})
	if err != nil {
		return "", err
	}
	return id.String(), nil
}
