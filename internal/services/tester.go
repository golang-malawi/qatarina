package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type TesterService interface {
	FindAll(context.Context) ([]schema.Tester, error)
	Invite(context.Context, any) (any, error)
}

type testerServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTesterService(db *dbsqlc.Queries, logger logging.Logger) TesterService {
	return &testerServiceImpl{
		queries: db,
		logger:  logger,
	}
}

func (s *testerServiceImpl) FindAll(ctx context.Context) ([]schema.Tester, error) {
	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	testers := make([]schema.Tester, 0)
	for _, user := range users {
		testers = append(testers, schema.NewTesterFromUser(&user))
	}
	return testers, nil
}

func (s *testerServiceImpl) Invite(context.Context, any) (any, error) {
	return nil, fmt.Errorf("not implemented")
}
