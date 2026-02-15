package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type TesterService interface {
	Assign(ctx context.Context, projectID, userID int64, role string) error
	AssignBulk(ctx context.Context, projectID int64, request *schema.BulkAssignTesters) error
	FindAll(context.Context) ([]schema.Tester, error)
	FindByProjectID(context.Context, int64) ([]schema.Tester, error)
	Invite(context.Context, any) (any, error)
	FindByID(context.Context, int32) (*schema.Tester, error)
	DeleteTester(ctx context.Context, testerID int32) error
	UpdateRole(ctx context.Context, userID int32, role string) error
}

type testerServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTesterService(db *dbsqlc.Queries, logger logging.Logger) TesterService {
	return &testerServiceImpl{
		queries: db,
		logger:  logger,
	}
}

func (s *testerServiceImpl) FindAll(ctx context.Context) ([]schema.Tester, error) {
	projectTesters, err := s.queries.GetAllProjectTesters(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project testers: %w", err)
	}
	testers := make([]schema.Tester, 0, len(projectTesters))
	for _, tester := range projectTesters {
		testers = append(testers, schema.Tester{
			UserID:      int64(tester.UserID),
			ProjectID:   int64(tester.ProjectID),
			Name:        tester.TesterName.String,
			Email:       tester.TesterEmail,
			Project:     tester.Project,
			Role:        tester.Role,
			LastLoginAt: tester.TesterLastLoginAt.Time.Format(time.DateTime),
			CreatedAt:   tester.CreatedAt.Time.Format(time.DateTime),
			UpdatedAt:   tester.UpdatedAt.Time.Format(time.DateTime),
		})
	}
	return testers, nil
}

func (s *testerServiceImpl) Invite(context.Context, any) (any, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *testerServiceImpl) Assign(ctx context.Context, projectID, userID int64, role string) error {
	_, err := s.queries.AssignTesterToProject(ctx, dbsqlc.AssignTesterToProjectParams{
		ProjectID: int32(projectID),
		UserID:    int32(userID),
		Role:      role,
		IsActive:  true,
	})
	if err != nil {
		s.logger.Error("tester-service", "failed to assign tester to project", "error", err, "project_id", projectID, "user_id", userID)
		return err
	}
	return nil
}

func (s *testerServiceImpl) AssignBulk(ctx context.Context, projectID int64, request *schema.BulkAssignTesters) error {
	if projectID != request.ProjectID {
		return fmt.Errorf("projectIDs in arguments do not match")
	}
	for _, assignment := range request.Testers {
		err := s.Assign(ctx, projectID, assignment.UserID, assignment.Role)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *testerServiceImpl) FindByProjectID(ctx context.Context, projectID int64) ([]schema.Tester, error) {
	projectTesters, err := s.queries.GetTestersByProject(ctx, int32(projectID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return []schema.Tester{}, nil
		}
		return nil, fmt.Errorf("failed to get tester IDs for project %d: %w", projectID, err)
	}

	testers := make([]schema.Tester, 0, len(projectTesters))
	for _, tester := range projectTesters {
		testers = append(testers, schema.Tester{
			UserID:      int64(tester.UserID),
			ProjectID:   int64(tester.ProjectID),
			Name:        tester.TesterName.String,
			Email:       tester.TesterEmail,
			Project:     tester.Project,
			Role:        tester.Role,
			LastLoginAt: tester.TesterLastLoginAt.Time.Format(time.DateTime),
			CreatedAt:   tester.CreatedAt.Time.Format(time.DateTime),
			UpdatedAt:   tester.UpdatedAt.Time.Format(time.DateTime),
		})
	}
	return testers, nil
}

func (t *testerServiceImpl) FindByID(ctx context.Context, id int32) (*schema.Tester, error) {
	dbTester, err := t.queries.GetTesterByID(ctx, id)
	if err != nil {
		t.logger.Error("failed to find the project tester", "error", err)
		return nil, err
	}

	tester := &schema.Tester{
		UserID:      int64(dbTester.UserID),
		ProjectID:   int64(dbTester.ProjectID),
		Name:        dbTester.TesterName.String,
		Email:       dbTester.TesterEmail,
		Project:     dbTester.Project,
		Role:        dbTester.Role,
		LastLoginAt: dbTester.TesterLastLoginAt.Time.String(),
		CreatedAt:   dbTester.CreatedAt.Time.String(),
		UpdatedAt:   dbTester.UpdatedAt.Time.String(),
	}
	return tester, nil
}

func (t *testerServiceImpl) DeleteTester(ctx context.Context, testerID int32) error {
	rowsAffected, err := t.queries.DeleteProjectTester(ctx, testerID)
	if err != nil {
		t.logger.Error("tester-service", "failed to delete tester", "error", err)
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (t *testerServiceImpl) UpdateRole(ctx context.Context, userID int32, role string) error {
	rowsAffected, err := t.queries.UpdateProjectTesterRole(ctx, dbsqlc.UpdateProjectTesterRoleParams{
		UserID: userID,
		Role:   role,
	})
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}
