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
	GetOne(context.Context, int32) (dbsqlc.ProjectTester, error)
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
	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	testers := make([]schema.Tester, 0)
	for _, user := range users {
		testers = append(testers, schema.NewTesterFromUser(&user))
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
			Project:     tester.Project,
			Role:        tester.Role,
			LastLoginAt: tester.TesterLastLoginAt.Time.Format(time.DateTime),
			CreatedAt:   tester.CreatedAt.Time.Format(time.DateTime),
			UpdatedAt:   tester.UpdatedAt.Time.Format(time.DateTime),
		})
	}
	return testers, nil
}

func (t *testerServiceImpl) GetOne(ctx context.Context, id int32) (dbsqlc.ProjectTester, error) {
	tester, err := t.queries.GetProjectTester(ctx, id)
	if err != nil {
		t.logger.Error("failed to find the project tester", "error", err)
		return dbsqlc.ProjectTester{}, err
	}
	return tester, nil
}
