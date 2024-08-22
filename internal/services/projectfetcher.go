package services

import "context"

type ProjectFetcherService interface {
	FetchProjects(context.Context) ([]string, error)
}
