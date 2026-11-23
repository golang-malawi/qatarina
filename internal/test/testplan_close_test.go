package test

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

// newCloseFixture extends the freeze fixture with a report service, removing test runs
// and reports (with their files) of the project when the test ends
func newCloseFixture(t *testing.T) (freezeFixture, services.ReportService) {
	t.Helper()
	f := newFreezeFixture(t)
	reports := services.NewReportService(f.db, dbsqlc.New(f.db), logging.NewForTest(), f.reportDir)

	// registered after the freeze fixture, so it runs before the plans and test cases are removed
	t.Cleanup(func() {
		rows, err := f.db.Query(`SELECT file_path FROM reports WHERE project_id = $1 AND file_path IS NOT NULL`, f.projectID)
		if err == nil {
			for rows.Next() {
				var path string
				if rows.Scan(&path) == nil {
					os.Remove(path)
				}
			}
			rows.Close()
		}
		os.Remove("storage/reports") // only removed when empty
		f.db.Exec(`DELETE FROM reports WHERE project_id = $1`, f.projectID)
		f.db.Exec(`DELETE FROM test_run_results WHERE test_run_id IN (SELECT id FROM test_runs WHERE project_id = $1)`, f.projectID)
		f.db.Exec(`DELETE FROM test_runs WHERE project_id = $1`, f.projectID)
	})
	return f, reports
}

func (f freezeFixture) createRun(planID int64, testCaseID string) (*dbsqlc.TestRun, error) {
	return f.runs.Create(context.Background(), &schema.TestRunRequest{
		ProjectID:  f.projectID,
		TestPlanID: int32(planID),
		TestCaseID: testCaseID,
		OwnerID:    int32(f.ownerID),
		TestedByID: int32(f.ownerID),
		Code:       "CLOSE-RUN",
	})
}

func (f freezeFixture) commitRun(runID string, closed bool) error {
	_, err := f.runs.Commit(context.Background(), &schema.CommitTestRunResult{
		UserID:       f.ownerID,
		TestRunID:    runID,
		IsClosed:     closed,
		TestedOn:     time.Now(),
		ActualResult: "works",
		State:        dbsqlc.TestRunStatePassed,
	})
	return err
}

