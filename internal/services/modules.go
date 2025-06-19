package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type ModuleService interface {
	Create(
		*schema.CreateProjectModuleRequest,
	) (bool, error)
	// GetOne retrieves one module in the context
	GetOne(ctx context.Context, projectID int32) (dbsqlc.Module, error)
	// GetAll retrieves all modules in the context
	GetAll(ctx context.Context) ([]dbsqlc.Module, error)
	// Update used to edit module records
	Update(ctx context.Context, request schema.UpdateProjectModuleRequest) (bool, error)
	// Delete used to delete a module from table
	Delete(ctx context.Context, id int32) error
}

func NewModuleService(queries *dbsqlc.Queries) ModuleService {
	return &moduleServiceImpl{
		db: queries,
	}
}

type moduleServiceImpl struct {
	db     *dbsqlc.Queries
	logger logging.Logger
}

func (m *moduleServiceImpl) Create(
	request *schema.CreateProjectModuleRequest,
) (bool, error) {
	if request.ProjectID == 0 || request.Name == "" || request.Code == "" || request.Priority == 0 {
		return false, fmt.Errorf("empty field(s) found")
	}
	_, err := m.db.CreateProjectModules(context.Background(), dbsqlc.CreateProjectModulesParams{
		ProjectID: request.ProjectID,
		Name:      request.Name,
		Code:      request.Code,
		Priority:  request.Priority,
		Type:        request.Type,
		Description: request.Description,
	})

	if err != nil {
		return false, fmt.Errorf("failed to create module %v", err)

	}

	return true, nil
}

// Implement the Get method to retrive modules from the table
func (m *moduleServiceImpl) GetOne(ctx context.Context, projectID int32) (dbsqlc.Module, error) {
	module, err := m.db.GetOneModule(ctx, projectID)

	if err != nil {
		m.logger.Error("services-modules", "failed to fetch with ProjectID %d: %v", projectID, err)
		return dbsqlc.Module{}, err
	}

	return module, nil
}

func (m *moduleServiceImpl) GetAll(ctx context.Context) ([]dbsqlc.Module, error) {
	if modules, err := m.db.GetAllModules(context.Background()); err != nil {
		m.logger.Error("failed to fetch modules", "error", err)
		return nil, err
	} else {
		return modules, nil
	}
}

// Implement the Update to change field in table
func (m *moduleServiceImpl) Update(ctx context.Context, request schema.UpdateProjectModuleRequest) (bool, error) {
	err := m.db.UpdateProjectModule(ctx, dbsqlc.UpdateProjectModuleParams{
		ID:   request.ID,
		Name: request.Name,
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
		m.logger.Error("services-modules", "failed to delete with ProjectID %d: %v", id, err)
		return err
	}

	return nil
}
