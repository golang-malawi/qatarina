package services

import (
	"context"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type ProjectService interface {
	Create(context.Context, *schema.NewProjectRequest) (*dbsqlc.Project, error)
	FindAll(context.Context) ([]dbsqlc.Project, error)
	FindByID(context.Context, int64) (*dbsqlc.Project, error)
	Update(context.Context, *schema.UpdateProjectRequest) (*dbsqlc.Project, error)
	DeleteProject(context.Context, int64) error
}

type projectServiceImpl struct {
	name   loggedmodule.Name
	db     *dbsqlc.Queries
	logger logging.Logger
}

func NewProjectService(db *dbsqlc.Queries, logger logging.Logger) ProjectService {
	return &projectServiceImpl{
		name:   "projects-service",
		db:     db,
		logger: logger,
	}
}

// Create implements ProjectService.
func (s *projectServiceImpl) Create(ctx context.Context, request *schema.NewProjectRequest) (*dbsqlc.Project, error) {
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
func (s *projectServiceImpl) FindAll(ctx context.Context) ([]dbsqlc.Project, error) {
	if projects, err := s.db.ListProjects(context.Background()); err != nil {
		s.logger.Error(s.name, "failed to fetch projects", "error", err)
		return nil, err
	} else {
		return projects, nil
	}
}

// FindByID implements ProjectService.
func (s *projectServiceImpl) FindByID(ctx context.Context, projectID int64) (*dbsqlc.Project, error) {
	if project, err := s.db.GetProject(context.Background(), int32(projectID)); err != nil {
		s.logger.Error(s.name, "failed to fetch project", "projectID", projectID, "error", err)
		return nil, err
	} else {
		return &project, nil
	}
}

// FindByID implements ProjectService.
func (s *projectServiceImpl) Update(ctx context.Context, request *schema.UpdateProjectRequest) (*dbsqlc.Project, error) {
	projectID := request.ID
	if project, err := s.db.GetProject(context.Background(), int32(projectID)); err != nil {
		s.logger.Error(s.name, "failed to fetch project", "projectID", projectID, "error", err)
		return nil, err
	} else {
		return &project, nil
	}
}

// DeleteProject implements ProjectService.
func (s *projectServiceImpl) DeleteProject(ctx context.Context, projectID int64) error {
	if _, err := s.db.DeleteProject(context.Background(), int32(projectID)); err != nil {
		s.logger.Error(s.name, "failed to delete projects", "projectID", projectID, "error", err)
		return err
	}
	return nil
}
