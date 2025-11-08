package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/go-github/v62/github"
)

type GitHubService interface {
	// Installation management
	UpsertInstallation(ctx context.Context, installationID int64, accountLogin string) error
	GetInstallationIDByAccount(ctx context.Context, accountLogin string) (int64, error)

	// GitHub API
	FetchProjects(ctx context.Context) ([]string, error)
	ListIssues(ctx context.Context, project string) ([]any, error)
	ListPullRequests(ctx context.Context, owner, repo string) ([]any, error)
	CreateTestCasesFromOpenIssues(ctx context.Context, owner, repo string, projectID int64) ([]dbsqlc.TestCase, error)
}

type githubServiceImpl struct {
	client          *github.Client
	projectService  ProjectService
	testCaseService TestCaseService
	queries         *dbsqlc.Queries
	logger          logging.Logger
}

func NewGitHubService(client *github.Client, projectService ProjectService, testCaseService TestCaseService, queries *dbsqlc.Queries, logger logging.Logger) GitHubService {
	return &githubServiceImpl{
		client:          client,
		projectService:  projectService,
		testCaseService: testCaseService,
		queries:         queries,
		logger:          logger,
	}
}

func (s *githubServiceImpl) UpsertInstallation(ctx context.Context, installationID int64, accountLogin string) error {
	return s.queries.UpsertGitHubInstallation(ctx, dbsqlc.UpsertGitHubInstallationParams{
		InstallationID: installationID,
		AccountLogin:   accountLogin,
	})

}

func (g *githubServiceImpl) GetInstallationIDByAccount(ctx context.Context, accountLogin string) (int64, error) {
	id, err := g.queries.GetInstallationIDByAccount(ctx, accountLogin)
	if err != nil {
		return 0, fmt.Errorf("failed to find installation ID: %w", err)
	}
	return id, nil
}

func (g *githubServiceImpl) FetchProjects(ctx context.Context) ([]string, error) {
	repos, _, err := g.client.Repositories.ListByAuthenticatedUser(ctx, &github.RepositoryListByAuthenticatedUserOptions{
		Type: "owner",
	})
	if err != nil {
		if _, ok := err.(*github.RateLimitError); ok {
			g.logger.Error("hit rate limit", "error", err)
			return nil, fmt.Errorf("hit rate limit: %w", err)
		}
		return nil, fmt.Errorf("failed to fetch repositories: %w", err)
	}

	repoNames := make([]string, 0)
	for _, repo := range repos {
		repoNames = append(repoNames, repo.GetName())
	}
	return repoNames, nil
}

func (g *githubServiceImpl) ListIssues(ctx context.Context, project string) ([]any, error) {
	parts := splitProject(project)
	if parts == nil {
		return nil, fmt.Errorf("invalid project format")
	}
	owner, repo := parts[0], parts[1]

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
			continue
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

func (g *githubServiceImpl) ListPullRequests(ctx context.Context, owner, repo string) ([]any, error) {
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

func (g *githubServiceImpl) CreateTestCasesFromOpenIssues(ctx context.Context, owner, repo string, projectID int64) ([]dbsqlc.TestCase, error) {
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
			g.logger.Error("github-import", "failed to create test case", "issue_id", issue.GetID(), "error", err)
			return nil, err
		}
		testCases = append(testCases, *createdCase)
	}

	return testCases, nil
}

func splitProject(project string) []string {
	for i := range project {
		if project[i] == '/' {
			return []string{project[:i], project[i+1:]}
		}
	}
	return nil
}
