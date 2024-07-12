package schema

// NewProjectRequest a request representing creation of a new project on the platform
type NewProjectRequest struct {
	Name            string `json:"name" validate:"required"`
	Description     string `json:"description" validate:"required"`
	WebsiteURL      string `json:"website_url,omitempty" validate:"required"`
	Version         string `json:"version" validate:"required"`
	GitHubURL       string `json:"github_url,omitempty" validate:""`
	ProjectOwnerID  int64  `json:"project_owner_id,omitempty" validate:"required"`
	ParentProjectID int64  `json:"parent_project_id,omitempty"`
}

type ProjectList struct {
	Projects []ProjectResponse `json:"projects"`
}

type ProjectResponse struct{}