func TestTestPlans_ClosingLocksPlanAndLinksReport(t *testing.T) {
	f, reports := newCloseFixture(t)
	ctx := context.Background()

	testCase := f.newTestCase(t, "")
	plan, err := f.createPlan(testCase)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}
	run, err := f.createRun(plan.ID, testCase)
	if err != nil {
		t.Fatalf("create test run: %v", err)
	}

	if _, err := reports.Create(ctx, &schema.CreateReportRequest{
		ProjectID: int64(f.projectID), TestPlanID: plan.ID, Name: "early", Type: "Summary", Status: "Completed",
	}); !errors.Is(err, services.ErrTestPlanNotClosed) {
		t.Errorf("report for an open plan: err = %v, want ErrTestPlanNotClosed", err)
	}

	// the error says which test runs stop the plan from closing, and why
	code := f.testCaseCode(t, testCase)
	_, err = f.plans.CloseTestPlan(ctx, int32(plan.ID))
	if !errors.Is(err, services.ErrTestPlanHasPendingRuns) {
		t.Fatalf("close with a pending run: err = %v, want ErrTestPlanHasPendingRuns", err)
	}
	if msg := err.Error(); !strings.Contains(msg, code) || !strings.Contains(msg, "waiting for a result") {
		t.Errorf("close with a pending run: error %q does not name %s as waiting for a result", msg, code)
	}
	if err := f.commitRun(run.ID.String(), false); err != nil {
		t.Fatalf("commit test run: %v", err)
	}
	_, err = f.plans.CloseTestPlan(ctx, int32(plan.ID))
	if !errors.Is(err, services.ErrTestPlanHasPendingRuns) {
		t.Fatalf("close with a run that was not closed: err = %v, want ErrTestPlanHasPendingRuns", err)
	}
	if msg := err.Error(); !strings.Contains(msg, code) || !strings.Contains(msg, "not closed") {
		t.Errorf("close with a run that was not closed: error %q does not name %s as not closed", msg, code)
	}
	if err := f.commitRun(run.ID.String(), true); err != nil {
		t.Fatalf("commit test run: %v", err)
	}

	report, err := f.plans.CloseTestPlan(ctx, int32(plan.ID))
	if err != nil {
		t.Fatalf("close plan: %v", err)
	}
	if report.TestPlanID != (sql.NullInt64{Int64: plan.ID, Valid: true}) {
		t.Errorf("report test plan = %+v, want %d", report.TestPlanID, plan.ID)
	}
	if _, err := os.Stat(report.FilePath.String); err != nil {
		t.Errorf("report file %q: %v", report.FilePath.String, err)
	}

	closed, err := f.plans.GetOneTestPlan(ctx, plan.ID)
	if err != nil {
		t.Fatalf("get plan: %v", err)
	}
	if !closed.IsComplete || !closed.IsLocked || !closed.HasReport || closed.ReportID != report.ID.String() {
		t.Errorf("closed plan: complete=%v locked=%v has_report=%v report_id=%q, want true/true/true/%s",
			closed.IsComplete, closed.IsLocked, closed.HasReport, closed.ReportID, report.ID)
	}

	if _, err := f.plans.CloseTestPlan(ctx, int32(plan.ID)); !errors.Is(err, services.ErrTestPlanAlreadyClosed) {
		t.Errorf("close twice: err = %v, want ErrTestPlanAlreadyClosed", err)
	}

	// a locked plan rejects new assignments, runs and result changes
	if err := f.assign(plan.ID, f.newTestCase(t, "")); !errors.Is(err, services.ErrTestPlanLocked) {
		t.Errorf("assign to locked plan: err = %v, want ErrTestPlanLocked", err)
	}
	if err := f.plans.UpdateTestCaseUrgency(ctx, plan.ID, testCase, "high"); !errors.Is(err, services.ErrTestPlanLocked) {
		t.Errorf("change urgency in locked plan: err = %v, want ErrTestPlanLocked", err)
	}
	if _, err := f.createRun(plan.ID, testCase); !errors.Is(err, services.ErrTestPlanLocked) {
		t.Errorf("create test run in locked plan: err = %v, want ErrTestPlanLocked", err)
	}
	if err := f.commitRun(run.ID.String(), true); !errors.Is(err, services.ErrTestPlanLocked) {
		t.Errorf("commit result in locked plan: err = %v, want ErrTestPlanLocked", err)
	}
	if err := f.runs.DeleteByID(ctx, run.ID.String()); !errors.Is(err, services.ErrTestPlanLocked) {
		t.Errorf("delete test run in locked plan: err = %v, want ErrTestPlanLocked", err)
	}

	// only the plan creator, the project owner or a super admin can reopen it
	stranger, err := newAuthService(t, f.db).SignUp(&schema.SignUpRequest{
		FirstName: "Plan", LastName: "Stranger", DisplayName: "Plan Stranger",
		Email: uniqueEmail("reopen"), Password: "s3cret-pass",
	})
	if err != nil {
		t.Fatalf("SignUp failed: %v", err)
	}
	t.Cleanup(func() { f.db.Exec(`DELETE FROM users WHERE id = $1`, stranger.UserID) })
	if err := f.plans.ReopenTestPlan(ctx, plan.ID, int64(stranger.UserID)); !errors.Is(err, services.ErrTestPlanReopenForbidden) {
		t.Errorf("reopen by another user: err = %v, want ErrTestPlanReopenForbidden", err)
	}

	if err := f.plans.ReopenTestPlan(ctx, plan.ID, f.ownerID); err != nil {
		t.Fatalf("reopen by owner: %v", err)
	}
	reopened, err := f.plans.GetOneTestPlan(ctx, plan.ID)
	if err != nil {
		t.Fatalf("get plan: %v", err)
	}
	if reopened.IsComplete || reopened.IsLocked || reopened.ClosedAt != "" || !reopened.HasReport {
		t.Errorf("reopened plan: complete=%v locked=%v closed_at=%q has_report=%v, want false/false/\"\"/true",
			reopened.IsComplete, reopened.IsLocked, reopened.ClosedAt, reopened.HasReport)
	}
	if err := f.plans.ReopenTestPlan(ctx, plan.ID, f.ownerID); !errors.Is(err, services.ErrTestPlanNotClosedYet) {
		t.Errorf("reopen an open plan: err = %v, want ErrTestPlanNotClosedYet", err)
	}
	if err := f.assign(plan.ID, testCase); err != nil {
		t.Errorf("assign after reopening: unexpected error %v", err)
	}

	// deleting the only report clears has_report
	if err := reports.DeleteByID(ctx, report.ID.String()); err != nil {
		t.Fatalf("delete report: %v", err)
	}
	afterDelete, err := f.plans.GetOneTestPlan(ctx, plan.ID)
	if err != nil {
		t.Fatalf("get plan: %v", err)
	}
	if afterDelete.HasReport || afterDelete.ReportID != "" {
		t.Errorf("after deleting its report: has_report=%v report_id=%q, want false and empty", afterDelete.HasReport, afterDelete.ReportID)
	}
}

