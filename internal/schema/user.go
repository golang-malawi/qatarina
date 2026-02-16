package schema

type UserCompact struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"displayName"`
	Email       string `json:"username"`
	CreatedAt   string `json:"createdAt"`
}

// CompactUserListResponse list of users but compact form
type CompactUserListResponse struct {
	Total int           `json:"total"`
	Users []UserCompact `json:"users"`
}

type SignUpRequest struct {
	FirstName   string `json:"firstname" validate:"required"`
	LastName    string `json:"lastname" validate:"required"`
	DisplayName string `json:"display_name" validate:"required"`
	Email       string `json:"email" validate:"required"`
	Password    string `json:"password" validate:"required"`
}

type NewUserRequest struct {
	OrgID       int64  `json:"organization_id" validate:"-"`
	FirstName   string `json:"first_name" validate:"required"`
	LastName    string `json:"last_name" validate:"required"`
	DisplayName string `json:"display_name" validate:"required"`
	Email       string `json:"email" validate:"required"`
	Password    string `json:"password" validate:"required"`
}

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

type UpdateUserRequest struct {
	ID          int32  `json:"id" validate:"-"`
	FirstName   string `json:"first_name" validate:"required"`
	LastName    string `json:"last_name" validate:"required"`
	DisplayName string `json:"display_name" validate:"required"`
	Phone       string `json:"phone" validate:"e164"`
	OrgID       int32  `json:"org_id" validate:"required"`
	CountryIso  string `json:"country_iso" validate:"iso3166_1_alpha2"`
	City        string `json:"city" validate:"required"`
	Address     string `json:"address" validate:"-"`
}

type InviteUserRequest struct {
}

type RefreshTokenRequest struct {
}

type RefreshTokenResponse struct {
}

type User struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	DisplayName  string `json:"display_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone,omitempty"`
	OrgID        int32  `json:"org_id,omitempty"`
	CountryIso   string `json:"country_iso,omitempty"`
	City         string `json:"city,omitempty"`
	Address      string `json:"address,omitempty"`
	IsActivated  bool   `json:"is_activated"`
	IsReviewed   bool   `json:"is_reviewed"`
	IsSuperAdmin bool   `json:"is_super_admin"`
	IsVerified   bool   `json:"is_verified"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}
