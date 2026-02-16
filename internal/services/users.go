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
	_ "github.com/lib/pq"
)

var (
	ErrEmailAlreadyInUse = errors.New("email or username already in use")
)

type UserService interface {
	// FindAll finds all users in the system
	FindAll(context.Context) (*schema.CompactUserListResponse, error)
	// Create creates a new user in the system with the given information
	// provided that the user's email is not already in use and that the information is valid
	Create(context.Context, *schema.NewUserRequest) (*dbsqlc.User, error)
	// GetOne retrives one user from system
	GetOne(ctx context.Context, id int32) (schema.User, error)
	// SearchUser searches the user in the system based on typed keywords
	Search(ctx context.Context, keyword string) ([]dbsqlc.User, error)
	//Update updates the user
	Update(context.Context, schema.UpdateUserRequest) (bool, error)
	//Delete used to delete user from the system
	Delete(ctx context.Context, id int32) error
	// Invite used to invite a user
	// SignIn allows user to access the system with given credentials
	// Invite used to invite user by email
	Invite(context.Context, string, string) error
}

type OrganizationUserService interface {
	// FindAll finds all users in a given organization
	FindAll(context.Context, int64) ([]dbsqlc.User, error)
}

type userServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
	smtpCfg config.SMTPConfiguration
}

func NewUserService(conn *dbsqlc.Queries, logger logging.Logger, smtpCfg config.SMTPConfiguration) UserService {
	return &userServiceImpl{
		queries: conn,
		logger:  logger,
		smtpCfg: smtpCfg,
	}
}

func (s *userServiceImpl) FindAll(ctx context.Context) (*schema.CompactUserListResponse, error) {
	response := &schema.CompactUserListResponse{}
	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return response, nil
		}
		return nil, fmt.Errorf("could not fetch users: %v", err)
	}
	response.Users = make([]schema.UserCompact, 0)
	for _, user := range users {
		response.Users = append(response.Users, schema.UserCompact{
			ID:          int64(user.ID),
			DisplayName: user.DisplayName.String,
			Email:       user.Email,
			CreatedAt:   user.CreatedAt.Time.Format(time.DateTime),
		})
	}
	return response, nil
}

func (s *userServiceImpl) Create(ctx context.Context, request *schema.NewUserRequest) (*dbsqlc.User, error) {

	existing, err := s.queries.FindUserLoginByEmail(ctx, request.Email)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("failed to run pre-check for existing account: %v", err)
		}
	}
	if existing.Email == request.Email && err == nil {
		return nil, ErrEmailAlreadyInUse
	}

	userParams := dbsqlc.CreateUserParams{
		FirstName:    request.FirstName,
		LastName:     request.LastName,
		DisplayName:  sql.NullString{String: request.DisplayName, Valid: true},
		Email:        request.Email,
		Password:     common.MustHashPassword(request.Password),
		IsActivated:  sql.NullBool{Bool: true, Valid: true},
		IsReviewed:   sql.NullBool{Bool: false, Valid: true},
		IsSuperAdmin: sql.NullBool{Bool: false, Valid: true},
		IsVerified:   sql.NullBool{Bool: false, Valid: true},
		CreatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
		UpdatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
	}

	userID, err := s.queries.CreateUser(context.Background(), userParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create user got %v", err)
	}

	user, err := s.queries.GetUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (u *userServiceImpl) GetOne(ctx context.Context, id int32) (schema.User, error) {
	user, err := u.queries.GetUser(ctx, id)
	if err != nil {
		u.logger.Error("failed to find the user", "error", err)
		return schema.User{}, err
	}
	return schema.User{
		ID:           int64(user.ID),
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		DisplayName:  user.DisplayName.String,
		Email:        user.Email,
		Phone:        user.Phone,
		OrgID:        user.OrgID.Int32,
		CountryIso:   user.CountryIso,
		City:         user.City.String,
		Address:      user.Address,
		IsActivated:  user.IsActivated.Bool,
		IsReviewed:   user.IsReviewed.Bool,
		IsSuperAdmin: user.IsSuperAdmin.Bool,
		IsVerified:   user.IsVerified.Bool,
		CreatedAt:    user.CreatedAt.Time.Format(time.DateTime),
		UpdatedAt:    user.UpdatedAt.Time.Format(time.DateTime),
	}, nil
}

func (u *userServiceImpl) Search(ctx context.Context, keyword string) ([]dbsqlc.User, error) {
	users, err := u.queries.SearchUsers(ctx, common.NullString(keyword))
	if err != nil {
		u.logger.Error("failed to search users with keyword %q: %w", keyword, err)
		return nil, err
	}
	if len(users) == 0 {
		return nil, fmt.Errorf("no users found matching %q", keyword)
	}
	return users, nil
}

func (u *userServiceImpl) Update(ctx context.Context, request schema.UpdateUserRequest) (bool, error) {
	err := u.queries.UpdateUser(ctx, dbsqlc.UpdateUserParams{
		ID:          request.ID,
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		DisplayName: common.NullString(request.DisplayName),
		Phone:       request.Phone,
		OrgID:       common.NewNullInt32(request.OrgID),
		CountryIso:  request.CountryIso,
		City:        common.NullString(request.City),
		Address:     request.Address,
	})
	if err != nil {
		u.logger.Error("failed to update user", "error", err)
		return false, fmt.Errorf("failed to update user")
	}
	return true, nil
}

func (u *userServiceImpl) Delete(ctx context.Context, id int32) error {
	_, err := u.queries.DeleteUser(ctx, id)
	if err != nil {
		u.logger.Error("failed to delete user", "error", err)
		return err
	}
	return nil
}

func (u *userServiceImpl) Invite(ctx context.Context, senderEmail, receiverEmail string) error {
	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	err := u.queries.CreateInvite(ctx, dbsqlc.CreateInviteParams{
		SenderEmail:   senderEmail,
		ReceiverEmail: receiverEmail,
		Token:         token,
		ExpiresAt:     common.NewNullTime(expiresAt),
	})
	if err != nil {
		u.logger.Error("failed to create invite", "error", err)
		return fmt.Errorf("failed to create invite: %v", err)
	}

	subject := "Qatarina invitation"

	// Load the invite email template from html file
	t, err := template.ParseFiles("internal/templates/invite_email.html")
	if err != nil {
		u.logger.Error("failed to load email template from file", "error", err)
		return fmt.Errorf("failed to load email template: %v", err)
	}

	// Data to inject into template
	data := struct {
		BaseURL   string
		Token     string
		ExpiresAt string
	}{
		BaseURL:   "https://qatarina.dev", // TODO: get this from configuration
		Token:     token,
		ExpiresAt: expiresAt.Format("Jan 2, 2006 15:04 MST"),
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		u.logger.Error("failed to excecute email template", "error", err)
		return fmt.Errorf("failed to excecute email template: %v", err)
	}

	msg := []byte(fmt.Sprintf(
		"To: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"Subject: %s\r\n\r\n"+
			"%s", receiverEmail, subject, body.String()))

	addr := fmt.Sprintf("%s:%d", u.smtpCfg.Host, u.smtpCfg.Port)

	auth := smtp.PlainAuth("", u.smtpCfg.Username, u.smtpCfg.Password, u.smtpCfg.Host)

	err = smtp.SendMail(addr, auth, u.smtpCfg.From, []string{receiverEmail}, msg)
	if err != nil {
		u.logger.Error("SMTP send failed", "error", err)
		return fmt.Errorf("failed to send the invite to email: %w", err)
	}
	return nil
}