func TestTestPlans_ClosingTwiceAtOnceMakesOneReport(t *testing.T) {
	f, _ := newCloseFixture(t)
	ctx := context.Background()

	plan, err := f.createPlan(f.newTestCase(t, ""))
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	const attempts = 5
	errs := make(chan error, attempts)
	start := make(chan struct{})
	for range attempts {
		go func() {
			<-start
			_, err := f.plans.CloseTestPlan(ctx, int32(plan.ID))
			errs <- err
		}()
	}
	close(start)

	closed := 0
	for range attempts {
		err := <-errs
		switch {
		case err == nil:
			closed++
		case !errors.Is(err, services.ErrTestPlanAlreadyClosed):
			t.Errorf("concurrent close: err = %v, want nil or ErrTestPlanAlreadyClosed", err)
		}
	}
	if closed != 1 {
		t.Errorf("%d requests closed the plan, want 1", closed)
	}

	var reports int
	if err := f.db.QueryRow(`SELECT COUNT(*) FROM reports WHERE test_plan_id = $1`, plan.ID).Scan(&reports); err != nil {
		t.Fatalf("count reports: %v", err)
	}
	if reports != 1 {
		t.Errorf("closing at once made %d reports, want 1", reports)
	}
}

func TestTestPlans_ClosedAtAloneDoesNotCloseAPlan(t *testing.T) {
	f, reports := newCloseFixture(t)
	ctx := context.Background()

	testCase := f.newTestCase(t, "")
	plan, err := f.createPlan(testCase)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}
	// plans created before closed_at was removed from the forms can have one set
	if _, err := f.db.Exec(`UPDATE test_plans SET closed_at = now() WHERE id = $1`, plan.ID); err != nil {
		t.Fatalf("set closed_at: %v", err)
	}

	if _, err := f.createRun(plan.ID, testCase); err != nil {
		t.Errorf("create test run in an open plan with closed_at: unexpected error %v", err)
	}
	if _, err := reports.Create(ctx, &schema.CreateReportRequest{
		ProjectID: int64(f.projectID), TestPlanID: plan.ID, Name: "early", Type: "Summary", Status: "Completed",
	}); !errors.Is(err, services.ErrTestPlanNotClosed) {
		t.Errorf("report for an open plan with closed_at: err = %v, want ErrTestPlanNotClosed", err)
	}
	if err := f.plans.ReopenTestPlan(ctx, plan.ID, f.ownerID); !errors.Is(err, services.ErrTestPlanNotClosedYet) {
		t.Errorf("reopen an open plan with closed_at: err = %v, want ErrTestPlanNotClosedYet", err)
	}
}
