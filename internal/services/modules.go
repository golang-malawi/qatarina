package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
)

type ModuleService interface {
	Create(
		projectID int32,
		name string,
		code string,
		priority int32,
	) (bool, error)
	// Get retrieves all modules in the context
	Get(ctx context.Context, projectID int32) (dbsqlc.Module, error)
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
	projectID int32,
	name string,
	code string,
	priority int32,
) (bool, error) {
	if projectID == 0 || name == "" || code == "" || priority == 0 {
		return false, fmt.Errorf("empty field(s) found")
	}
	_, err := m.db.CreateProjectModules(context.Background(), dbsqlc.CreateProjectModulesParams{
		ProjectID: projectID,
		Name:      name,
		Code:      code,
		Priority:  priority,
	})

	if err != nil {
		return false, fmt.Errorf("failed to create module %v", err)

	}

	return true, nil
}

// Implement the Get method to retrive modules from the table
func (m *moduleServiceImpl) Get(ctx context.Context, projectID int32) (dbsqlc.Module, error) {
	module, err := m.db.GetProjectModules(ctx, projectID)

	if err != nil {
		m.logger.Error("services-modules", "failed to fetch with ProjectID %d: %v", projectID, err)
		return dbsqlc.Module{}, err
	}

	return module, nil
}
