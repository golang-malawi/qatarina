package test

import (
	"context"
	"testing"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestInbox_OneRowPerTestPlanAndClosedPlansAreHistory(t *testing.T) {
	f, _ := newCloseFixture(t)
	ctx := context.Background()
	svc := services.NewTestCaseService(f.db, dbsqlc.New(f.db), logging.NewForTest())

	// the same test case assigned to the same tester in two test plans
	testCase := f.newTestCase(t, "")
	older, err := f.createPlan(testCase)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}
	newer, err := f.createPlan(testCase)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	list := func(includeClosed bool) ([]schema.AssignedTestCase, int64) {
		t.Helper()
		rows, total, err := svc.FindAllAssignedToUser(ctx, &schema.InboxFilterParams{
			UserID: f.ownerID, PageSize: 50, IncludeClosed: includeClosed,
		})
		if err != nil {
			t.Fatalf("FindAllAssignedToUser: %v", err)
		}
		return rows, total
	}
	unseen := func() int64 {
		t.Helper()
		n, err := svc.CountUnseenAssignedToUser(ctx, f.ownerID)
		if err != nil {
			t.Fatalf("CountUnseenAssignedToUser: %v", err)
		}
		return n
	}

	rows, total := list(false)
	if len(rows) != 2 || total != 2 {
		t.Fatalf("inbox with the test case in two plans: %d rows, total %d, want 2 and 2", len(rows), total)
	}
	// newest test plan first
	if int64(rows[0].TestPlanID) != newer.ID || int64(rows[1].TestPlanID) != older.ID {
		t.Errorf("inbox plans = %d, %d, want %d, %d", rows[0].TestPlanID, rows[1].TestPlanID, newer.ID, older.ID)
	}
	if n := unseen(); n != 2 {
		t.Errorf("unseen = %d, want 2", n)
	}

	// viewing the test case in one plan leaves it unseen in the other
	if err := svc.MarkAssignedAsViewed(ctx, f.ownerID, testCase, older.ID); err != nil {
		t.Fatalf("MarkAssignedAsViewed: %v", err)
	}
	if n := unseen(); n != 1 {
		t.Errorf("unseen after viewing one plan = %d, want 1", n)
	}

	if _, err := f.plans.CloseTestPlan(ctx, int32(older.ID)); err != nil {
		t.Fatalf("close plan: %v", err)
	}

	// a closed plan's test cases leave the inbox...
	rows, total = list(false)
	if len(rows) != 1 || total != 1 || int64(rows[0].TestPlanID) != newer.ID {
		t.Fatalf("inbox after closing a plan: %d rows, total %d, want only plan %d", len(rows), total, newer.ID)
	}
	// ...and show up as history
	rows, total = list(true)
	if len(rows) != 2 || total != 2 {
		t.Fatalf("inbox history: %d rows, total %d, want 2 and 2", len(rows), total)
	}
	for _, row := range rows {
		wantClosed := int64(row.TestPlanID) == older.ID
		if row.IsTestPlanClosed != wantClosed {
			t.Errorf("plan %d: is_test_plan_closed = %v, want %v", row.TestPlanID, row.IsTestPlanClosed, wantClosed)
		}
		if row.TestPlanName == "" {
			t.Errorf("plan %d: missing test plan name", row.TestPlanID)
		}
	}

	// without a plan, a link opens the open assignment
	got, err := svc.FindAssignedToUserByID(ctx, f.ownerID, testCase, 0)
	if err != nil {
		t.Fatalf("FindAssignedToUserByID: %v", err)
	}
	if int64(got.TestPlanID) != newer.ID || got.IsTestPlanClosed {
		t.Errorf("link without a plan opened plan %d (closed %v), want open plan %d", got.TestPlanID, got.IsTestPlanClosed, newer.ID)
	}
	// with the closed plan, it opens that assignment, marked closed so it is read only
	got, err = svc.FindAssignedToUserByID(ctx, f.ownerID, testCase, older.ID)
	if err != nil {
		t.Fatalf("FindAssignedToUserByID: %v", err)
	}
	if int64(got.TestPlanID) != older.ID || !got.IsTestPlanClosed {
		t.Errorf("closed plan link opened plan %d (closed %v), want closed plan %d", got.TestPlanID, got.IsTestPlanClosed, older.ID)
	}

	// navigation from the closed assignment still works, and follows the inbox filter
	nav, err := svc.FindInboxNavigation(ctx, f.ownerID, testCase, older.ID, false)
	if err != nil {
		t.Fatalf("FindInboxNavigation: %v", err)
	}
	if nav.Total != 2 || nav.Position != 2 || nav.PreviousID != testCase || nav.PreviousTestPlanID != newer.ID || nav.NextID != "" {
		t.Errorf("navigation from the closed plan = %+v, want position 2 of 2 after plan %d", nav, newer.ID)
	}

	// reopening the plan brings its test cases back
	if err := f.plans.ReopenTestPlan(ctx, older.ID, f.ownerID); err != nil {
		t.Fatalf("reopen plan: %v", err)
	}
	if rows, total = list(false); len(rows) != 2 || total != 2 {
		t.Errorf("inbox after reopening: %d rows, total %d, want 2 and 2", len(rows), total)
	}
}
