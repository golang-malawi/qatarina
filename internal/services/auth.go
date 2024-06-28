package services

import (
	"github.com/golang-malawi/qatarina/internal/schema"
)

type AuthService interface {
	SignIn(*schema.LoginRequest) (*schema.LoginResponse, error)
	ResetPassword(email string) error
	ChangePassword(*schema.ChangePasswordRequest) error
}
