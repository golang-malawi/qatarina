package schema

type Org struct {
	ID         int32  `json:"id"`
	Name       string `json:"name"`
	Address    string `json:"address,omitempty"`
	Country    string `json:"country,omitempty"`
	GithubURL  string `json:"github_url,omitempty"`
	WebsiteURL string `json:"website_url,omitempty"`
	CreatedBy  int64  `json:"created_by,omitempty"`
	CreatedAt  string `json:"created_at,omitempty"`
	UpdatedAt  string `json:"updated_at,omitempty"`
}

type CreateOrgRequest struct {
	Name       string `json:"name" validate:"required"`
	Address    string `json:"address,omitempty"`
	Country    string `json:"country,omitempty"`
	GithubURL  string `json:"github_url,omitempty"`
	WebsiteURL string `json:"website_url,omitempty"`
}

type UpdateOrgRequest struct {
	ID         int32  `json:"id" validate:"required"`
	Name       string `json:"name" validate:"required"`
	Address    string `json:"address,omitempty"`
	Country    string `json:"country,omitempty"`
	GithubURL  string `json:"github_url,omitempty"`
	WebsiteURL string `json:"website_url,omitempty"`
}

type OrgListResponse struct {
	Total int   `json:"total"`
	Orgs  []Org `json:"orgs"`
}
