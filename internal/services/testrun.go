package services

import "context"

type TestRunService interface {
	FindAll(context.Context) ([]any, error)
}
