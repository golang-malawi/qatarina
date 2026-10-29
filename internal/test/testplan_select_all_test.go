package test

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/google/uuid"
)

type selectAllFixture struct {
	svc             services.TestPlanService
	projectID       int64
	otherProjectID  int64
	tester1         int64
	tester2         int64
	login, checkout string // test cases in the project
	search          string // test case only matched by search "Search"
	suggested       string // suggested test cases are not part of the project list
	otherProject    string // test case in another project
}

// newSelectAllFixture creates two testers, two projects and their test cases,
// removed again when the test ends
func newSelectAllFixture(t *testing.T, db *sql.DB) selectAllFixture {
	t.Helper()

	var userIDs, projectIDs []int64
	var testCaseIDs []string
	// Registered first so fixtures are removed even when creating a later one fails.
	// Test plans and their test cases are removed with the projects/test cases (ON DELETE CASCADE)
	t.Cleanup(func() {
		db.Exec(`DELETE FROM test_plans WHERE project_id = ANY($1::int[])`, pqIntArray(projectIDs...))
		for _, id := range testCaseIDs {
			db.Exec(`DELETE FROM test_cases WHERE id = $1`, id)
		}
		db.Exec(`DELETE FROM projects WHERE id = ANY($1::int[])`, pqIntArray(projectIDs...))
		db.Exec(`DELETE FROM users WHERE id = ANY($1::int[])`, pqIntArray(userIDs...))
	})

	newUser := func() int64 {
		signUp, err := newAuthService(t, db).SignUp(&schema.SignUpRequest{
			FirstName:   "Select",
			LastName:    "All",
			DisplayName: "Select All Tester",
			Email:       uniqueEmail("select-all"),
			Password:    "s3cret-pass",
		})
		if err != nil {
			t.Fatalf("SignUp failed: %v", err)
		}
		userIDs = append(userIDs, int64(signUp.UserID))
		return int64(signUp.UserID)
	}
	tester1, tester2 := newUser(), newUser()

	newProject := func(title string) int64 {
		var id int64
		err := db.QueryRow(
			`INSERT INTO projects (title, description, owner_user_id, created_at, updated_at)
			 VALUES ($1, 'select all fixture', $2, NOW(), NOW()) RETURNING id`,
			title, tester1,
		).Scan(&id)
		if err != nil {
			t.Fatalf("failed to insert project: %v", err)
		}
		projectIDs = append(projectIDs, id)
		return id
	}
	projectID, otherProjectID := newProject("Select all project"), newProject("Other project")

	newTestCase := func(projectID int64, title string, suggested bool) string {
		id, _ := uuid.NewV7()
		_, err := db.Exec(
			`INSERT INTO test_cases (id, kind, code, title, description, project_id, suggested, created_by_id, created_at, updated_at)
			 VALUES ($1, 'general', $2, $3, 'select all fixture', $4, $5, $6, NOW(), NOW())`,
			id, "SEL-"+id.String()[24:], title, projectID, suggested, tester1,
		)
		if err != nil {
			t.Fatalf("failed to insert test case: %v", err)
		}
		testCaseIDs = append(testCaseIDs, id.String())
		return id.String()
	}

	f := selectAllFixture{
		svc:            services.NewTestPlanService(dbsqlc.New(db), logging.NewForTest()),
		projectID:      projectID,
		otherProjectID: otherProjectID,
		tester1:        tester1,
		tester2:        tester2,
		login:          newTestCase(projectID, "Login", false),
		checkout:       newTestCase(projectID, "Checkout", false),
		search:         newTestCase(projectID, "Search products", false),
		suggested:      newTestCase(projectID, "Suggested case", true),
		otherProject:   newTestCase(otherProjectID, "Other project case", false),
	}

	return f
}

func pqIntArray(ids ...int64) string {
	parts := make([]string, len(ids))
	for i, id := range ids {
		parts[i] = strconv.FormatInt(id, 10)
	}
	return "{" + strings.Join(parts, ",") + "}"
}

func (f selectAllFixture) createPlan(t *testing.T, ctx context.Context, request schema.CreateTestPlan) int64 {
	t.Helper()
	request.ProjectID = f.projectID
	request.Kind = "general"
	request.Description = "select all plan"
	request.StartAt = time.Now()
	request.ScheduledEndAt = time.Now().Add(24 * time.Hour)
	request.CreatedByID, request.AssignedToID, request.UpdatedByID = f.tester1, f.tester1, f.tester1

	plan, err := f.svc.Create(ctx, &request)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	return plan.ID
}

