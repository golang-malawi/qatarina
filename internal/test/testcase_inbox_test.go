package test

import (
	"context"
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestInbox_ServerSideFiltersAndOptions(t *testing.T) {
	f := newFreezeFixture(t)
	ctx := context.Background()
	svc := services.NewTestCaseService(f.db, dbsqlc.New(f.db), logging.NewForTest())

	alpha := f.newTestCase(t, "Inbox Alpha")
	beta := f.newTestCase(t, "Inbox Beta")
	plan, err := f.createPlan(alpha, beta)
	if err != nil {
		t.Fatalf("createPlan failed: %v", err)
	}

	var alphaCode string
	if err := f.db.QueryRow(`SELECT code FROM test_cases WHERE id = $1`, alpha).Scan(&alphaCode); err != nil {
		t.Fatalf("failed to read test case code: %v", err)
	}

	// Scope every query to the fixture project so other data in the database doesn't interfere
	base := schema.InboxFilterParams{
		UserID:   f.ownerID,
		PageSize: 50,
		Projects: []int32{f.projectID},
	}

	cases := []struct {
		name   string
		modify func(p *schema.InboxFilterParams)
		want   []string
	}{
		{"project only", func(p *schema.InboxFilterParams) {}, []string{alpha, beta}},
		{"module", func(p *schema.InboxFilterParams) { p.Module = "Inbox Alpha" }, []string{alpha}},
		{"search by code", func(p *schema.InboxFilterParams) { p.Search = alphaCode }, []string{alpha}},
		{"search by module, case-insensitive", func(p *schema.InboxFilterParams) { p.Search = "inbox beta" }, []string{beta}},
		{"no match", func(p *schema.InboxFilterParams) { p.Search = "does-not-exist-xyz" }, nil},
		{"unknown environment", func(p *schema.InboxFilterParams) { p.EnvironmentID = -1 }, nil},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			params := base
			tc.modify(&params)

			rows, total, err := svc.FindAllAssignedToUser(ctx, &params)
			if err != nil {
				t.Fatalf("FindAllAssignedToUser failed: %v", err)
			}
			got := make([]string, 0, len(rows))
			for _, r := range rows {
				got = append(got, r.ID)
				if r.ProjectTitle == "" {
					t.Errorf("expected project_title on %s", r.ID)
				}
			}
			sort.Strings(got)
			assertIDs(t, got, tc.want...)
			if total != int64(len(tc.want)) {
				t.Errorf("total = %d, want %d (count must use the same filters as the list)", total, len(tc.want))
			}
		})
	}

	// Previous/Next follow the filtered list. Inbox order is newest test plan first, then
	// newest test case, so with no module filter the order is [gamma, beta, alpha];
	// filtered to "Inbox Alpha" it is [gamma, alpha].
	gamma := f.newTestCase(t, "Inbox Alpha")
	gammaPlan, err := f.createPlan(gamma)
	if err != nil {
		t.Fatalf("createPlan failed: %v", err)
	}

	// Filtering by test plan keeps only that plan's test cases, in the list and the count
	for _, tc := range []struct {
		name   string
		planID int64
		want   []string
	}{
		{"first test plan", plan.ID, []string{alpha, beta}},
		{"second test plan", gammaPlan.ID, []string{gamma}},
		{"unknown test plan", -1, nil},
	} {
		params := base
		params.TestPlanID = tc.planID
		rows, total, err := svc.FindAllAssignedToUser(ctx, &params)
		if err != nil {
			t.Fatalf("FindAllAssignedToUser (%s) failed: %v", tc.name, err)
		}
		got := make([]string, 0, len(rows))
		for _, r := range rows {
			got = append(got, r.ID)
		}
		sort.Strings(got)
		want := append([]string(nil), tc.want...)
		sort.Strings(want)
		assertIDs(t, got, want...)
		if total != int64(len(want)) {
			t.Errorf("%s: total = %d, want %d", tc.name, total, len(want))
		}
	}

	// Previous/Next stay inside the chosen test plan
	byPlan := base
	byPlan.TestPlanID = plan.ID
	nav, err := svc.FindInboxNavigation(ctx, &byPlan, alpha, plan.ID)
	if err != nil {
		t.Fatalf("FindInboxNavigation (test plan) failed: %v", err)
	}
	if nav.PreviousID != beta || nav.NextID != "" || nav.Total != 2 {
		t.Errorf("test plan navigation = %+v, want previous %s (skipping gamma), no next, total 2", nav, beta)
	}

	unfiltered := base
	nav, err = svc.FindInboxNavigation(ctx, &unfiltered, alpha, plan.ID)
	if err != nil {
		t.Fatalf("FindInboxNavigation failed: %v", err)
	}
	if nav.PreviousID != beta || nav.NextID != "" || nav.Total != 3 {
		t.Errorf("unfiltered navigation = %+v, want previous %s, no next, total 3", nav, beta)
	}

	byModule := base
	byModule.Module = "Inbox Alpha"
	nav, err = svc.FindInboxNavigation(ctx, &byModule, alpha, plan.ID)
	if err != nil {
		t.Fatalf("FindInboxNavigation (module) failed: %v", err)
	}
	if nav.PreviousID != gamma || nav.NextID != "" || nav.Total != 2 {
		t.Errorf("module navigation = %+v, want previous %s (skipping beta), no next, total 2", nav, gamma)
	}

	// A test case that doesn't match the filters still gets a position, so the page doesn't break
	nav, err = svc.FindInboxNavigation(ctx, &byModule, beta, plan.ID)
	if err != nil {
		t.Fatalf("FindInboxNavigation (non-matching current) failed: %v", err)
	}
	if nav.Total != 3 {
		t.Errorf("non-matching current navigation total = %d, want 3 (2 matches + the current one)", nav.Total)
	}

	options, err := svc.FindInboxFilterOptions(ctx, f.ownerID, false, nil)
	if err != nil {
		t.Fatalf("FindInboxFilterOptions failed: %v", err)
	}
	modules := map[string]bool{}
	for _, m := range options.Modules {
		modules[m.Value] = true
	}
	if !modules["Inbox Alpha"] || !modules["Inbox Beta"] {
		t.Errorf("expected both fixture modules in options, got %+v", options.Modules)
	}
	foundProject := false
	for _, p := range options.Projects {
		if p.Value == strconv.Itoa(int(f.projectID)) && p.Label != "" {
			foundProject = true
		}
	}
	if !foundProject {
		t.Errorf("expected fixture project %d in options, got %+v", f.projectID, options.Projects)
	}

	// Both fixture test plans are offered, the newer one first
	planIndex := map[string]int{}
	for i, p := range options.TestPlans {
		if p.Label == "" {
			t.Errorf("expected a label on test plan option %s", p.Value)
		}
		planIndex[p.Value] = i
	}
	first, okFirst := planIndex[strconv.FormatInt(plan.ID, 10)]
	second, okSecond := planIndex[strconv.FormatInt(gammaPlan.ID, 10)]
	if !okFirst || !okSecond {
		t.Fatalf("expected test plans %d and %d in options, got %+v", plan.ID, gammaPlan.ID, options.TestPlans)
	}
	if second > first {
		t.Errorf("expected newer test plan %d before %d, got %+v", gammaPlan.ID, plan.ID, options.TestPlans)
	}

	// A test case from another project in the same inbox
	other := newFreezeFixture(t)
	elsewhere := other.newTestCase(t, "Inbox Elsewhere")
	otherPlan, err := other.plans.Create(ctx, &schema.CreateTestPlan{
		ProjectID:      int64(other.projectID),
		Kind:           "general",
		Description:    "other project plan",
		StartAt:        time.Now(),
		ScheduledEndAt: time.Now().Add(24 * time.Hour),
		AssignedToID:   f.ownerID,
		CreatedByID:    other.ownerID,
		UpdatedByID:    other.ownerID,
		PlannedTests:   []schema.TestCaseAssignment{{TestCaseID: elsewhere, UserIDs: []int64{f.ownerID}}},
	})
	if err != nil {
		t.Fatalf("createPlan (other project) failed: %v", err)
	}
	otherPlanValue := strconv.FormatInt(otherPlan.ID, 10)

	values := func(opts []schema.InboxFilterOption) map[string]bool {
		m := map[string]bool{}
		for _, o := range opts {
			m[o.Value] = true
		}
		return m
	}

	// Without a project every project's options are offered
	all, err := svc.FindInboxFilterOptions(ctx, f.ownerID, false, nil)
	if err != nil {
		t.Fatalf("FindInboxFilterOptions (all projects) failed: %v", err)
	}
	if !values(all.Modules)["Inbox Elsewhere"] || !values(all.TestPlans)[otherPlanValue] {
		t.Errorf("expected the other project's module and test plan without a project filter, got modules %+v, test plans %+v", all.Modules, all.TestPlans)
	}

	// With a project, environments, test plans and modules come only from that project,
	// while every project stays selectable
	scoped, err := svc.FindInboxFilterOptions(ctx, f.ownerID, false, []int32{f.projectID})
	if err != nil {
		t.Fatalf("FindInboxFilterOptions (one project) failed: %v", err)
	}
	if values(scoped.Modules)["Inbox Elsewhere"] || values(scoped.TestPlans)[otherPlanValue] {
		t.Errorf("expected only the fixture project's options, got modules %+v, test plans %+v", scoped.Modules, scoped.TestPlans)
	}
	if !values(scoped.Modules)["Inbox Alpha"] || !values(scoped.TestPlans)[strconv.FormatInt(plan.ID, 10)] {
		t.Errorf("expected the fixture project's module and test plan, got modules %+v, test plans %+v", scoped.Modules, scoped.TestPlans)
	}
	projects := values(scoped.Projects)
	if !projects[strconv.Itoa(int(f.projectID))] || !projects[strconv.Itoa(int(other.projectID))] {
		t.Errorf("expected both projects to stay selectable, got %+v", scoped.Projects)
	}
}
