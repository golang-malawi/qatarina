package test

import (
	"context"
	"testing"

	"github.com/golang-malawi/qatarina/internal/schema"
)

func (f freezeFixture) ownerProgress(t *testing.T, planID int64) schema.TesterProgress {
	t.Helper()
	progress, err := f.plans.TesterProgress(context.Background(), planID)
	if err != nil {
		t.Fatalf("tester progress: %v", err)
	}
	for _, p := range progress {
		if p.TesterID == f.ownerID {
			return p
		}
	}
	t.Fatalf("no progress for tester %d in %+v", f.ownerID, progress)
	return schema.TesterProgress{}
}

func TestTestPlans_TesterProgress(t *testing.T) {
	f, _ := newCloseFixture(t)

	first, second, third := f.newTestCase(t, ""), f.newTestCase(t, ""), f.newTestCase(t, "")
	plan, err := f.createPlan(first, second, third)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	// Assigned but never tested: every case is outstanding
	got := f.ownerProgress(t, plan.ID)
	want := schema.TesterProgress{TesterID: f.ownerID, TesterName: got.TesterName, AssignedCount: 3}
	if got != want {
		t.Fatalf("before any run: got %+v, want %+v", got, want)
	}

	// Recording the same case twice counts it once
	run1, err := f.createRun(plan.ID, first)
	if err != nil {
		t.Fatalf("create first run: %v", err)
	}
	if err := f.commitRun(run1.ID.String(), false); err != nil {
		t.Fatalf("commit first run: %v", err)
	}
	run2, err := f.createRun(plan.ID, first)
	if err != nil {
		t.Fatalf("create second run: %v", err)
	}
	if err := f.commitRun(run2.ID.String(), false); err != nil {
		t.Fatalf("commit second run: %v", err)
	}

	got = f.ownerProgress(t, plan.ID)
	want.TestedCount, want.AwaitingReview = 1, 1
	if got != want {
		t.Fatalf("after recording one case twice: got %+v, want %+v", got, want)
	}

	// The owner closing one of the recordings marks the case reviewed
	if err := f.commitRun(run2.ID.String(), true); err != nil {
		t.Fatalf("close run: %v", err)
	}

	got = f.ownerProgress(t, plan.ID)
	want.AwaitingReview, want.ReviewedCount = 0, 1
	if got != want {
		t.Fatalf("after closing a run: got %+v, want %+v", got, want)
	}
}

func TestTestPlans_AssignedTestersCountsTestersWhoHaveNotStarted(t *testing.T) {
	f, _ := newCloseFixture(t)

	plan, err := f.createPlan(f.newTestCase(t, ""), f.newTestCase(t, ""))
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	got, err := f.plans.GetOneTestPlan(context.Background(), plan.ID)
	if err != nil {
		t.Fatalf("get plan: %v", err)
	}
	if got.AssignedTesters != 1 {
		t.Fatalf("assigned testers before any run = %d, want 1", got.AssignedTesters)
	}
}
