package services

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"html/template"
	"net/smtp"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
)

type TesterService interface {
	Assign(ctx context.Context, projectID, userID int64, role string) error
	AssignBulk(ctx context.Context, projectID int64, request *schema.BulkAssignTesters) error
	FindAll(context.Context) ([]schema.Tester, error)
	FindByProjectID(context.Context, int64) ([]schema.Tester, error)
	Invite(ctx context.Context, senderEmail, receiverEmail, testCaseID string, projectID int64) error
	FindByID(context.Context, int32) (*schema.Tester, error)
}

type testerServiceImpl struct {
	queries   *dbsqlc.Queries
	logger    logging.Logger
	smtpCfg   config.SMTPConfiguration
	serverCfg config.HTTPServerConfiguration
}

func NewTesterService(db *dbsqlc.Queries, logger logging.Logger, smtpCfg config.SMTPConfiguration, serverCfg config.HTTPServerConfiguration) TesterService {
	return &testerServiceImpl{
		queries:   db,
		logger:    logger,
		smtpCfg:   smtpCfg,
		serverCfg: serverCfg,
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

func (s *testerServiceImpl) Invite(ctx context.Context, senderEmail, receiverEmail, testCaseID string, projectID int64) error {
	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	err := s.queries.CreateInvite(ctx, dbsqlc.CreateInviteParams{
		SenderEmail:   senderEmail,
		ReceiverEmail: receiverEmail,
		Token:         token,
		ExpiresAt:     common.NewNullTime(expiresAt),
		TestCaseID:    common.NewNullUUID(testCaseID),
	})
	if err != nil {
		s.logger.Error("failed to create tester invite", "error", err)
		return fmt.Errorf("failed to create tester invite: %v", err)
	}

	subject := "Qatarina Tester Invitation"

	template, err := template.ParseFiles("internal/templates/invite_email.html")
	if err != nil {
		return fmt.Errorf("failed to load email template: %v", err)
	}

	data := struct {
		BaseURL   string
		Token     string
		ExpiresAt string
	}{
		BaseURL:   fmt.Sprintf("%s/invite", s.serverCfg.InviteBaseURL),
		Token:     token,
		ExpiresAt: expiresAt.Format("Jan 2, 2006 15:04 MST"),
	}

	var body bytes.Buffer
	if err := template.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to execute email template: %v", err)
	}

	msg := []byte(fmt.Sprintf(
		"To: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"Subject: %s\r\n\r\n"+
			"%s", receiverEmail, subject, body.String(),
	))

	addr := fmt.Sprintf("%s:%d", s.smtpCfg.Host, s.smtpCfg.Port)
	auth := smtp.PlainAuth("", s.smtpCfg.Username, s.smtpCfg.Password, s.smtpCfg.Host)

	if err := smtp.SendMail(addr, auth, s.smtpCfg.From, []string{receiverEmail}, msg); err != nil {
		return fmt.Errorf("failed to send tester invite; %w", err)
	}

	return nil
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

func (t *testerServiceImpl) FindByID(ctx context.Context, id int32) (*schema.Tester, error) {
	dbTester, err := t.queries.GetTestersByID(ctx, id)
	if err != nil {
		t.logger.Error("failed to find the project tester", "error", err)
		return nil, err
	}

	tester := &schema.Tester{
		UserID:      int64(dbTester.ID),
		ProjectID:   int64(dbTester.ProjectID),
		Name:        dbTester.TesterName.String,
		Project:     dbTester.Project,
		Role:        dbTester.Role,
		LastLoginAt: dbTester.TesterLastLoginAt.Time.String(),
		CreatedAt:   dbTester.CreatedAt.Time.String(),
		UpdatedAt:   dbTester.UpdatedAt.Time.String(),
	}
	return tester, nil
}
