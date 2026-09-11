package schema

type JiraCredentialsRequest struct {
	Email   string `json:"jira_email" validate:"required"`
	Token   string `json:"jira_api_token" validate:"required"`
	BaseUrl string `json:"jira_base_url" validate:"required"`
}

type GetAllJiraProjectsRequest struct {
	JiraCredentialsRequest
}

type GetJiraProjectRequest struct {
	JiraCredentialsRequest
	ProjectIDOrKey string `json:"project_id_or_key" validate:"required"`
}

type CreateJiraIssueRequest struct {
	JiraCredentialsRequest
	ProjectID   string `json:"project_id" validate:"required"`
	IssueTypeID string `json:"issue_type_id" validate:"required"`
	Summary     string `json:"summary" validate:"required"`
}
