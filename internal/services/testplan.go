package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

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
	// ListComments returns a page of top-level comments (newest first) with their replies, and the total number of top-level comments
	ListComments(ctx context.Context, testPlanID int64, limit, offset int32) ([]schema.CommentResponseItem, int64, error)
	CreateComment(ctx context.Context, req *schema.CreateComment) (*schema.CommentResponseItem, error)
	// UpdateComment changes a comment written by req.UserID, returning the storage paths of the
	// attachments that were removed from it. It returns ErrNotFound when the comment is not on
	// the test plan and ErrForbidden when someone else wrote it.
	UpdateComment(ctx context.Context, req *schema.UpdateComment) (*schema.CommentResponseItem, []string, error)
	// DeleteComment deletes a comment and its replies, returning the storage paths of their attachments
	DeleteComment(ctx context.Context, commentID string) ([]string, error)
	CreateCommentAttachment(ctx context.Context, params dbsqlc.CreateCommentAttachmentParams) (*schema.CommentAttachment, error)
	// SetCommentReaction sets a user's emoji reaction on a comment, replacing their earlier one,
	// and returns the comment's reactions. It returns ErrNotFound when the comment is not on
	// the test plan and ErrInvalidReaction when emoji is not an emoji.
	SetCommentReaction(ctx context.Context, testPlanID int64, commentID string, userID int64, emoji string) ([]schema.CommentReaction, error)
	// RemoveCommentReaction removes a user's reaction from a comment and returns the comment's reactions
	RemoveCommentReaction(ctx context.Context, testPlanID int64, commentID string, userID int64) ([]schema.CommentReaction, error)
	GetCommentAttachment(ctx context.Context, attachmentID string) (*dbsqlc.TestPlanCommentAttachment, error)
	ConvertCommentToTestCase(ctx context.Context, commentID string) (string, error)

	BatchAssignTestCasesToPlan(context.Context, *schema.BatchAssignTestCasesToPlanRequest) (*dbsqlc.GetTestPlanRow, error)
	// UpdateTestCaseUrgency sets the urgency of a test case within a test plan
	UpdateTestCaseUrgency(ctx context.Context, testPlanID int64, testCaseID string, urgency string) error
	// UpdateDetails changes a test plan's kind, description, environment and dates,
	// keeping its progress, status and assignments
	UpdateDetails(ctx context.Context, request schema.UpdateTestPlanDetails) error
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
	testCaseIDs := make([]uuid.UUID, 0, len(request.PlannedTests))
	for _, pt := range request.PlannedTests {
		tcID, err := uuid.Parse(pt.TestCaseID)
		if err != nil {
			return nil, fmt.Errorf("invalid test case id: %w", err)
		}
		testCaseIDs = append(testCaseIDs, tcID)
	}
	// Check before creating the plan so that a rejected request leaves no empty plan behind
	if err := ensureNotInFrozenModules(ctx, t.queries, testCaseIDs); err != nil {
		return nil, err
	}
	// Drafts picked one by one are rejected, "select all" skips them instead
	if err := ensureNotDrafts(ctx, t.queries, testCaseIDs); err != nil {
		return nil, err
	}

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
		ClosedAt:       common.NullTime(common.ZeroOrTime(request.ClosedAt)),
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
				Urgency:      newNullUrgency(assignedTestCase.Urgency),
			}); err != nil {
				return nil, err
			}
		}
	}

	if request.AllTestCases != nil {
		if err := t.addAllProjectTestCases(ctx, int64(testPlanID), request.ProjectID, request.AllTestCases, request.PlannedTests); err != nil {
			return nil, err
		}
	}

	createdTestPlan, err := t.queries.GetTestPlan(ctx, testPlanID)
	return &createdTestPlan, err
}

// ErrTestPlanProjectMismatch is returned when test cases of one project are
// assigned to a test plan belonging to a different project
var ErrTestPlanProjectMismatch = errors.New("test plan does not belong to the project")

