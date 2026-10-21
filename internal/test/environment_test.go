package test

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestEnvironmentUpdateAndDelete(t *testing.T) {
	db := openTestDB()
	ctx := context.Background()
	svc := services.NewEnvironmentService(dbsqlc.New(db))

	var projectID int64
	if err := db.QueryRowContext(ctx, `SELECT id FROM projects ORDER BY id LIMIT 1`).Scan(&projectID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			t.Skip("no project available to attach environments to")
		}
		t.Fatalf("failed to find a project: %v", err)
	}

	created, err := svc.Create(ctx, projectID, &schema.EnvironmentRequest{
		Name:        "env-test",
		Description: "before",
		BaseURL:     "https://before.example.com",
	})
	if err != nil {
		t.Fatalf("create failed: %v", err)
	}
	t.Cleanup(func() {
		_, _ = db.Exec(`DELETE FROM environments WHERE id = $1`, created.ID)
	})

	list, err := svc.FindByProjectID(ctx, projectID)
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	var listed *schema.EnvironmentResponse
	for i := range list.Environments {
		if list.Environments[i].ID == created.ID {
			listed = &list.Environments[i]
		}
	}
	if listed == nil || listed.Description != "before" {
		t.Fatalf("expected listed environment with description, got %+v", listed)
	}

	updated, err := svc.Update(ctx, &schema.UpdateEnvironmentRequest{
		ID:          created.ID,
		ProjectID:   projectID,
		Name:        "env-test-renamed",
		Description: "after",
		BaseURL:     "",
	})
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.Name != "env-test-renamed" || updated.Description != "after" || updated.BaseURL != "" {
		t.Fatalf("unexpected update result: %+v", updated)
	}

	if _, err := svc.Update(ctx, &schema.UpdateEnvironmentRequest{
		ID:        created.ID,
		ProjectID: projectID + 1_000_000,
		Name:      "wrong-project",
	}); !errors.Is(err, services.ErrNotFound) {
		t.Fatalf("expected ErrNotFound updating through another project, got %v", err)
	}

	if err := svc.Delete(ctx, projectID+1_000_000, created.ID); !errors.Is(err, services.ErrNotFound) {
		t.Fatalf("expected ErrNotFound deleting through another project, got %v", err)
	}
	if err := svc.Delete(ctx, projectID, created.ID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	if err := svc.Delete(ctx, projectID, created.ID); !errors.Is(err, services.ErrNotFound) {
		t.Fatalf("expected ErrNotFound deleting twice, got %v", err)
	}
}
