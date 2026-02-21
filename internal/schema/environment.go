package schema

type EnvironmentRequest struct {
	ProjectID int64  `json:"project_id" validate:"required"`
	Name      string `json:"name" validate:"required,oneof=development staging production"`
	BaseURL   string `json:"base_url,omitempty" validate:"omitempty,url"`
}

type EnvironmentResponse struct {
	ID        int64  `json:"id"`
	ProjectID int64  `json:"project_id"`
	Name      string `json:"name"`
	BaseURL   string `json:"base_url"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type EnvironmentListResponse struct {
	Environments []EnvironmentResponse `json:"environments"`
}