// addAllProjectTestCases adds every test case in the project matching the selection
// to the plan in a single statement. Test cases in plannedTests are skipped so they
// keep the testers explicitly assigned to them, and drafts are skipped
// because they cannot be assigned to testers.
func (t *testPlanService) addAllProjectTestCases(ctx context.Context, planID, projectID int64, selection *schema.ProjectTestCaseSelection, plannedTests []schema.TestCaseAssignment) error {
	excluded := make([]uuid.UUID, 0, len(selection.ExcludedTestCaseIDs)+len(plannedTests))
	for _, id := range selection.ExcludedTestCaseIDs {
		tcID, err := uuid.Parse(id)
		if err != nil {
			return fmt.Errorf("invalid excluded test case id %q: %w", id, err)
		}
		excluded = append(excluded, tcID)
	}
	for _, pt := range plannedTests {
		tcID, err := uuid.Parse(pt.TestCaseID)
		if err != nil {
			return fmt.Errorf("invalid test case id %q: %w", pt.TestCaseID, err)
		}
		excluded = append(excluded, tcID)
	}

	_, err := t.queries.AddProjectTestCasesToPlan(ctx, dbsqlc.AddProjectTestCasesToPlanParams{
		TestPlanID:          planID,
		UserIds:             selection.UserIDs,
		ProjectID:           int32(projectID),
		Search:              strings.TrimSpace(selection.Search),
		ExcludedTestCaseIds: excluded,
	})
	if err != nil {
		return fmt.Errorf("failed to add project test cases to plan %d: %w", planID, err)
	}
	return nil
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
			ProjectID:       plan.ProjectID,
			EnvironmentID:   plan.EnvironmentID.Int32,
			AssignedToID:    plan.AssignedToID,
			CreatedByID:     plan.CreatedByID,
			UpdatedByID:     plan.UpdatedByID,
			Kind:            string(plan.Kind),
			Description:     plan.Description.String,
			StartAt:         common.FormatNullDateTime(plan.StartAt),
			ScheduledEndAt:  common.FormatNullDateTime(plan.ScheduledEndAt),
			ClosedAt:        common.FormatNullDateTime(plan.ClosedAt),
			NumTestCases:    int32(len(cases)),
			NumFailures:     plan.NumFailures,
			PassedCount:     runStats.PassedCount,
			FailedCount:     runStats.FailedCount,
			PendingCount:    runStats.PendingCount,
			AssignedTesters: runStats.AssignedTestersCount,
			IsComplete:      plan.IsComplete.Bool,
			IsLocked:        plan.IsLocked.Bool,
			HasReport:       plan.HasReport.Bool,
			CreatedAt:       common.FormatNullDateTime(plan.CreatedAt),
			UpdatedAt:       common.FormatNullDateTime(plan.UpdatedAt),
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
			ProjectID:       plan.ProjectID,
			EnvironmentID:   plan.EnvironmentID.Int32,
			AssignedToID:    plan.AssignedToID,
			CreatedByID:     plan.CreatedByID,
			UpdatedByID:     plan.UpdatedByID,
			Kind:            string(plan.Kind),
			Description:     plan.Description.String,
			StartAt:         common.FormatNullDateTime(plan.StartAt),
			ScheduledEndAt:  common.FormatNullDateTime(plan.ScheduledEndAt),
			ClosedAt:        common.FormatNullDateTime(plan.ClosedAt),
			NumTestCases:    int32(len(cases)),
			NumFailures:     plan.NumFailures,
			PassedCount:     runStats.PassedCount,
			FailedCount:     runStats.FailedCount,
			PendingCount:    runStats.PendingCount,
			AssignedTesters: runStats.AssignedTestersCount,
			IsComplete:      plan.IsComplete.Bool,
			IsLocked:        plan.IsLocked.Bool,
			HasReport:       plan.HasReport.Bool,
			CreatedAt:       common.FormatNullDateTime(plan.CreatedAt),
			UpdatedAt:       common.FormatNullDateTime(plan.UpdatedAt),
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
	Urgency      string
}

// newNullUrgency returns a NULL urgency for blank values so that the
// database keeps the existing urgency (or the medium default)
func newNullUrgency(urgency string) dbsqlc.NullPriorityLevel {
	if strings.TrimSpace(urgency) == "" {
		return dbsqlc.NullPriorityLevel{}
	}
	return dbsqlc.NullPriorityLevel{PriorityLevel: schema.ParsePriorityLevel(urgency), Valid: true}
}

