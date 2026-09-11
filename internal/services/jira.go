package services

import (
	"fmt"

	"github.com/hopesain/jira-gopher/jira"
)

type JiraIntegration struct {
	client *jira.Client
}

func NewJiraIntegration(credentials jira.Credentials) (*JiraIntegration, error) {
	client, err := jira.NewClient(credentials)
	if err != nil {
		return nil, fmt.Errorf("failed to create jira client: %w", err)
	}
	return &JiraIntegration{client: client}, nil
}

func (j *JiraIntegration) GetAllProjects() (jira.ProjectsResponse, error) {
	resp, err := j.client.Projects.GetAll()
	if err != nil {
		return jira.ProjectsResponse{}, fmt.Errorf("failed to fetch projects: %w", err)
	}
	return resp, nil
}

func (j *JiraIntegration) GetProject(projectIDOrKey string) (jira.GetProjectResponse, error) {
	resp, err := j.client.Projects.Get(projectIDOrKey)
	if err != nil {
		return jira.GetProjectResponse{}, fmt.Errorf("failed to fetch project %q: %w", projectIDOrKey, err)
	}
	return resp, nil
}

func (j *JiraIntegration) CreateIssue(projectID, issueTypeID, summary string) (jira.CreateIssueResponse, error) {
	resp, err := j.client.Issues.Create(projectID, issueTypeID, summary)
	if err != nil {
		return jira.CreateIssueResponse{}, fmt.Errorf("failed to create issue: %w", err)
	}
	return resp, nil
}
