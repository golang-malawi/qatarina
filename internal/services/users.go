package services

import "context"

type UserService interface {
	FindAll(context.Context) ([]any, error)
}