func (t *testPlanService) assignTestCases(ctx context.Context, planID int64, assignments []testCaseAssignment) (*dbsqlc.GetTestPlanRow, error) {
	testPlan, err := t.queries.GetTestPlan(ctx, planID)
	if err != nil {
		return nil, err
	}

	// Test cases already in the plan stay usable there (e.g. to change their testers),
	// only test cases newly added to the plan must not come from frozen modules
	planCases, err := t.queries.ListTestCasesByPlan(ctx, planID)
	if err != nil {
		return nil, err
	}
	inPlan := make(map[uuid.UUID]bool, len(planCases))
	for _, pc := range planCases {
		inPlan[pc.ID] = true
	}
	testCaseIDs := make([]uuid.UUID, 0, len(assignments))
	for _, a := range assignments {
		if !inPlan[a.TestCaseID] {
			testCaseIDs = append(testCaseIDs, a.TestCaseID)
		}
	}
	if err := ensureNotInFrozenModules(ctx, t.queries, testCaseIDs); err != nil {
		return nil, err
	}
	// Unlike frozen modules, a draft cannot be assigned to testers even if it is already in the plan
	assignedIDs := make([]uuid.UUID, 0, len(assignments))
	for _, a := range assignments {
		assignedIDs = append(assignedIDs, a.TestCaseID)
	}
	if err := ensureNotDrafts(ctx, t.queries, assignedIDs); err != nil {
		return nil, err
	}

	for _, a := range assignments {
		urgency := newNullUrgency(a.Urgency)
		if err := t.queries.AddTestCaseToPlan(ctx, dbsqlc.AddTestCaseToPlanParams{
			TestPlanID:   planID,
			TestCaseID:   a.TestCaseID,
			AssignedToID: a.AssignedToID,
			Urgency:      urgency,
		}); err != nil {
			return nil, err
		}
		// Keep the urgency consistent across all assignees of the test case
		if urgency.Valid {
			if _, err := t.queries.UpdateTestPlanCaseUrgency(ctx, dbsqlc.UpdateTestPlanCaseUrgencyParams{
				TestPlanID: planID,
				TestCaseID: a.TestCaseID,
				Urgency:    urgency.PriorityLevel,
			}); err != nil {
				return nil, err
			}
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
			assignments = append(assignments, testCaseAssignment{TestCaseID: tcID, AssignedToID: uid, Urgency: pt.Urgency})
		}
	}
	testPlan, err := t.assignTestCases(ctx, request.PlanID, assignments)
	if err != nil || request.AllTestCases == nil {
		return testPlan, err
	}

	if int64(testPlan.ProjectID) != request.ProjectID {
		return nil, ErrTestPlanProjectMismatch
	}
	if err := t.addAllProjectTestCases(ctx, request.PlanID, request.ProjectID, request.AllTestCases, request.PlannedTests); err != nil {
		return nil, err
	}
	return testPlan, nil
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
			assignments = append(assignments, testCaseAssignment{TestCaseID: tcID, AssignedToID: uid, Urgency: request.Urgency})
		}
	}
	return t.assignTestCases(ctx, request.PlanID, assignments)
}

