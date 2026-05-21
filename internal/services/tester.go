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
	Assign(ctx context.Context, projectID, userID int64, role string, assignedBy string) error
	AssignBulk(ctx context.Context, projectID int64, request *schema.BulkAssignTesters, assignedBy string) error
	FindAll(context.Context) ([]schema.Tester, error)
	FindByProjectID(context.Context, int64) ([]schema.Tester, error)
	Invite(context.Context, any) (any, error)
	FindByID(context.Context, int32) (*schema.Tester, error)
	DeleteTester(ctx context.Context, testerID int32) error
	UpdateRole(ctx context.Context, userID int32, role string) error
}

type testerServiceImpl struct {
	queries             *dbsqlc.Queries
	logger              logging.Logger
	notificationService NotificationService
	userService         UserService
}

func NewTesterService(db *dbsqlc.Queries, logger logging.Logger, notificationService NotificationService, userService UserService) TesterService {
	return &testerServiceImpl{
		queries:             db,
		logger:              logger,
		notificationService: notificationService,
		userService:         userService,
	}
}

func (s *testerServiceImpl) FindAll(ctx context.Context) ([]schema.Tester, error) {
	projectTesters, err := s.queries.GetAllProjectTesters(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch project testers: %w", err)
	}

	seen := make(map[int64]bool)
	testers := make([]schema.Tester, 0, len(projectTesters))

	for _, tester := range projectTesters {
		if seen[int64(tester.UserID)] {
			continue
		}
		seen[int64(tester.UserID)] = true

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

func (s *testerServiceImpl) Assign(ctx context.Context, projectID, userID int64, role string, assignedBy string) error {
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

	// Send notification email asynchronously (non-blocking)
	go func() {
		// Get user information
		user, err := s.queries.GetUser(ctx, int32(userID))
		if err != nil {
			s.logger.Error("tester-service", "failed to get user for notification", "error", err, "user_id", userID)
			return
		}

		// Get project information
		project, err := s.queries.GetProject(ctx, int32(projectID))
		if err != nil {
			s.logger.Error("tester-service", "failed to get project for notification", "error", err, "project_id", projectID)
			return
		}

		// Send the notification
		notificationErr := s.notificationService.SendTesterAssignedNotification(
			ctx,
			user.Email,
			user.DisplayName.String,
			project.Title,
			projectID,
			assignedBy,
			role,
		)
		if notificationErr != nil {
			s.logger.Error("tester-service", "failed to send tester assignment notification", "error", notificationErr, "user_id", userID, "project_id", projectID)
		}
	}()

	return nil
}

func (s *testerServiceImpl) AssignBulk(ctx context.Context, projectID int64, request *schema.BulkAssignTesters, assignedBy string) error {
	if projectID != request.ProjectID {
		return fmt.Errorf("projectIDs in arguments do not match")
	}
	for _, assignment := range request.Testers {
		err := s.Assign(ctx, projectID, assignment.UserID, assignment.Role, assignedBy)
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

	seen := make(map[int64]bool)

	testers := make([]schema.Tester, 0, len(projectTesters))
	for _, tester := range projectTesters {
		if seen[int64(tester.UserID)] {
			continue
		}
		seen[int64(tester.UserID)] = true

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
