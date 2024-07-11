package services

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type AuthService interface {
	SignIn(*schema.LoginRequest) (*schema.LoginResponse, error)
	ResetPassword(email string) error
	ChangePassword(*schema.ChangePasswordRequest) error
}

type authServiceImpl struct {
	authConfig *config.AuthConfiguration
	queries    *dbsqlc.Queries
}

func NewAuthService(authConfig *config.AuthConfiguration, db *dbsqlc.Queries) AuthService {
	return &authServiceImpl{
		authConfig: authConfig,
		queries:    db,
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
		return nil, err
	}

	if ok := common.CheckPasswordHash(request.Password, user.Password); !ok {
		return nil, fmt.Errorf("invalid email and password combination")
	}

	res := &schema.LoginResponse{
		UserID:      int64(user.ID),
		DisplayName: user.DisplayName.String,
		Email:       user.Email,
		ExpiresAt:   0,
	}

	token := generateJWTToken(res, 3600)
	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))
	if err != nil {
		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
	}

	res.Token = tokenStr
	return res, nil
}

func (a *authServiceImpl) ResetPassword(email string) error {
	panic("not implemented")
}

func (a *authServiceImpl) ChangePassword(request *schema.ChangePasswordRequest) error {
	panic("not implemented")
}
