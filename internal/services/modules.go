package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type ModuleService interface {
	Create(
		projectID int32,
		name string,
		code string,
		priority int32,
	) (bool, error)
}

func NewModuleService(queries *dbsqlc.Queries) ModuleService {
	return &moduleServiceImpl{
		db: queries,
	}
}

type moduleServiceImpl struct {
	db *dbsqlc.Queries
}

func (m *moduleServiceImpl) Create(
	projectID int32,
	name string,
	code string,
	priority int32,
) (bool, error) {
	_, err := m.db.GetProjectModules(context.Background(), dbsqlc.GetProjectModulesParams{
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
