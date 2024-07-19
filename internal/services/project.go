package services

import (
	"context"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type ProjectService interface {
	Create(*schema.NewProjectRequest) (*dbsqlc.Project, error)
	FindAll() ([]dbsqlc.Project, error)
}

type projectServiceImpl struct {
	name   string
	db     *dbsqlc.Queries
	logger logging.Logger
}

func NewProjectService(db *dbsqlc.Queries, logger logging.Logger) ProjectService {
	return &projectServiceImpl{
		name:   "project-service",
		db:     db,
		logger: logger,
	}
}

// Create implements ProjectService.
func (s *projectServiceImpl) Create(request *schema.NewProjectRequest) (*dbsqlc.Project, error) {
	projectID, err := s.db.CreateProject(context.Background(), dbsqlc.CreateProjectParams{
		Title:       request.Name,
		Description: request.Description,
		Version:     common.NullString(request.Version),
		IsActive:    common.TrueNullBool(),
		IsPublic:    common.TrueNullBool(),
		WebsiteUrl:  common.NullString(request.WebsiteURL),
		GithubUrl:   common.NullString(request.GitHubURL),
		OwnerUserID: int32(request.ProjectOwnerID),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	})
	if err != nil {
		s.logger.Error(s.name, "failed to create project", "error", err)
		return nil, err
	}
	project, err := s.db.GetProject(context.Background(), projectID)
	return &project, err
}

// FindAll implements ProjectService.
func (s *projectServiceImpl) FindAll() ([]dbsqlc.Project, error) {
	if projects, err := s.db.ListProjects(context.Background()); err != nil {
		s.logger.Error(s.name, "failed to fetch projects", "error", err)
		return nil, err
	} else {
		return projects, nil
	}
}

// FindByID implements ProjectService.
func (s *projectServiceImpl) FindByID(projectID int64) (*dbsqlc.Project, error) {
	if project, err := s.db.GetProject(context.Background(), int32(projectID)); err != nil {
		s.logger.Error(s.name, "failed to fetch project", "projectID", projectID, "error", err)
		return nil, err
	} else {
		return &project, nil
	}
}

// DeleteProject implements ProjectService.
func (s *projectServiceImpl) DeleteProject(projectID int64) error {
	if _, err := s.db.DeleteProject(context.Background(), int32(projectID)); err != nil {
		s.logger.Error(s.name, "failed to delete projects", "projectID", projectID, "error", err)
		return err
	}
	return nil
}
