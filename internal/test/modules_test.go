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

type moduleFixture struct {
	db        *sql.DB
	svc       services.ModuleService
	projectID int32
}

// newModuleFixture creates a user and a project, removed again (with its modules) when the test ends
func newModuleFixture(t *testing.T, db *sql.DB, maxDepth int) moduleFixture {
	t.Helper()

	signUp, err := newAuthService(t, db).SignUp(&schema.SignUpRequest{
		FirstName:   "Module",
		LastName:    "Owner",
		DisplayName: "Module Owner",
		Email:       uniqueEmail("modules"),
		Password:    "s3cret-pass",
	})
	if err != nil {
		t.Fatalf("SignUp failed: %v", err)
	}

	newProject := func(title string) int32 {
		var id int32
		err := db.QueryRow(
			`INSERT INTO projects (title, description, owner_user_id, created_at, updated_at)
			 VALUES ($1, 'module hierarchy fixture', $2, NOW(), NOW()) RETURNING id`,
			title, signUp.UserID,
		).Scan(&id)
		if err != nil {
			t.Fatalf("failed to insert project: %v", err)
		}
		return id
	}
	projectID := newProject("Module Hierarchy")

	t.Cleanup(func() {
		// modules are removed with the project (ON DELETE CASCADE)
		db.Exec(`DELETE FROM projects WHERE owner_user_id = $1`, signUp.UserID)
		db.Exec(`DELETE FROM users WHERE id = $1`, signUp.UserID)
	})

	return moduleFixture{
		db:        db,
		svc:       services.NewModuleService(dbsqlc.New(db), maxDepth),
		projectID: projectID,
	}
}

// create adds a module under parent (nil for top level) and returns its ID
func (f moduleFixture) create(t *testing.T, name string, parent *int32) (int32, error) {
	t.Helper()
	_, err := f.svc.Create(&schema.CreateProjectModuleRequest{
		ProjectID:      f.projectID,
		Name:           name,
		Code:           name,
		Priority:       1,
		Type:           "module",
		Description:    name,
		ParentModuleID: parent,
	})
	if err != nil {
		return 0, err
	}
	var id int32
	if err := f.db.QueryRow(`SELECT id FROM modules WHERE project_id = $1 AND code = $2`, f.projectID, name).Scan(&id); err != nil {
		t.Fatalf("failed to look up module %s: %v", name, err)
	}
	return id, nil
}

func (f moduleFixture) mustCreate(t *testing.T, name string, parent *int32) int32 {
	t.Helper()
	id, err := f.create(t, name, parent)
	if err != nil {
		t.Fatalf("Create(%s) failed: %v", name, err)
	}
	return id
}

func (f moduleFixture) setParent(id int32, parent *int32) error {
	_, err := f.svc.Update(context.Background(), schema.UpdateProjectModuleRequest{
		ID:             id,
		Name:           "renamed",
		Code:           "renamed",
		Priority:       1,
		Type:           "module",
		ParentModuleID: parent,
	})
	return err
}

func TestModules_HierarchyUpToMaxDepth(t *testing.T) {
	f := newModuleFixture(t, openTestDB(), 4)

	// A -> B -> C -> D is exactly 4 levels deep
	a := f.mustCreate(t, "A", nil)
	b := f.mustCreate(t, "B", &a)
	c := f.mustCreate(t, "C", &b)
	d := f.mustCreate(t, "D", &c)

	module, err := f.svc.GetOne(context.Background(), d)
	if err != nil {
		t.Fatalf("GetOne failed: %v", err)
	}
	if !module.ParentModuleID.Valid || module.ParentModuleID.Int32 != c {
		t.Errorf("D.ParentModuleID = %+v, want %d", module.ParentModuleID, c)
	}

	if _, err := f.create(t, "E", &d); !errors.Is(err, services.ErrModuleMaxDepthExceeded) {
		t.Errorf("fifth level: err = %v, want ErrModuleMaxDepthExceeded", err)
	}
}

func TestModules_MovingSubtreeRespectsMaxDepth(t *testing.T) {
	f := newModuleFixture(t, openTestDB(), 4)

	a := f.mustCreate(t, "A", nil)
	b := f.mustCreate(t, "B", &a)
	x := f.mustCreate(t, "X", nil)
	y := f.mustCreate(t, "Y", &x)
	f.mustCreate(t, "Z", &y)

	// X -> Y -> Z under B would put Z at level 5
	if err := f.setParent(x, &b); !errors.Is(err, services.ErrModuleMaxDepthExceeded) {
		t.Errorf("move deep subtree: err = %v, want ErrModuleMaxDepthExceeded", err)
	}
	// under A, Z ends up at level 4
	if err := f.setParent(x, &a); err != nil {
		t.Errorf("move subtree under A: unexpected error %v", err)
	}
	// and back to the top level
	if err := f.setParent(x, nil); err != nil {
		t.Errorf("move subtree to top level: unexpected error %v", err)
	}
}

func TestModules_RejectsCycles(t *testing.T) {
	f := newModuleFixture(t, openTestDB(), 8)

	a := f.mustCreate(t, "A", nil)
	b := f.mustCreate(t, "B", &a)
	c := f.mustCreate(t, "C", &b)

	if err := f.setParent(a, &a); !errors.Is(err, services.ErrModuleHierarchyCycle) {
		t.Errorf("own parent: err = %v, want ErrModuleHierarchyCycle", err)
	}
	if err := f.setParent(a, &c); !errors.Is(err, services.ErrModuleHierarchyCycle) {
		t.Errorf("descendant as parent: err = %v, want ErrModuleHierarchyCycle", err)
	}
}

func TestModules_InvalidParent(t *testing.T) {
	db := openTestDB()
	f := newModuleFixture(t, db, 4)
	other := newModuleFixture(t, db, 4)

	missing := int32(-1)
	if _, err := f.create(t, "A", &missing); !errors.Is(err, services.ErrModuleParentNotFound) {
		t.Errorf("missing parent: err = %v, want ErrModuleParentNotFound", err)
	}

	foreign := other.mustCreate(t, "Foreign", nil)
	if _, err := f.create(t, "B", &foreign); !errors.Is(err, services.ErrModuleParentProject) {
		t.Errorf("parent in other project: err = %v, want ErrModuleParentProject", err)
	}
}

func TestModules_DeletingParentPromotesChildren(t *testing.T) {
	f := newModuleFixture(t, openTestDB(), 4)
	ctx := context.Background()

	a := f.mustCreate(t, "A", nil)
	b := f.mustCreate(t, "B", &a)

	if err := f.svc.Delete(ctx, a); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	module, err := f.svc.GetOne(ctx, b)
	if err != nil {
		t.Fatalf("GetOne failed: %v", err)
	}
	if module.ParentModuleID.Valid {
		t.Errorf("B.ParentModuleID = %d, want NULL after parent is deleted", module.ParentModuleID.Int32)
	}
}
