package test

import (
	"context"
	"errors"
	"sort"
	"testing"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func selectedIDs(t *testing.T, svc services.TestCaseService, selection schema.TestCaseSelection) []string {
	t.Helper()
	rows, err := svc.FindBySelection(context.Background(), selection)
	if err != nil {
		t.Fatalf("FindBySelection failed: %v", err)
	}
	ids := make([]string, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID.String())
	}
	sort.Strings(ids)
	return ids
}

func assertIDs(t *testing.T, got []string, want ...string) {
	t.Helper()
	sort.Strings(want)
	if len(got) != len(want) {
		t.Fatalf("expected test cases %v, got %v", want, got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("expected test cases %v, got %v", want, got)
		}
	}
}

func TestFindBySelection(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	svc := services.NewTestCaseService(db, dbsqlc.New(db), logging.NewForTest())

	// Select all: suggested and other projects' test cases are left out, like in the list
	assertIDs(t, selectedIDs(t, svc, schema.TestCaseSelection{
		ProjectID: f.projectID, SelectAll: true, ExcludedTestCaseIDs: []string{f.checkout},
	}), f.login, f.search)

	// Select all with the list's search filter
	assertIDs(t, selectedIDs(t, svc, schema.TestCaseSelection{
		ProjectID: f.projectID, SelectAll: true, Search: " search ",
	}), f.search)

	// Ticked test cases only count when they belong to the project
	assertIDs(t, selectedIDs(t, svc, schema.TestCaseSelection{
		ProjectID: f.projectID, TestCaseIDs: []string{f.login, f.otherProject},
	}), f.login)

	if _, err := svc.FindBySelection(context.Background(), schema.TestCaseSelection{ProjectID: f.projectID}); !errors.Is(err, services.ErrEmptyTestCaseSelection) {
		t.Fatalf("expected ErrEmptyTestCaseSelection, got %v", err)
	}
}

func TestDeleteBySelection_SelectAll(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	svc := services.NewTestCaseService(db, dbsqlc.New(db), logging.NewForTest())

	deleted, err := svc.DeleteBySelection(context.Background(), schema.TestCaseSelection{
		ProjectID: f.projectID, SelectAll: true, ExcludedTestCaseIDs: []string{f.search},
	})
	if err != nil {
		t.Fatalf("DeleteBySelection failed: %v", err)
	}
	if deleted != 2 {
		t.Errorf("expected 2 test cases deleted, got %d", deleted)
	}

	var remaining []string
	rows, err := db.Query(`SELECT id FROM test_cases WHERE id = ANY($1::uuid[])`,
		"{"+f.login+","+f.checkout+","+f.search+","+f.suggested+","+f.otherProject+"}")
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			t.Fatalf("scan failed: %v", err)
		}
		remaining = append(remaining, id)
	}
	sort.Strings(remaining)
	assertIDs(t, remaining, f.search, f.suggested, f.otherProject)
}

func TestTransferBySelection_SelectAll(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	svc := services.NewTestCaseService(db, dbsqlc.New(db), logging.NewForTest())
	ctx := context.Background()

	transferred, err := svc.TransferBySelection(ctx, schema.BulkTransferTestCasesRequest{
		Selection:       schema.TestCaseSelection{ProjectID: f.projectID, SelectAll: true, Search: "o"},
		TargetProjectID: f.otherProjectID,
		FeatureOrModule: "Moved",
	})
	if err != nil {
		t.Fatalf("TransferBySelection failed: %v", err)
	}
	// "o" matches Login, Checkout and Search products
	if transferred != 3 {
		t.Errorf("expected 3 test cases transferred, got %d", transferred)
	}

	assertIDs(t, selectedIDs(t, svc, schema.TestCaseSelection{ProjectID: f.projectID, SelectAll: true}))
	assertIDs(t, selectedIDs(t, svc, schema.TestCaseSelection{ProjectID: f.otherProjectID, SelectAll: true}),
		f.login, f.checkout, f.search, f.otherProject)

	codes := map[string]bool{}
	rows, err := svc.FindBySelection(ctx, schema.TestCaseSelection{
		ProjectID: f.otherProjectID, TestCaseIDs: []string{f.login, f.checkout, f.search},
	})
	if err != nil {
		t.Fatalf("FindBySelection failed: %v", err)
	}
	for _, tc := range rows {
		if tc.FeatureOrModule.String != "Moved" {
			t.Errorf("test case %s: expected feature/module Moved, got %q", tc.ID, tc.FeatureOrModule.String)
		}
		if codes[tc.Code] {
			t.Errorf("duplicate code %q after transfer", tc.Code)
		}
		codes[tc.Code] = true
	}
}
