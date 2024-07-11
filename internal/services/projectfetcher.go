package services

type ProjectFetcherService interface {
	FetchProjects() ([]string, error)
}
