package schema

type EnvironmentRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description,omitempty"`
	BaseURL     string `json:"base_url,omitempty" validate:"omitempty,url"`
}

type UpdateEnvironmentRequest struct {
	ID          int64  `json:"id,omitempty"`
	ProjectID   int64  `json:"project_id,omitempty"`
	Name        string `json:"name"`
	Description string `json:"description"`
	BaseURL     string `json:"base_url"`
}

type EnvironmentResponse struct {
	ID          int64  `json:"id"`
	ProjectID   int64  `json:"project_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	BaseURL     string `json:"base_url"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type EnvironmentListResponse struct {
	Environments []EnvironmentResponse `json:"environments"`
}
