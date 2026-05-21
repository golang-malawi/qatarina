package services

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"net/smtp"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/logging"
)

// NotificationType defines different types of notifications
type NotificationType string

const (
	NotificationTesterAssigned   NotificationType = "tester_assigned"
	NotificationTestPlanAdded    NotificationType = "test_plan_added"
	NotificationTestCaseAssigned NotificationType = "test_case_assigned"
	NotificationTestPlanDueSoon  NotificationType = "test_plan_due_soon"
)

// NotificationPayload contains data for sending notifications
type NotificationPayload struct {
	Type              NotificationType
	RecipientEmail    string
	RecipientName     string
	ProjectName       string
	ProjectID         int64
	TestPlanName      string
	TestPlanID        int64
	TestCaseName      string
	TestCaseCode      string
	TestCaseID        string
	Role              string
	DueDate           *time.Time
	AssignedByName    string
	AdditionalMessage string
}

// NotificationService defines methods for sending notifications
type NotificationService interface {
	SendNotification(ctx context.Context, payload NotificationPayload) error
	SendTesterAssignedNotification(ctx context.Context, recipientEmail, recipientName, projectName string, projectID int64, assignedByName, role string) error
	SendTestPlanAddedNotification(ctx context.Context, recipientEmail, recipientName, projectName, testPlanName string, projectID, testPlanID int64, assignedByName string) error
	SendTestCaseAssignedNotification(ctx context.Context, recipientEmail, recipientName, projectName, testCaseName, testCaseCode string, projectID int64, testCaseID string, assignedByName string) error
	SendTestPlanDueReminderNotification(ctx context.Context, recipientEmail, recipientName, projectName, testPlanName string, projectID, testPlanID int64, dueDate time.Time) error
}

type notificationServiceImpl struct {
	logger  logging.Logger
	smtpCfg config.SMTPConfiguration
}

// NewNotificationService creates a new notification service
func NewNotificationService(logger logging.Logger, smtpCfg config.SMTPConfiguration) NotificationService {
	return &notificationServiceImpl{
		logger:  logger,
		smtpCfg: smtpCfg,
	}
}

// SendNotification sends a notification based on the payload type
func (n *notificationServiceImpl) SendNotification(ctx context.Context, payload NotificationPayload) error {
	switch payload.Type {
	case NotificationTesterAssigned:
		return n.sendEmailWithTemplate(ctx, payload.RecipientEmail, "Tester Assignment Notification", "tester_assigned_email.html", payload)
	case NotificationTestPlanAdded:
		return n.sendEmailWithTemplate(ctx, payload.RecipientEmail, "Test Plan Assignment", "test_plan_added_email.html", payload)
	case NotificationTestCaseAssigned:
		return n.sendEmailWithTemplate(ctx, payload.RecipientEmail, "Test Case Assignment", "test_case_assigned_email.html", payload)
	case NotificationTestPlanDueSoon:
		return n.sendEmailWithTemplate(ctx, payload.RecipientEmail, "Test Plan Due Date Reminder", "test_plan_due_reminder_email.html", payload)
	default:
		return fmt.Errorf("unknown notification type: %s", payload.Type)
	}
}

// SendTesterAssignedNotification sends an email when a user is assigned as a tester
func (n *notificationServiceImpl) SendTesterAssignedNotification(ctx context.Context, recipientEmail, recipientName, projectName string, projectID int64, assignedByName, role string) error {
	payload := NotificationPayload{
		Type:           NotificationTesterAssigned,
		RecipientEmail: recipientEmail,
		RecipientName:  recipientName,
		ProjectName:    projectName,
		ProjectID:      projectID,
		AssignedByName: assignedByName,
		Role:           role,
	}
	return n.SendNotification(ctx, payload)
}

// SendTestPlanAddedNotification sends an email when a user is added to a test plan
func (n *notificationServiceImpl) SendTestPlanAddedNotification(ctx context.Context, recipientEmail, recipientName, projectName, testPlanName string, projectID, testPlanID int64, assignedByName string) error {
	payload := NotificationPayload{
		Type:           NotificationTestPlanAdded,
		RecipientEmail: recipientEmail,
		RecipientName:  recipientName,
		ProjectName:    projectName,
		TestPlanName:   testPlanName,
		ProjectID:      projectID,
		TestPlanID:     testPlanID,
		AssignedByName: assignedByName,
	}
	return n.SendNotification(ctx, payload)
}

// SendTestCaseAssignedNotification sends an email when a user is assigned a test case
func (n *notificationServiceImpl) SendTestCaseAssignedNotification(ctx context.Context, recipientEmail, recipientName, projectName, testCaseName, testCaseCode string, projectID int64, testCaseID string, assignedByName string) error {
	payload := NotificationPayload{
		Type:           NotificationTestCaseAssigned,
		RecipientEmail: recipientEmail,
		RecipientName:  recipientName,
		ProjectName:    projectName,
		TestCaseName:   testCaseName,
		TestCaseCode:   testCaseCode,
		ProjectID:      projectID,
		TestCaseID:     testCaseID,
		AssignedByName: assignedByName,
	}
	return n.SendNotification(ctx, payload)
}

// SendTestPlanDueReminderNotification sends a reminder email for upcoming test plan due dates
func (n *notificationServiceImpl) SendTestPlanDueReminderNotification(ctx context.Context, recipientEmail, recipientName, projectName, testPlanName string, projectID, testPlanID int64, dueDate time.Time) error {
	payload := NotificationPayload{
		Type:           NotificationTestPlanDueSoon,
		RecipientEmail: recipientEmail,
		RecipientName:  recipientName,
		ProjectName:    projectName,
		TestPlanName:   testPlanName,
		ProjectID:      projectID,
		TestPlanID:     testPlanID,
		DueDate:        &dueDate,
	}
	return n.SendNotification(ctx, payload)
}

// sendEmailWithTemplate renders a template and sends an email
func (n *notificationServiceImpl) sendEmailWithTemplate(ctx context.Context, recipientEmail, subject, templateFile string, data interface{}) error {
	t, err := template.ParseFiles(fmt.Sprintf("internal/templates/%s", templateFile))
	if err != nil {
		n.logger.Error("failed to load email template", "template", templateFile, "error", err)
		return fmt.Errorf("failed to load email template: %v", err)
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		n.logger.Error("failed to execute email template", "template", templateFile, "error", err)
		return fmt.Errorf("failed to execute email template: %v", err)
	}

	msg := []byte(fmt.Sprintf(
		"To: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"Subject: %s\r\n\r\n"+
			"%s", recipientEmail, subject, body.String()))

	addr := fmt.Sprintf("%s:%d", n.smtpCfg.Host, n.smtpCfg.Port)
	auth := smtp.PlainAuth("", n.smtpCfg.Username, n.smtpCfg.Password, n.smtpCfg.Host)

	err = smtp.SendMail(addr, auth, n.smtpCfg.From, []string{recipientEmail}, msg)
	if err != nil {
		n.logger.Error("SMTP send failed", "recipient", recipientEmail, "error", err)
		return fmt.Errorf("failed to send notification email: %w", err)
	}

	return nil
}
