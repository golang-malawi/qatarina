package schema

type GitHubRepoRequest struct {
	Project string `json:"project" validate:"required"`
}

type ImportIssuesRequest struct {
	Project   string  `json:"project" validate:"required"`
	ProjectID int64   `json:"project_id" validate:"required"`
	IDs       []int64 `json:"ids,omitempty"`
}
