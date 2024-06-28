package schema

// NewProjectRequest a request representing creation of a new project on the platform
type NewProjectRequest struct {
	Name                string   `json:"name" validate:"required"`
	Description         string   `json:"description" validate:"required"`
	GitHubURL           string   `json:"github_url" validate:"required"`
	WebsiteURL          string   `json:"website_url" validate:"required"`
	Version             string   `json:"version" validate:"required"`
	HasMultipleVersions bool     `json:"has_multiple_versions" validate:"required"`
	OtherVersions       []string `json:"other_versions" validate:"required"`
}

type ProjectList struct {
	Projects []ProjectResponse `json:"projects"`
}

type ProjectResponse struct{}
