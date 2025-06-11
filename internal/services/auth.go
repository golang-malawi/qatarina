package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

var ErrUserAlreadyExists = errors.New("user with given email already exists")

type AuthService interface {
	SignIn(*schema.LoginRequest) (*schema.LoginResponse, error)
	SignUp(*schema.SignUpRequest) (*schema.LoginResponse, error)
	ResetPassword(ctx context.Context, email string) error
	ChangePassword(ctx context.Context, request *schema.ChangePasswordRequest) error
}

type authServiceImpl struct {
	authConfig *config.AuthConfiguration
	queries    *dbsqlc.Queries
	logger     logging.Logger
}

func NewAuthService(authConfig *config.AuthConfiguration, db *dbsqlc.Queries, logger logging.Logger) AuthService {
	return &authServiceImpl{
		authConfig: authConfig,
		queries:    db,
		logger:     logger,
	}
}

func generateJWTToken(res *schema.LoginResponse, expireAfter int64) *jwt.Token {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["UserID"] = res.UserID
	claims["Email"] = res.Email
	claims["Name"] = res.DisplayName
	claims["exp"] = expireAfter

	return token
}

func (a *authServiceImpl) SignIn(request *schema.LoginRequest) (*schema.LoginResponse, error) {
	user, err := a.queries.FindUserLoginByEmail(context.Background(), request.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			a.logger.Debug("auth-service", "failed to find user from login request", "email", request.Email)
			return nil, ErrInvalidCredentials
		}
		a.logger.Error("auth-service", "failed to process login request", "error", err)
		return nil, err
	}
	a.logger.Info("auth-service", "handling request data", "user", user, "request", request)

	if !common.CheckPasswordHash(request.Password, user.Password) {
		a.logger.Debug("auth-service", "invalid password provided", "email", request.Email, "error", err)
		return nil, ErrInvalidCredentials
	}

	res := &schema.LoginResponse{
		UserID:      int64(user.ID),
		DisplayName: user.DisplayName.String,
		Email:       user.Email,
		ExpiresAt:   0,
	}

	token := generateJWTToken(res, time.Now().Add(time.Hour*6).Unix())
	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))
	if err != nil {
		a.logger.Error("auth-service", "failed to create a token", "error", err)
		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
	}

	res.Token = tokenStr
	return res, nil
}

func (a *authServiceImpl) SignUp(request *schema.SignUpRequest) (*schema.LoginResponse, error) {
	_, err := a.queries.FindUserLoginByEmail(context.Background(), request.Email)
	// TODO: make this error handling better - this is clunky
	if !errors.Is(err, sql.ErrNoRows) {
		a.logger.Error("auth-service", "user with given email already exists", "email", request.Email, "error", err)
		return nil, ErrUserAlreadyExists
	}

	// TODO: create organization for the user

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

	userID, err := a.queries.CreateUser(context.Background(), userParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create user got %v", err)
	}

	res := &schema.LoginResponse{
		UserID:      int64(userID),
		DisplayName: request.DisplayName,
		Email:       request.Email,
		ExpiresAt:   0,
	}

	token := generateJWTToken(res, time.Now().Add(time.Hour*6).Unix())
	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))
	if err != nil {
		a.logger.Error("auth-service", "failed to create a token", "error", err)
		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
	}

	res.Token = tokenStr
	return res, nil
}

func (a *authServiceImpl) ResetPassword(ctx context.Context, email string) error {
	panic("not implemented")
}

func (a *authServiceImpl) ChangePassword(ctx context.Context, request *schema.ChangePasswordRequest) error {
	panic("not implemented")
}
