package services

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"net"
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
	BaseURL           string
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
	baseURL string
}

// NewNotificationService creates a new notification service
func NewNotificationService(logger logging.Logger, smtpCfg config.SMTPConfiguration, baseURL string) NotificationService {
	return &notificationServiceImpl{
		logger:  logger,
		smtpCfg: smtpCfg,
		baseURL: baseURL,
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
		BaseURL:        n.baseURL,
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
		BaseURL:        n.baseURL,
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
		BaseURL:        n.baseURL,
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
		BaseURL:        n.baseURL,
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

	// Build headers with From and optional Reply-To
	headers := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n", n.smtpCfg.From, recipientEmail, subject)
	if n.smtpCfg.ReplyTo != "" {
		headers = fmt.Sprintf("%sReply-To: %s\r\n", headers, n.smtpCfg.ReplyTo)
	}

	msg := []byte(headers + "\r\n" + body.String())

	addr := fmt.Sprintf("%s:%d", n.smtpCfg.Host, n.smtpCfg.Port)

	// Use SMTPS (implicit TLS) if SSL is requested (commonly port 465)
	if n.smtpCfg.SSL {
		tlsConfig := &tls.Config{
			ServerName: n.smtpCfg.Host,
		}

		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			n.logger.Error("failed to dial SMTPS", "addr", addr, "error", err)
			return fmt.Errorf("failed to dial SMTPS: %w", err)
		}

		c, err := smtp.NewClient(conn, n.smtpCfg.Host)
		if err != nil {
			n.logger.Error("failed to create SMTP client", "error", err)
			return fmt.Errorf("failed to create SMTP client: %w", err)
		}
		defer c.Close()

		auth := smtp.PlainAuth("", n.smtpCfg.Username, n.smtpCfg.Password, n.smtpCfg.Host)
		if err = c.Auth(auth); err != nil {
			n.logger.Error("SMTP auth failed", "error", err)
			return fmt.Errorf("SMTP auth failed: %w", err)
		}

		if err = c.Mail(n.smtpCfg.From); err != nil {
			n.logger.Error("failed to set mail from", "from", n.smtpCfg.From, "error", err)
			return fmt.Errorf("failed to set mail from: %w", err)
		}
		if err = c.Rcpt(recipientEmail); err != nil {
			n.logger.Error("failed to set rcpt", "recipient", recipientEmail, "error", err)
			return fmt.Errorf("failed to set rcpt: %w", err)
		}

		wc, err := c.Data()
		if err != nil {
			n.logger.Error("failed to get data writer", "error", err)
			return fmt.Errorf("failed to get data writer: %w", err)
		}
		_, err = wc.Write(msg)
		if err != nil {
			n.logger.Error("failed to write message", "error", err)
			_ = wc.Close()
			return fmt.Errorf("failed to write message: %w", err)
		}
		if err = wc.Close(); err != nil {
			n.logger.Error("failed to close data writer", "error", err)
			return fmt.Errorf("failed to close data writer: %w", err)
		}

		if err = c.Quit(); err != nil {
			n.logger.Error("failed to quit SMTP client", "error", err)
			return fmt.Errorf("failed to quit SMTP client: %w", err)
		}

		return nil
	}

	// Plain SMTP (may start TLS via STARTTLS if server supports it)
	auth := smtp.PlainAuth("", n.smtpCfg.Username, n.smtpCfg.Password, n.smtpCfg.Host)

	// Try to use StartTLS if server advertises it
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		n.logger.Error("failed to dial SMTP", "addr", addr, "error", err)
		return fmt.Errorf("failed to dial SMTP: %w", err)
	}
	c, err := smtp.NewClient(conn, n.smtpCfg.Host)
	if err != nil {
		n.logger.Error("failed to create SMTP client", "error", err)
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer c.Close()

	if ok, _ := c.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{ServerName: n.smtpCfg.Host}
		if err = c.StartTLS(tlsConfig); err != nil {
			n.logger.Error("STARTTLS failed", "error", err)
		}
	}

	if err = c.Auth(auth); err != nil {
		n.logger.Error("SMTP auth failed", "error", err)
		return fmt.Errorf("SMTP auth failed: %w", err)
	}

	if err = c.Mail(n.smtpCfg.From); err != nil {
		n.logger.Error("failed to set mail from", "from", n.smtpCfg.From, "error", err)
		return fmt.Errorf("failed to set mail from: %w", err)
	}
	if err = c.Rcpt(recipientEmail); err != nil {
		n.logger.Error("failed to set rcpt", "recipient", recipientEmail, "error", err)
		return fmt.Errorf("failed to set rcpt: %w", err)
	}

	wc, err := c.Data()
	if err != nil {
		n.logger.Error("failed to get data writer", "error", err)
		return fmt.Errorf("failed to get data writer: %w", err)
	}
	_, err = wc.Write(msg)
	if err != nil {
		n.logger.Error("failed to write message", "error", err)
		_ = wc.Close()
		return fmt.Errorf("failed to write message: %w", err)
	}
	if err = wc.Close(); err != nil {
		n.logger.Error("failed to close data writer", "error", err)
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	if err = c.Quit(); err != nil {
		n.logger.Error("failed to quit SMTP client", "error", err)
		return fmt.Errorf("failed to quit SMTP client: %w", err)
	}

	return nil

	return nil
}
