package schema

type ListGitHubRequest struct {
	Project string `json:"project" validate:"required"`
}
