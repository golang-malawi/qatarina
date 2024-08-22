package services

import "context"

type TesterService interface {
	FindAll(context.Context) ([]any, error)
	Invite(context.Context, any) (any, error)
}
