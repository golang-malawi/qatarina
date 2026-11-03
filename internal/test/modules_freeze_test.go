package test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/google/uuid"
)

type freezeFixture struct {
	moduleFixture
	ownerID int64
	plans   services.TestPlanService
	runs    services.TestRunService
}

// newFreezeFixture extends the module fixture with test plan and test run services,
// test cases and test plans in the project are removed again when the test ends
func newFreezeFixture(t *testing.T) freezeFixture {
	t.Helper()
	db := openTestDB()
	f := freezeFixture{moduleFixture: newModuleFixture(t, db, 4)}
	if err := db.QueryRow(`SELECT owner_user_id FROM projects WHERE id = $1`, f.projectID).Scan(&f.ownerID); err != nil {
		t.Fatalf("failed to look up project owner: %v", err)
	}

	queries := dbsqlc.New(db)
	f.plans = services.NewTestPlanService(queries, logging.NewForTest())
	f.runs = services.NewTestRunService(db, queries, logging.NewForTest())

	// runs before the module fixture cleanup removes the project
	t.Cleanup(func() {
		db.Exec(`DELETE FROM test_plan_cases WHERE test_plan_id IN (SELECT id FROM test_plans WHERE project_id = $1)`, f.projectID)
		db.Exec(`DELETE FROM test_plans WHERE project_id = $1`, f.projectID)
		db.Exec(`DELETE FROM test_cases WHERE project_id = $1`, f.projectID)
	})
	return f
}

// newTestCase adds a test case whose feature_or_module is set to module
func (f freezeFixture) newTestCase(t *testing.T, module string) string {
	t.Helper()
	id, _ := uuid.NewV7()
	_, err := f.db.Exec(
		`INSERT INTO test_cases (id, kind, code, feature_or_module, title, description, created_by_id, project_id, created_at, updated_at)
		 VALUES ($1, 'general', $2, $3, 'freeze test', 'module freeze fixture', $4, $5, NOW(), NOW())`,
		id, "FRZ-"+id.String()[24:], module, f.ownerID, f.projectID,
	)
	if err != nil {
		t.Fatalf("failed to insert test case: %v", err)
	}
	return id.String()
}

func (f freezeFixture) createPlan(testCaseIDs ...string) (*dbsqlc.GetTestPlanRow, error) {
	planned := make([]schema.TestCaseAssignment, 0, len(testCaseIDs))
	for _, id := range testCaseIDs {
		planned = append(planned, schema.TestCaseAssignment{TestCaseID: id, UserIDs: []int64{f.ownerID}})
	}
	return f.plans.Create(context.Background(), &schema.CreateTestPlan{
		ProjectID:      int64(f.projectID),
		Kind:           "general",
		Description:    "module freeze",
		StartAt:        time.Now(),
		ScheduledEndAt: time.Now().Add(24 * time.Hour),
		AssignedToID:   f.ownerID,
		CreatedByID:    f.ownerID,
		UpdatedByID:    f.ownerID,
		PlannedTests:   planned,
	})
}

func (f freezeFixture) assign(planID int64, testCaseIDs ...string) error {
	_, err := f.plans.BatchAssignTestCasesToPlan(context.Background(), &schema.BatchAssignTestCasesToPlanRequest{
		ProjectID:   int64(f.projectID),
		PlanID:      planID,
		TestCaseIDs: testCaseIDs,
		UserIDs:     []int64{f.ownerID},
	})
	return err
}

