package services

import (
	"context"
	"fmt"
	"log"

	"github.com/google/go-github/v62/github"
)

type GitHubProjectFetcher struct {
	clientSecret string
	authSettings any
	client       *github.Client
}

func (g *GitHubProjectFetcher) FetchProjects(ctx context.Context) ([]string, error) {
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

func (g *GitHubProjectFetcher) ListIssues(ctx context.Context, project string) ([]any, error) {
	return nil, fmt.Errorf("failed to list issues")
}
