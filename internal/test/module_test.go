package test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestModuleUpdateAndDelete(t *testing.T) {
	db := openTestDB()
	ctx := context.Background()
	svc := services.NewModuleService(dbsqlc.New(db))

	var projectID int32
	if err := db.QueryRowContext(ctx, `SELECT id FROM projects ORDER BY id LIMIT 1`).Scan(&projectID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			t.Skip("no project available to attach modules to")
		}
		t.Fatalf("failed to find a project: %v", err)
	}

	code := fmt.Sprintf("MT%d", time.Now().UnixNano())
	if _, err := svc.Create(&schema.CreateProjectModuleRequest{
		ProjectID:   projectID,
		Name:        "module-test",
		Code:        code,
		Priority:    1,
		Type:        "feature",
		Description: "before",
	}); err != nil {
		t.Fatalf("create failed: %v", err)
	}

	var moduleID int32
	if err := db.QueryRowContext(ctx, `SELECT id FROM modules WHERE code = $1`, code).Scan(&moduleID); err != nil {
		t.Fatalf("failed to find created module: %v", err)
	}
	t.Cleanup(func() {
		_, _ = db.Exec(`DELETE FROM modules WHERE id = $1`, moduleID)
	})

	if _, err := svc.Update(ctx, schema.UpdateProjectModuleRequest{
		ID:          moduleID,
		Name:        "module-test-renamed",
		Code:        code,
		Priority:    2,
		Type:        "component",
		Description: "after",
	}); err != nil {
		t.Fatalf("update failed: %v", err)
	}

	updated, err := svc.GetOne(ctx, moduleID)
	if err != nil {
		t.Fatalf("get failed: %v", err)
	}
	if updated.Name != "module-test-renamed" || updated.Type != "component" || updated.Priority != 2 || updated.Description != "after" {
		t.Fatalf("unexpected update result: %+v", updated)
	}

	if _, err := svc.Update(ctx, schema.UpdateProjectModuleRequest{
		ID: -1, Name: "missing", Code: "missing", Priority: 1, Type: "feature",
	}); !errors.Is(err, services.ErrNotFound) {
		t.Fatalf("expected ErrNotFound updating a missing module, got %v", err)
	}

	if err := svc.Delete(ctx, moduleID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	if err := svc.Delete(ctx, moduleID); !errors.Is(err, services.ErrNotFound) {
		t.Fatalf("expected ErrNotFound deleting twice, got %v", err)
	}
}
