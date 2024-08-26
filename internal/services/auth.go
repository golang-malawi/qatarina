package services

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type AuthService interface {
	SignIn(*schema.LoginRequest) (*schema.LoginResponse, error)
	ResetPassword(email string) (*schema.ResetPasswordResponse, error)
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
		a.logger.Error("auth-service", "failed to process login request", "error", err)
		return nil, err
	}

	if ok := common.CheckPasswordHash(request.Password, user.Password); !ok {
		a.logger.Error("auth-service", "invalid password provided", "error", err)
		return nil, fmt.Errorf("invalid email and password combination")
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

func (a *authServiceImpl) ResetPassword(email string) (*schema.ResetPasswordResponse, error) {

	user, err := a.queries.FindUserLoginByEmail(context.Background(), email)

	if err != nil {
		a.logger.Error("auth-service", "failed to process login request", "error", err)
		return nil, err
	}

	//TODO:: move this method to its own file
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["UserID"] = user.ID
	claims["Email"] = user.Email
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))

	if err != nil {
		a.logger.Error("auth-service", "failed to create a token", "error", err)
		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
	}

	print(tokenStr)

	// send email with token
	// emailService.SendResetPasswordEmail(email, tokenStr)

	return &schema.ResetPasswordResponse{
		Message: "Password reset link has been sent to your email",
	}, nil

}
func (a *authServiceImpl) ChangePassword(ctx context.Context, request *schema.ChangePasswordRequest) error {
	panic("not implemented")
}
