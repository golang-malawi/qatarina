package test

import (
	"context"
	"sort"
	"strconv"
	"testing"

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
	if _, err := f.createPlan(alpha, beta); err != nil {
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

	// Previous/Next follow the filtered list. Inbox order is newest first, so with no
	// module filter the order is [gamma, beta, alpha]; filtered to "Inbox Alpha" it is [gamma, alpha].
	gamma := f.newTestCase(t, "Inbox Alpha")
	if _, err := f.createPlan(gamma); err != nil {
		t.Fatalf("createPlan failed: %v", err)
	}

	unfiltered := base
	nav, err := svc.FindInboxNavigation(ctx, &unfiltered, alpha)
	if err != nil {
		t.Fatalf("FindInboxNavigation failed: %v", err)
	}
	if nav.PreviousID != beta || nav.NextID != "" || nav.Total != 3 {
		t.Errorf("unfiltered navigation = %+v, want previous %s, no next, total 3", nav, beta)
	}

	byModule := base
	byModule.Module = "Inbox Alpha"
	nav, err = svc.FindInboxNavigation(ctx, &byModule, alpha)
	if err != nil {
		t.Fatalf("FindInboxNavigation (module) failed: %v", err)
	}
	if nav.PreviousID != gamma || nav.NextID != "" || nav.Total != 2 {
		t.Errorf("module navigation = %+v, want previous %s (skipping beta), no next, total 2", nav, gamma)
	}

	// A test case that doesn't match the filters still gets a position, so the page doesn't break
	nav, err = svc.FindInboxNavigation(ctx, &byModule, beta)
	if err != nil {
		t.Fatalf("FindInboxNavigation (non-matching current) failed: %v", err)
	}
	if nav.Total != 3 {
		t.Errorf("non-matching current navigation total = %d, want 3 (2 matches + the current one)", nav.Total)
	}

	options, err := svc.FindInboxFilterOptions(ctx, f.ownerID, false)
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
}
