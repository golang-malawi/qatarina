package schema

import (
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

// NewProjectRequest a request representing creation of a new project on the platform
type NewProjectRequest struct {
	Name            string `json:"name" validate:"required"`
	Code            string `json:"code" validate:"required, min=3,max=10"`
	Description     string `json:"description" validate:"required"`
	WebsiteURL      string `json:"website_url,omitempty" validate:"required"`
	Version         string `json:"version" validate:"required"`
	GitHubURL       string `json:"github_url,omitempty" validate:""`
	ProjectOwnerID  int64  `json:"project_owner_id,omitempty" validate:"-"`
	ParentProjectID int64  `json:"parent_project_id,omitempty"`
}

type UpdateProjectRequest struct {
	ID              int64  `json:"id" validate:"required"`
	Name            string `json:"name" validate:"required"`
	Code            string `json:"code" validate:"required, min=3,max=10"`
	Description     string `json:"description" validate:"required"`
	WebsiteURL      string `json:"website_url,omitempty" validate:"required"`
	Version         string `json:"version" validate:"required"`
	GitHubURL       string `json:"github_url,omitempty" validate:""`
	ProjectOwnerID  int64  `json:"project_owner_id,omitempty" validate:"required"`
	ParentProjectID int64  `json:"parent_project_id,omitempty"`
}

type ProjectListResponse struct {
	Projects []ProjectResponse `json:"projects"`
}

type ProjectResponse struct {
	ID          int32  `json:"id"`
	Title       string `json:"title"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Version     string `json:"version"`
	IsActive    bool   `json:"is_active"`
	IsPublic    bool   `json:"is_public"`
	WebsiteUrl  string `json:"website_url"`
	GithubUrl   string `json:"github_url"`
	TrelloUrl   string `json:"trello_url"`
	JiraUrl     string `json:"jira_url"`
	MondayUrl   string `json:"monday_url"`
	OwnerUserID int32  `json:"owner_user_id"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func NewProjectResponse(data *dbsqlc.Project, owner *dbsqlc.User) ProjectResponse {
	return ProjectResponse{
		ID:          data.ID,
		Title:       data.Title,
		Code:        data.Code,
		Description: data.Description,
		Version:     data.Version.String,
		IsActive:    data.IsActive.Bool,
		IsPublic:    data.IsPublic.Bool,
		WebsiteUrl:  data.WebsiteUrl.String,
		GithubUrl:   data.GithubUrl.String,
		TrelloUrl:   data.TrelloUrl.String,
		JiraUrl:     data.JiraUrl.String,
		MondayUrl:   data.MondayUrl.String,
		OwnerUserID: data.OwnerUserID,
		CreatedAt:   formatDateTime(data.CreatedAt),
		UpdatedAt:   formatDateTime(data.UpdatedAt),
	}
}

func NewProjectResponseList(projects []dbsqlc.Project) []ProjectResponse {
	res := make([]ProjectResponse, 0)
	for _, item := range projects {
		res = append(res, NewProjectResponse(&item, nil))
	}
	return res
}

type ImportProjectRequest struct {
}
