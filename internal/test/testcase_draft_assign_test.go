package test

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

// newDraftTestCase adds a draft test case to the fixture project
func (f freezeFixture) newDraftTestCase(t *testing.T) string {
	t.Helper()
	id := f.newTestCase(t, "")
	if _, err := f.db.Exec(`UPDATE test_cases SET is_draft = true WHERE id = $1`, id); err != nil {
		t.Fatalf("failed to mark test case as draft: %v", err)
	}
	return id
}

func (f freezeFixture) testCaseCode(t *testing.T, id string) string {
	t.Helper()
	var code string
	if err := f.db.QueryRow(`SELECT code FROM test_cases WHERE id = $1`, id).Scan(&code); err != nil {
		t.Fatalf("failed to look up test case code: %v", err)
	}
	return code
}

func (f freezeFixture) countPlanCases(t *testing.T, planID int64, testCaseID string) int {
	t.Helper()
	var n int
	if err := f.db.QueryRow(`SELECT COUNT(*) FROM test_plan_cases WHERE test_plan_id = $1 AND test_case_id = $2`, planID, testCaseID).Scan(&n); err != nil {
		t.Fatalf("failed to count plan cases: %v", err)
	}
	return n
}

func TestTestCases_DraftsCannotBeAssignedToTesters(t *testing.T) {
	f := newFreezeFixture(t)
	ctx := context.Background()

	published := f.newTestCase(t, "")
	draft := f.newDraftTestCase(t)

	// a rejected plan is not created at all
	_, err := f.createPlan(published, draft)
	if !errors.Is(err, services.ErrTestCaseDraft) {
		t.Fatalf("create plan with a draft: err = %v, want ErrTestCaseDraft", err)
	}
	if code := f.testCaseCode(t, draft); !strings.Contains(err.Error(), code) {
		t.Errorf("error %q does not name the draft %s", err, code)
	}
	var plans int
	if err := f.db.QueryRow(`SELECT COUNT(*) FROM test_plans WHERE project_id = $1`, f.projectID).Scan(&plans); err != nil {
		t.Fatalf("failed to count plans: %v", err)
	}
	if plans != 0 {
		t.Errorf("rejected plan left %d plan(s) behind", plans)
	}

	plan, err := f.createPlan(published)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	if err := f.assign(plan.ID, published, draft); !errors.Is(err, services.ErrTestCaseDraft) {
		t.Errorf("bulk assign with a draft: err = %v, want ErrTestCaseDraft", err)
	}
	if n := f.countPlanCases(t, plan.ID, draft); n != 0 {
		t.Errorf("draft was added to the plan %d time(s)", n)
	}

	// "select all" with the draft included is rejected without changing the plan
	selectAll := func(excluded ...string) error {
		_, err := f.plans.AddTestCaseToPlan(ctx, &schema.AssignTestsToPlanRequest{
			ProjectID: int64(f.projectID),
			PlanID:    plan.ID,
			AllTestCases: &schema.ProjectTestCaseSelection{
				UserIDs:             []int64{f.ownerID},
				ExcludedTestCaseIDs: excluded,
			},
		})
		return err
	}
	if err := selectAll(); !errors.Is(err, services.ErrTestCaseDraft) {
		t.Errorf("select all including a draft: err = %v, want ErrTestCaseDraft", err)
	}
	if n := f.countPlanCases(t, plan.ID, draft); n != 0 {
		t.Errorf("draft was added to the plan %d time(s) by select all", n)
	}
	if err := selectAll(draft); err != nil {
		t.Errorf("select all with the draft excluded: unexpected error %v", err)
	}

	if _, err := f.runs.Create(ctx, &schema.TestRunRequest{
		ProjectID:  f.projectID,
		TestCaseID: draft,
		OwnerID:    int32(f.ownerID),
		Code:       "DRAFT-RUN",
	}); !errors.Is(err, services.ErrTestCaseDraft) {
		t.Errorf("create test run for a draft: err = %v, want ErrTestCaseDraft", err)
	}

	// once published, the test case can be assigned
	if _, err := f.db.Exec(`UPDATE test_cases SET is_draft = false WHERE id = $1`, draft); err != nil {
		t.Fatalf("failed to publish draft: %v", err)
	}
	if err := f.assign(plan.ID, draft); err != nil {
		t.Errorf("assign published test case: unexpected error %v", err)
	}
}
