package schema

type UserCompact struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"displayName"`
	Email       string `json:"username"`
	CreatedAt   string `json:"createdAt"`
}

type SignUpRequest struct{}

type NewUserRequest struct{}

// LoginRequest request to authenticate a user on the platform
type LoginRequest struct {
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse response from a login request
type LoginResponse struct {
	UserID      int64  `json:"user_id"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Token       string `json:"token"`
	ExpiresAt   int64  `json:"expires_at"`
}

// ChangePasswordRequest request to change a password
type ChangePasswordRequest struct {
	UserID          int64  `json:"user_id" validate:"required"`
	OldPassword     string `json:"old_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}
