package services

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/go-github/v62/github"
)

type GitHubIntegration struct {
	client          *github.Client
	projectService  ProjectService
	testCaseService TestCaseService
}

// NewGitHubIntegration creates a new github integration which requires a fully constructed AND authenticated GitHub client to work
// if the client is not authorized to make requests, then all functionality in this type may not work and will return errors
func NewGitHubIntegration(client *github.Client, projectService ProjectService, testCaseService TestCaseService) *GitHubIntegration {
	return &GitHubIntegration{
		client:          client,
		projectService:  projectService,
		testCaseService: testCaseService,
	}
}

func (g *GitHubIntegration) FetchProjects(ctx context.Context) ([]string, error) {
	repos, _, err := g.client.Repositories.ListByAuthenticatedUser(ctx, &github.RepositoryListByAuthenticatedUserOptions{
		Type: "owner",
	})
	if _, ok := err.(*github.RateLimitError); ok {
		log.Println("hit rate limit")
		return nil, fmt.Errorf("hit rate limit")
	}

	repoNames := make([]string, 0)
	for _, repo := range repos {
		repoNames = append(repoNames, *repo.Name)
	}
	return nil, fmt.Errorf("not implemented")
}

func (g *GitHubIntegration) ListIssues(ctx context.Context, project string) ([]any, error) {
	parts := strings.Split(project, "/")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid project format, expected 'owner/repo'")
	}
	owner := parts[0]
	repo := parts[1]

	issues, _, err := g.client.Issues.ListByRepo(ctx, owner, repo, &github.IssueListByRepoOptions{
		State:       "open",
		Sort:        "created",
		Direction:   "desc",
		ListOptions: github.ListOptions{PerPage: 100},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list issues: %w", err)
	}

	results := make([]any, 0)
	for _, issue := range issues {
		if issue.PullRequestLinks != nil {
			continue // skip pull requests
		}
		results = append(results, map[string]any{
			"id":     issue.GetID(),
			"title":  issue.GetTitle(),
			"body":   issue.GetBody(),
			"labels": issue.Labels,
			"url":    issue.GetHTMLURL(),
		})
	}
	return results, nil
}

func (g *GitHubIntegration) CreateTestCasesFromOpenIssues(ctx context.Context, owner, repo string, projectID int64) ([]dbsqlc.TestCase, error) {
	issues, _, err := g.client.Issues.ListByRepo(ctx, owner, repo, &github.IssueListByRepoOptions{
		State:     "open",
		Sort:      "created_at",
		Direction: "desc",
		ListOptions: github.ListOptions{
			PerPage: 100,
		},
	})

	if err != nil {
		if _, ok := err.(*github.RateLimitError); ok {
			return nil, fmt.Errorf("hit rate limit %v", err)
		}
		return nil, err
	}

	testCases := make([]dbsqlc.TestCase, 0)
	for _, issue := range issues {
		labelsToTags := make([]string, 0)
		for _, label := range issue.Labels {

			if label.Name != nil {
				labelsToTags = append(labelsToTags, *label.Name)
			}
		}

		title := ""
		if issue.Title != nil {
			title = *issue.Title
		}
		body := "none"
		if issue.Body != nil {
			body = *issue.Body
		}
		if title == "" {
			return nil, fmt.Errorf("test case title cannot be empty")
		}
		createdCase, err := g.testCaseService.Create(ctx, &schema.CreateTestCaseRequest{
			ProjectID:       projectID,
			Kind:            "general",
			Code:            fmt.Sprintf("GH-%d", issue.ID),
			FeatureOrModule: "none",
			Title:           title,
			Description:     body,
			IsDraft:         true,
			Tags:            labelsToTags,
			CreatedByID:     "1",
		})
		if err != nil {
			return nil, err
		}
		testCases = append(testCases, *createdCase)
	}

	return testCases, nil
}

func (g *GitHubIntegration) ListPullRequests(ctx context.Context, owner, repo string) ([]any, error) {
	prs, _, err := g.client.PullRequests.List(ctx, owner, repo, &github.PullRequestListOptions{
		State:       "open",
		Sort:        "created",
		Direction:   "desc",
		ListOptions: github.ListOptions{PerPage: 100},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list pull requests: %w", err)
	}

	results := make([]any, 0)
	for _, pr := range prs {
		results = append(results, map[string]any{
			"id":     pr.GetID(),
			"title":  pr.GetTitle(),
			"body":   pr.GetBody(),
			"url":    pr.GetHTMLURL(),
			"labels": pr.Labels,
		})
	}
	return results, nil
}
