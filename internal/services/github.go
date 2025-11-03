package services

import (
	"context"
	"crypto/rsa"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/go-github/v62/github"
)

type GitHubIntegration struct {
	client          *github.Client
	projectService  ProjectService
	testCaseService TestCaseService
}

// GitHubInstallationStore defines how to persist and retrieve GitHub App installations
type GitHubInstallationStore interface {
	UpsertInstallation(installationID int64, accountLogin string) error
	FindInstallationIDByAccount(accountLogin string) (int64, error)
}

type GitHubInstallationStoreImpl struct {
	queries *dbsqlc.Queries
}

func NewGitHubInstallationStore(q *dbsqlc.Queries) GitHubInstallationStore {
	return &GitHubInstallationStoreImpl{
		queries: q,
	}
}

func (s *GitHubInstallationStoreImpl) UpsertInstallation(installationID int64, accountLogin string) error {
	return s.queries.UpsertGitHubInstallation(context.Background(), dbsqlc.UpsertGitHubInstallationParams{
		InstallationID: installationID,
		AccountLogin:   accountLogin,
	})

}

func (s *GitHubInstallationStoreImpl) FindInstallationIDByAccount(accountLogin string) (int64, error) {
	id, err := s.queries.GetInstallationIDByAccount(context.Background(), accountLogin)
	if err != nil {
		return 0, fmt.Errorf("failed to find installation ID: %w", err)
	}

	return id, nil
}

// NewGitHubIntegration creates a new github integration which requires a fully constructed AND authenticated GitHub client to work
// if the client is not authorized to make requests, then all functionality in this type may not work and will return errors
func NewGitHubIntegration(ctx context.Context, appID string, privateKeyPEM []byte, installationID int64, projectService ProjectService, testCaseService TestCaseService) (*GitHubIntegration, error) {
	token, err := getInstallationToken(ctx, appID, privateKeyPEM, installationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get installation token: %w", err)
	}
	client := github.NewClient(nil).WithAuthToken(token)
	return &GitHubIntegration{
		client:          client,
		projectService:  projectService,
		testCaseService: testCaseService,
	}, nil
}

// NewGitHubIntegrationAuto resolves installation ID from account login
func NewGitHubIntegrationAuto(ctx context.Context, appID string, privateKeyPEM []byte, accountLogin string, store GitHubInstallationStore, projectSevice ProjectService, testCaseService TestCaseService) (*GitHubIntegration, error) {
	installationID, err := store.FindInstallationIDByAccount(accountLogin)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve installation ID for %s: %w", accountLogin, err)
	}
	return NewGitHubIntegration(ctx, appID, privateKeyPEM, installationID, projectSevice, testCaseService)
}

// GitHub App Auth Logic
func getInstallationToken(ctx context.Context, appID string, privateKeyPEM []byte, installationID int64) (string, error) {
	key, err := parsePrivateKey(privateKeyPEM)
	if err != nil {
		return "", err
	}
	jwtToken, err := generateJWT(appID, key)
	if err != nil {
		return "", err
	}
	return exchangeJWTForToken(ctx, jwtToken, installationID)
}

func parsePrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("invalid PEM block")
	}
	return jwt.ParseRSAPrivateKeyFromPEM(pemBytes)
}

// // GenerateGitHubAppJWT creates a signed JWT for GitHub App aunthentication
// func GenerateGitHubAppJWT(appID string, privateKeyPath string) (string, error) {
// 	pemBytes, err := os.ReadFile(privateKeyPath)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to read private key: %w", err)
// 	}

// 	block, _ := pem.Decode(pemBytes)
// 	if block == nil {
// 		return "", fmt.Errorf("invalid PEM block")
// 	}

// 	key, err := jwt.ParseRSAPrivateKeyFromPEM(pemBytes)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to parse RSA key: %w", err)
// 	}

// 	now := time.Now().UTC()
// 	claims := jwt.RegisteredClaims{
// 		IssuedAt:  jwt.NewNumericDate(now.Add(-10 * time.Second)),
// 		ExpiresAt: jwt.NewNumericDate(now.Add(9 * time.Minute)),
// 		Issuer:    appID,
// 	}

// 	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
// 	return token.SignedString(key)
// }

func generateJWT(appID string, key *rsa.PrivateKey) (string, error) {
	now := time.Now().UTC()
	claims := jwt.RegisteredClaims{
		IssuedAt:  jwt.NewNumericDate(now.Add(-10 * time.Second)),
		ExpiresAt: jwt.NewNumericDate(now.Add(9 * time.Minute)),
		Issuer:    appID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(key)
}

func exchangeJWTForToken(ctx context.Context, jwtToken string, installationID int64) (string, error) {
	url := fmt.Sprintf("https://api.github.com/app/installations/%d/access_tokens", installationID)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, nil)
	req.Header.Set("Authorization", "Bearer "+jwtToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("GitHub token exchange failed: %d", resp.StatusCode)
	}

	var out struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return out.Token, nil
}

// GitHub API Logic
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