// UpdateTestCaseUrgency implements TestPlanService.
func (t *testPlanService) UpdateTestCaseUrgency(ctx context.Context, testPlanID int64, testCaseID string, urgency string) error {
	tcID, err := uuid.Parse(testCaseID)
	if err != nil {
		return fmt.Errorf("invalid test case id: %w", err)
	}

	affected, err := t.queries.UpdateTestPlanCaseUrgency(ctx, dbsqlc.UpdateTestPlanCaseUrgencyParams{
		TestPlanID: testPlanID,
		TestCaseID: tcID,
		Urgency:    schema.ParsePriorityLevel(urgency),
	})
	if err != nil {
		return fmt.Errorf("failed to update urgency: %w", err)
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
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
		StartAt:         common.FormatNullDateTime(plan.StartAt),
		ClosedAt:        common.FormatNullDateTime(plan.ClosedAt),
		ScheduledEndAt:  common.FormatNullDateTime(plan.ScheduledEndAt),
		NumTestCases:    int32(len(cases)),
		NumFailures:     plan.NumFailures,
		PassedCount:     runStats.PassedCount,
		FailedCount:     runStats.FailedCount,
		PendingCount:    runStats.PendingCount,
		AssignedTesters: runStats.AssignedTestersCount,
		IsComplete:      plan.IsComplete.Bool,
		IsLocked:        plan.IsLocked.Bool,
		HasReport:       plan.HasReport.Bool,
		CreatedAt:       common.FormatNullDateTime(plan.CreatedAt),
		UpdatedAt:       common.FormatNullDateTime(plan.UpdatedAt),
		TestCases:       []schema.TestCaseResponseItem{},
	}

	for _, tc := range cases {
		response.TestCases = append(response.TestCases, schema.TestCaseResponseItem{
			ID:                   tc.ID.String(),
			Code:                 tc.Code,
			Title:                tc.Title,
			Priority:             string(tc.Priority),
			Urgency:              string(tc.Urgency),
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

func (t *testPlanService) ListComments(ctx context.Context, testPlanID int64, limit, offset int32) ([]schema.CommentResponseItem, int64, error) {
	total, err := t.queries.CountRootComments(ctx, testPlanID)
	if err != nil {
		return nil, 0, err
	}

	rows, err := t.queries.ListCommentThreadsPage(ctx, dbsqlc.ListCommentThreadsPageParams{
		TestPlanID: testPlanID,
		PageLimit:  limit,
		PageOffset: offset,
	})
	if err != nil {
		return nil, 0, err
	}

	commentIDs := make([]uuid.UUID, 0, len(rows))
	for _, r := range rows {
		commentIDs = append(commentIDs, r.ID)
	}
	attachmentRows, err := t.queries.ListCommentAttachmentsByComments(ctx, commentIDs)
	if err != nil {
		return nil, 0, err
	}
	attachmentsByComment := make(map[string][]schema.CommentAttachment)
	for _, a := range attachmentRows {
		commentID := a.CommentID.UUID.String()
		attachmentsByComment[commentID] = append(attachmentsByComment[commentID], toCommentAttachment(a))
	}
	reactionsByComment, err := t.reactionsByComment(ctx, commentIDs)
	if err != nil {
		return nil, 0, err
	}

	items := make(map[string]*schema.CommentResponseItem, len(rows))
	childIDs := make(map[string][]string)
	var rootIDs []string

	for _, r := range rows {
		item := &schema.CommentResponseItem{
			ID:          r.ID.String(),
			TestPlanID:  r.TestPlanID,
			UserID:      r.UserID,
			UserName:    r.DisplayName.String,
			Content:     r.Content,
			Attachments: attachmentsByComment[r.ID.String()],
			Reactions:   reactionsByComment[r.ID.String()],
			CreatedAt:   r.CreatedAt.Time.Format(time.RFC3339),
			UpdatedAt:   r.UpdatedAt.Time.Format(time.RFC3339),
		}
		if r.ParentCommentID.Valid {
			parentStr := r.ParentCommentID.UUID.String()
			item.ParentCommentID = &parentStr
			childIDs[parentStr] = append(childIDs[parentStr], item.ID)
		} else {
			rootIDs = append(rootIDs, item.ID)
		}
		items[item.ID] = item
	}

	// Build the tree bottom-up from IDs so replies nested at any depth are kept,
	// regardless of the order the rows come back in
	var build func(id string) schema.CommentResponseItem
	build = func(id string) schema.CommentResponseItem {
		item := *items[id]
		for _, childID := range childIDs[id] {
			item.Replies = append(item.Replies, build(childID))
		}
		return item
	}

	rootComments := make([]schema.CommentResponseItem, 0, len(rootIDs))
	for _, id := range rootIDs {
		rootComments = append(rootComments, build(id))
	}

	return rootComments, total, nil
}

func toCommentAttachment(a dbsqlc.TestPlanCommentAttachment) schema.CommentAttachment {
	return schema.CommentAttachment{
		ID:          a.ID.String(),
		FileName:    a.FileName,
		ContentType: a.ContentType,
		FileSize:    a.FileSize,
		CreatedAt:   a.CreatedAt.Time.Format(time.RFC3339),
	}
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

	if len(req.AttachmentIDs) > 0 {
		attachmentIDs := make([]uuid.UUID, 0, len(req.AttachmentIDs))
		for _, raw := range req.AttachmentIDs {
			attachmentID, err := uuid.Parse(raw)
			if err != nil {
				return nil, fmt.Errorf("invalid attachment ID: %w", err)
			}
			attachmentIDs = append(attachmentIDs, attachmentID)
		}
		// Only unclaimed attachments the author uploaded to this test plan are linked
		if _, err := t.queries.LinkCommentAttachments(ctx, dbsqlc.LinkCommentAttachmentsParams{
			CommentID:     uuid.NullUUID{UUID: row.ID, Valid: true},
			AttachmentIds: attachmentIDs,
			TestPlanID:    req.TestPlanID,
			UploadedByID:  req.UserID,
		}); err != nil {
			return nil, fmt.Errorf("failed to link attachments: %w", err)
		}
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

func (t *testPlanService) UpdateComment(ctx context.Context, req *schema.UpdateComment) (*schema.CommentResponseItem, []string, error) {
	id, err := uuid.Parse(req.CommentID)
	if err != nil {
		return nil, nil, ErrNotFound
	}
	existing, err := t.queries.GetComment(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, ErrNotFound
		}
		return nil, nil, err
	}
	if existing.TestPlanID != req.TestPlanID {
		return nil, nil, ErrNotFound
	}
	if existing.UserID != req.UserID {
		return nil, nil, ErrForbidden
	}

	keepIDs := make([]uuid.UUID, 0, len(req.AttachmentIDs))
	for _, raw := range req.AttachmentIDs {
		attachmentID, err := uuid.Parse(raw)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid attachment ID: %w", err)
		}
		keepIDs = append(keepIDs, attachmentID)
	}

	if _, err := t.queries.UpdateCommentContent(ctx, dbsqlc.UpdateCommentContentParams{
		ID:      id,
		Content: req.Content,
	}); err != nil {
		return nil, nil, err
	}

	commentRef := uuid.NullUUID{UUID: id, Valid: true}
	if len(keepIDs) > 0 {
		// Only unclaimed attachments the author uploaded to this test plan are linked,
		// the ones already on the comment are left as they are
		if _, err := t.queries.LinkCommentAttachments(ctx, dbsqlc.LinkCommentAttachmentsParams{
			CommentID:     commentRef,
			AttachmentIds: keepIDs,
			TestPlanID:    req.TestPlanID,
			UploadedByID:  req.UserID,
		}); err != nil {
			return nil, nil, fmt.Errorf("failed to link attachments: %w", err)
		}
	}
	removedPaths, err := t.queries.DeleteCommentAttachmentsExcept(ctx, dbsqlc.DeleteCommentAttachmentsExceptParams{
		CommentID: commentRef,
		KeepIds:   keepIDs,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to remove attachments: %w", err)
	}

	row, err := t.queries.GetComment(ctx, id)
	if err != nil {
		return nil, removedPaths, err
	}
	attachmentRows, err := t.queries.ListCommentAttachmentsByComments(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, removedPaths, err
	}
	attachments := make([]schema.CommentAttachment, 0, len(attachmentRows))
	for _, a := range attachmentRows {
		attachments = append(attachments, toCommentAttachment(a))
	}

	reactions, err := t.reactionsByComment(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, removedPaths, err
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
		UserName:        row.DisplayName.String,
		Content:         row.Content,
		Attachments:     attachments,
		Reactions:       reactions[id.String()],
		CreatedAt:       row.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:       row.UpdatedAt.Time.Format(time.RFC3339),
	}, removedPaths, nil
}

// reactionsByComment loads the reactions of the given comments, oldest first, keyed by comment ID
func (t *testPlanService) reactionsByComment(ctx context.Context, commentIDs []uuid.UUID) (map[string][]schema.CommentReaction, error) {
	rows, err := t.queries.ListCommentReactionsByComments(ctx, commentIDs)
	if err != nil {
		return nil, err
	}
	byComment := make(map[string][]schema.CommentReaction)
	for _, r := range rows {
		commentID := r.CommentID.String()
		byComment[commentID] = append(byComment[commentID], schema.CommentReaction{
			Emoji:    r.Emoji,
			UserID:   r.UserID,
			UserName: r.DisplayName.String,
		})
	}
	return byComment, nil
}

// commentOnPlan parses a comment ID and checks the comment belongs to the test plan
func (t *testPlanService) commentOnPlan(ctx context.Context, testPlanID int64, commentID string) (uuid.UUID, error) {
	id, err := uuid.Parse(commentID)
	if err != nil {
		return uuid.Nil, ErrNotFound
	}
	comment, err := t.queries.GetComment(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return uuid.Nil, ErrNotFound
		}
		return uuid.Nil, err
	}
	if comment.TestPlanID != testPlanID {
		return uuid.Nil, ErrNotFound
	}
	return id, nil
}

// isEmoji is a loose check that a reaction is an emoji rather than text: it must be short, have
// no spaces, control characters or ASCII letters, and include a character outside ASCII
// (keycap emoji such as 1️⃣ start with an ASCII digit)
func isEmoji(s string) bool {
	if s == "" || utf8.RuneCountInString(s) > 16 {
		return false
	}
	hasNonASCII := false
	for _, r := range s {
		if unicode.IsSpace(r) || unicode.IsControl(r) || (r < utf8.RuneSelf && unicode.IsLetter(r)) {
			return false
		}
		if r >= utf8.RuneSelf {
			hasNonASCII = true
		}
	}
	return hasNonASCII
}

func (t *testPlanService) SetCommentReaction(ctx context.Context, testPlanID int64, commentID string, userID int64, emoji string) ([]schema.CommentReaction, error) {
	if !isEmoji(emoji) {
		return nil, ErrInvalidReaction
	}
	id, err := t.commentOnPlan(ctx, testPlanID, commentID)
	if err != nil {
		return nil, err
	}
	if err := t.queries.SetCommentReaction(ctx, dbsqlc.SetCommentReactionParams{
		CommentID: id,
		UserID:    userID,
		Emoji:     emoji,
	}); err != nil {
		return nil, err
	}
	reactions, err := t.reactionsByComment(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}
	return reactions[id.String()], nil
}

func (t *testPlanService) RemoveCommentReaction(ctx context.Context, testPlanID int64, commentID string, userID int64) ([]schema.CommentReaction, error) {
	id, err := t.commentOnPlan(ctx, testPlanID, commentID)
	if err != nil {
		return nil, err
	}
	if _, err := t.queries.DeleteCommentReaction(ctx, dbsqlc.DeleteCommentReactionParams{
		CommentID: id,
		UserID:    userID,
	}); err != nil {
		return nil, err
	}
	reactions, err := t.reactionsByComment(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}
	return reactions[id.String()], nil
}

func (t *testPlanService) DeleteComment(ctx context.Context, commentID string) ([]string, error) {
	id, err := uuid.Parse(commentID)
	if err != nil {
		return nil, err
	}
	// Collect file paths first, the attachment rows are removed by the cascading delete
	paths, err := t.queries.ListCommentThreadAttachmentPaths(ctx, id)
	if err != nil {
		return nil, err
	}
	if _, err = t.queries.DeleteComment(ctx, id); err != nil {
		return nil, err
	}
	return paths, nil
}

func (t *testPlanService) CreateCommentAttachment(ctx context.Context, params dbsqlc.CreateCommentAttachmentParams) (*schema.CommentAttachment, error) {
	row, err := t.queries.CreateCommentAttachment(ctx, params)
	if err != nil {
		return nil, err
	}
	attachment := toCommentAttachment(row)
	return &attachment, nil
}

func (t *testPlanService) GetCommentAttachment(ctx context.Context, attachmentID string) (*dbsqlc.TestPlanCommentAttachment, error) {
	id, err := uuid.Parse(attachmentID)
	if err != nil {
		return nil, ErrNotFound
	}
	row, err := t.queries.GetCommentAttachment(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &row, nil
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
func (t *testPlanService) UpdateDetails(ctx context.Context, request schema.UpdateTestPlanDetails) error {
	plan, err := t.queries.GetTestPlan(ctx, request.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("failed to load test plan: %w", err)
	}

	params := dbsqlc.UpdateTestPlanDetailsParams{
		ID:             request.ID,
		Kind:           plan.Kind,
		Description:    plan.Description,
		EnvironmentID:  plan.EnvironmentID,
		StartAt:        plan.StartAt,
		ScheduledEndAt: plan.ScheduledEndAt,
		UpdatedByID:    int32(request.UpdatedByID),
	}
	if request.Kind != nil {
		params.Kind = dbsqlc.TestKind(*request.Kind)
	}
	if request.Description != nil {
		params.Description = common.NullString(*request.Description)
	}
	if request.EnvironmentID != nil {
		params.EnvironmentID = common.NewNullInt32(int32(*request.EnvironmentID))
	}
	if request.StartAt != nil {
		params.StartAt = common.NullTime(*request.StartAt)
	}
	if request.ScheduledEndAt != nil {
		params.ScheduledEndAt = common.NullTime(*request.ScheduledEndAt)
	}

	if _, err := t.queries.UpdateTestPlanDetails(ctx, params); err != nil {
		return fmt.Errorf("failed to update test plan: %w", err)
	}
	return nil
}
