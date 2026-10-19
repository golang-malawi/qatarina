package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type ModuleService interface {
	Create(
		*schema.CreateProjectModuleRequest,
	) (bool, error)
	// GetOne retrieves one module in the context
	GetOne(ctx context.Context, id int32) (dbsqlc.Module, error)
	// GetAll retrieves all modules in the context
	GetAll(ctx context.Context) ([]dbsqlc.Module, error)
	// Update used to edit module records
	Update(ctx context.Context, request schema.UpdateProjectModuleRequest) (bool, error)
	// Delete used to delete a module from table
	Delete(ctx context.Context, id int32) error
	// GetProjectModules retrieves all modules in database which belong to one project
	GetProjectModules(ctx context.Context, projectID int32) ([]dbsqlc.Module, error)
}

var (
	ErrModuleParentNotFound   = errors.New("parent module not found")
	ErrModuleParentProject    = errors.New("parent module must belong to the same project")
	ErrModuleHierarchyCycle   = errors.New("a module cannot be its own parent or the parent of one of its ancestors")
	ErrModuleMaxDepthExceeded = errors.New("module hierarchy would exceed the maximum depth")
)

// IsModuleHierarchyError reports whether err is a validation error for the module hierarchy
func IsModuleHierarchyError(err error) bool {
	return errors.Is(err, ErrModuleParentNotFound) ||
		errors.Is(err, ErrModuleParentProject) ||
		errors.Is(err, ErrModuleHierarchyCycle) ||
		errors.Is(err, ErrModuleMaxDepthExceeded)
}

// NewModuleService creates a ModuleService where module hierarchies may be at most maxDepth levels deep
func NewModuleService(queries *dbsqlc.Queries, maxDepth int) ModuleService {
	return &moduleServiceImpl{
		db:       queries,
		maxDepth: maxDepth,
	}
}

type moduleServiceImpl struct {
	db       *dbsqlc.Queries
	maxDepth int
}

// validateParent checks that moduleID (0 for a new module) can be placed under parentID
// without creating a cycle or exceeding the maximum depth of the hierarchy
func (m *moduleServiceImpl) validateParent(ctx context.Context, projectID, moduleID, parentID int32) error {
	if moduleID != 0 && parentID == moduleID {
		return ErrModuleHierarchyCycle
	}

	parent, err := m.db.GetOneModule(ctx, parentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrModuleParentNotFound
		}
		return err
	}
	if parent.ProjectID != projectID {
		return ErrModuleParentProject
	}

	// levels below the module being moved, which move together with it
	subtreeLevels := int32(0)
	if moduleID != 0 {
		descendants, err := m.db.GetModuleDescendants(ctx, sql.NullInt32{Int32: moduleID, Valid: true})
		if err != nil {
			return err
		}
		for _, d := range descendants {
			if d.ID == parentID {
				return ErrModuleHierarchyCycle
			}
			subtreeLevels = max(subtreeLevels, d.Level)
		}
	}

	parentDepth, err := m.db.GetModuleDepth(ctx, parentID)
	if err != nil {
		return err
	}
	if depth := int(parentDepth + 1 + subtreeLevels); depth > m.maxDepth {
		return fmt.Errorf("%w of %d (would be %d)", ErrModuleMaxDepthExceeded, m.maxDepth, depth)
	}

	return nil
}

func toNullInt32(v *int32) sql.NullInt32 {
	if v == nil || *v == 0 {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *v, Valid: true}
}

func (m *moduleServiceImpl) Create(
	request *schema.CreateProjectModuleRequest,
) (bool, error) {
	if request.ProjectID == 0 || request.Name == "" || request.Code == "" || request.Priority == 0 {
		return false, fmt.Errorf("empty field(s) found")
	}
	parentID := toNullInt32(request.ParentModuleID)
	if parentID.Valid {
		if err := m.validateParent(context.Background(), request.ProjectID, 0, parentID.Int32); err != nil {
			return false, err
		}
	}
	_, err := m.db.CreateProjectModules(context.Background(), dbsqlc.CreateProjectModulesParams{
		ProjectID:      request.ProjectID,
		Name:           request.Name,
		Code:           request.Code,
		Priority:       request.Priority,
		Type:           request.Type,
		Description:    request.Description,
		ParentModuleID: parentID,
	})

	if err != nil {
		return false, fmt.Errorf("failed to create module %v", err)

	}

	return true, nil
}

// Implement the Get method to retrive modules from the table
func (m *moduleServiceImpl) GetOne(ctx context.Context, id int32) (dbsqlc.Module, error) {
	module, err := m.db.GetOneModule(ctx, id)
	if err != nil {
		return dbsqlc.Module{}, err
	}

	return module, nil
}

func (m *moduleServiceImpl) GetAll(ctx context.Context) ([]dbsqlc.Module, error) {
	if modules, err := m.db.GetAllModules(context.Background()); err != nil {
		return nil, err
	} else {
		return modules, nil
	}
}

// Implement the Update to change field in table
func (m *moduleServiceImpl) Update(ctx context.Context, request schema.UpdateProjectModuleRequest) (bool, error) {
	parentID := toNullInt32(request.ParentModuleID)
	if parentID.Valid {
		existing, err := m.db.GetOneModule(ctx, request.ID)
		if err != nil {
			return false, err
		}
		if err := m.validateParent(ctx, existing.ProjectID, request.ID, parentID.Int32); err != nil {
			return false, err
		}
	}
	err := m.db.UpdateProjectModule(ctx, dbsqlc.UpdateProjectModuleParams{
		ID:             request.ID,
		Name:           request.Name,
		Code:           request.Code,
		Priority:       request.Priority,
		Type:           request.Type,
		Description:    request.Description,
		ParentModuleID: parentID,
	})
	if err != nil {
		return false, fmt.Errorf("failed to update module %v", err)

	}

	return true, nil
}

// Implement the Delete to remove a module in the table
func (m *moduleServiceImpl) Delete(ctx context.Context, id int32) error {
	_, err := m.db.DeleteProjectModule(ctx, id)

	if err != nil {
		return err
	}

	return nil
}

func (m *moduleServiceImpl) GetProjectModules(ctx context.Context, projectID int32) ([]dbsqlc.Module, error) {
	modules, err := m.db.GetProjectModules(ctx, projectID)

	if err != nil {
		return nil, err
	}

	return modules, nil

}