func TestModules_FrozenTestCasesCannotBeUsedInTests(t *testing.T) {
	f := newFreezeFixture(t)
	ctx := context.Background()

	parent := f.mustCreate(t, "Payments", nil)
	f.mustCreate(t, "Refunds", &parent)
	f.mustCreate(t, "Reports", nil)

	inParent := f.newTestCase(t, "Payments")
	// matched regardless of case and surrounding spaces
	inChild := f.newTestCase(t, " refunds ")
	elsewhere := f.newTestCase(t, "Reports")

	if err := f.svc.SetFrozen(ctx, parent, true); err != nil {
		t.Fatalf("SetFrozen failed: %v", err)
	}
	module, err := f.svc.GetOne(ctx, parent)
	if err != nil {
		t.Fatalf("GetOne failed: %v", err)
	}
	if !module.IsFrozen || !module.FrozenAt.Valid {
		t.Errorf("module after freeze: IsFrozen = %v, FrozenAt = %+v", module.IsFrozen, module.FrozenAt)
	}

	// a module below a frozen module is frozen too, and no plan is left behind
	if _, err := f.createPlan(elsewhere, inChild); !errors.Is(err, services.ErrModuleFrozen) {
		t.Errorf("create plan with child module case: err = %v, want ErrModuleFrozen", err)
	}
	var plans int
	if err := f.db.QueryRow(`SELECT COUNT(*) FROM test_plans WHERE project_id = $1`, f.projectID).Scan(&plans); err != nil {
		t.Fatalf("failed to count test plans: %v", err)
	}
	if plans != 0 {
		t.Errorf("rejected plan was still created: %d plans in project", plans)
	}

	plan, err := f.createPlan(elsewhere)
	if err != nil {
		t.Fatalf("create plan with unfrozen case: %v", err)
	}
	if err := f.assign(plan.ID, inParent); !errors.Is(err, services.ErrModuleFrozen) {
		t.Errorf("assign frozen case to plan: err = %v, want ErrModuleFrozen", err)
	}
	if _, err := f.runs.Create(ctx, &schema.TestRunRequest{
		ProjectID:  f.projectID,
		TestCaseID: inParent,
		OwnerID:    int32(f.ownerID),
		Code:       "FRZ-RUN",
	}); !errors.Is(err, services.ErrModuleFrozen) {
		t.Errorf("create test run for frozen case: err = %v, want ErrModuleFrozen", err)
	}

	if err := f.svc.SetFrozen(ctx, parent, false); err != nil {
		t.Fatalf("SetFrozen(false) failed: %v", err)
	}
	if err := f.assign(plan.ID, inParent, inChild); err != nil {
		t.Errorf("assign after unfreezing: unexpected error %v", err)
	}
}

func TestModules_FreezingDoesNotAffectOtherProjects(t *testing.T) {
	f := newFreezeFixture(t)
	other := newFreezeFixture(t)
	ctx := context.Background()

	frozen := other.mustCreate(t, "Payments", nil)
	if err := other.svc.SetFrozen(ctx, frozen, true); err != nil {
		t.Fatalf("SetFrozen failed: %v", err)
	}

	// same module name, but in a project where it is not frozen
	f.mustCreate(t, "Payments", nil)
	if _, err := f.createPlan(f.newTestCase(t, "Payments")); err != nil {
		t.Errorf("create plan in other project: unexpected error %v", err)
	}
}

func TestModules_FreezeMissingModule(t *testing.T) {
	f := newModuleFixture(t, openTestDB(), 4)
	if err := f.svc.SetFrozen(context.Background(), -1, true); !errors.Is(err, services.ErrNotFound) {
		t.Errorf("freeze missing module: err = %v, want ErrNotFound", err)
	}
}

func TestModules_FreezingKeepsTestCasesAlreadyInPlans(t *testing.T) {
	f := newFreezeFixture(t)
	ctx := context.Background()

	module := f.mustCreate(t, "Payments", nil)
	planned := f.newTestCase(t, "Payments")
	plan, err := f.createPlan(planned)
	if err != nil {
		t.Fatalf("create plan: %v", err)
	}

	if err := f.svc.SetFrozen(ctx, module, true); err != nil {
		t.Fatalf("SetFrozen failed: %v", err)
	}
	// changing the testers of a test case that is already in the plan is still allowed
	if err := f.assign(plan.ID, planned); err != nil {
		t.Errorf("reassign test case already in plan: unexpected error %v", err)
	}
	if err := f.assign(plan.ID, planned, f.newTestCase(t, "Payments")); !errors.Is(err, services.ErrModuleFrozen) {
		t.Errorf("add new frozen case alongside planned one: err = %v, want ErrModuleFrozen", err)
	}
}