// planAssignments returns test case ID -> assigned tester IDs for the plan
func planAssignments(t *testing.T, db *sql.DB, planID int64) map[string][]int64 {
	t.Helper()
	rows, err := db.Query(
		`SELECT test_case_id, assigned_to_id FROM test_plan_cases WHERE test_plan_id = $1 ORDER BY assigned_to_id`,
		planID,
	)
	if err != nil {
		t.Fatalf("failed to list plan test cases: %v", err)
	}
	defer rows.Close()

	assignments := map[string][]int64{}
	for rows.Next() {
		var tcID string
		var userID int64
		if err := rows.Scan(&tcID, &userID); err != nil {
			t.Fatalf("scan failed: %v", err)
		}
		assignments[tcID] = append(assignments[tcID], userID)
	}
	return assignments
}

func assertTesters(t *testing.T, assignments map[string][]int64, testCaseID string, want ...int64) {
	t.Helper()
	got := assignments[testCaseID]
	if len(got) != len(want) {
		t.Errorf("test case %s: expected testers %v, got %v", testCaseID, want, got)
		return
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("test case %s: expected testers %v, got %v", testCaseID, want, got)
			return
		}
	}
}

func TestCreateTestPlan_AllTestCases(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	ctx := context.Background()

	planID := f.createPlan(t, ctx, schema.CreateTestPlan{
		// Explicit testers for checkout win over the "all test cases" testers
		PlannedTests: []schema.TestCaseAssignment{{TestCaseID: f.checkout, UserIDs: []int64{f.tester2}}},
		AllTestCases: &schema.ProjectTestCaseSelection{
			UserIDs:             []int64{f.tester1, f.tester2},
			ExcludedTestCaseIDs: []string{f.search},
		},
	})

	assignments := planAssignments(t, db, planID)
	if len(assignments) != 2 {
		t.Errorf("expected 2 test cases in the plan, got %d: %v", len(assignments), assignments)
	}
	assertTesters(t, assignments, f.login, f.tester1, f.tester2)
	assertTesters(t, assignments, f.checkout, f.tester2)
	assertTesters(t, assignments, f.search)       // excluded
	assertTesters(t, assignments, f.suggested)    // suggested test cases are not listed in the project
	assertTesters(t, assignments, f.otherProject) // another project
}

func TestAddTestCaseToPlan_AllTestCasesWithSearch(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	ctx := context.Background()

	planID := f.createPlan(t, ctx, schema.CreateTestPlan{})

	_, err := f.svc.AddTestCaseToPlan(ctx, &schema.AssignTestsToPlanRequest{
		ProjectID:    f.projectID,
		PlanID:       planID,
		AllTestCases: &schema.ProjectTestCaseSelection{UserIDs: []int64{f.tester1}, Search: "search"},
	})
	if err != nil {
		t.Fatalf("AddTestCaseToPlan failed: %v", err)
	}

	// Assigning again is a no-op rather than an error
	_, err = f.svc.AddTestCaseToPlan(ctx, &schema.AssignTestsToPlanRequest{
		ProjectID:    f.projectID,
		PlanID:       planID,
		AllTestCases: &schema.ProjectTestCaseSelection{UserIDs: []int64{f.tester1}, Search: "search"},
	})
	if err != nil {
		t.Fatalf("repeated AddTestCaseToPlan failed: %v", err)
	}

	assignments := planAssignments(t, db, planID)
	if len(assignments) != 1 {
		t.Errorf("expected only the test case matching the search, got %v", assignments)
	}
	assertTesters(t, assignments, f.search, f.tester1)
}

func TestAddTestCaseToPlan_AllTestCasesRejectsOtherProject(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	ctx := context.Background()

	planID := f.createPlan(t, ctx, schema.CreateTestPlan{})

	_, err := f.svc.AddTestCaseToPlan(ctx, &schema.AssignTestsToPlanRequest{
		ProjectID:    f.otherProjectID,
		PlanID:       planID,
		AllTestCases: &schema.ProjectTestCaseSelection{UserIDs: []int64{f.tester1}},
	})
	if !errors.Is(err, services.ErrTestPlanProjectMismatch) {
		t.Fatalf("expected ErrTestPlanProjectMismatch, got %v", err)
	}
	if assignments := planAssignments(t, db, planID); len(assignments) != 0 {
		t.Errorf("expected no test cases to be added, got %v", assignments)
	}
}
