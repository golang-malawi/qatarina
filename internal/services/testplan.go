package services

import "context"

type TestPlanService interface {
	FindAll(context.Context) ([]any, error)
}
