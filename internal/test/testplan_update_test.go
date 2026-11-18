package test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestTestPlanUpdateDetails(t *testing.T) {
	f := newFreezeFixture(t)
	ctx := context.Background()

	created, err := f.createPlan(f.newTestCase(t, "Update Plan"))
	if err != nil {
		t.Fatalf("createPlan failed: %v", err)
	}
	before, err := f.plans.GetOneTestPlan(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetOneTestPlan failed: %v", err)
	}

	// Only the fields sent change; progress, status and assignments are kept
	description := "updated description"
	newEnd := time.Now().Add(72 * time.Hour).Truncate(time.Second)
	if err := f.plans.UpdateDetails(ctx, schema.UpdateTestPlanDetails{
		ID:             created.ID,
		UpdatedByID:    f.ownerID,
		Description:    &description,
		ScheduledEndAt: &newEnd,
	}); err != nil {
		t.Fatalf("UpdateDetails failed: %v", err)
	}
	after, err := f.plans.GetOneTestPlan(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetOneTestPlan failed: %v", err)
	}
	if after.Description != description {
		t.Errorf("description = %q, want %q", after.Description, description)
	}
	if after.Kind != before.Kind || after.StartAt != before.StartAt {
		t.Errorf("fields not sent changed: kind %q->%q, start %q->%q", before.Kind, after.Kind, before.StartAt, after.StartAt)
	}
	if after.AssignedToID != before.AssignedToID || after.CreatedByID != before.CreatedByID ||
		after.NumTestCases != before.NumTestCases || after.IsComplete || after.ClosedAt != "" {
		t.Errorf("progress/status/assignments changed: before %+v, after %+v", before, after)
	}

	empty := "   "
	badKind := "not-a-kind"
	missingEnv := int64(-1)
	pastEnd := time.Now().Add(-30 * 24 * time.Hour)
	rejected := []struct {
		name    string
		request schema.UpdateTestPlanDetails
		want    error
	}{
		{"missing plan", schema.UpdateTestPlanDetails{ID: -1, Description: &description}, services.ErrNotFound},
		{"empty description", schema.UpdateTestPlanDetails{ID: created.ID, Description: &empty}, services.ErrTestPlanEmptyDescription},
		{"invalid kind", schema.UpdateTestPlanDetails{ID: created.ID, Kind: &badKind}, services.ErrTestPlanInvalidKind},
		{"unknown environment", schema.UpdateTestPlanDetails{ID: created.ID, EnvironmentID: &missingEnv}, services.ErrTestPlanEnvironment},
		{"end before start", schema.UpdateTestPlanDetails{ID: created.ID, ScheduledEndAt: &pastEnd}, services.ErrTestPlanEndBeforeStart},
	}
	for _, tc := range rejected {
		t.Run(tc.name, func(t *testing.T) {
			if err := f.plans.UpdateDetails(ctx, tc.request); !errors.Is(err, tc.want) {
				t.Errorf("err = %v, want %v", err, tc.want)
			}
		})
	}

	// A closed plan can't be edited
	if err := f.plans.CloseTestPlan(ctx, int32(created.ID)); err != nil {
		t.Fatalf("CloseTestPlan failed: %v", err)
	}
	if err := f.plans.UpdateDetails(ctx, schema.UpdateTestPlanDetails{ID: created.ID, Description: &description}); !errors.Is(err, services.ErrTestPlanClosed) {
		t.Errorf("updating a closed plan: err = %v, want %v", err, services.ErrTestPlanClosed)
	}
}
