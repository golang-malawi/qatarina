package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type PageService interface {
	Create(*schema.CreatePageRequest) (bool, error)
}

func NewPageService(queries *dbsqlc.Queries) PageService {
	return &pageServiceImpl{
		db: queries,
	}
}

type pageServiceImpl struct {
	db     *dbsqlc.Queries
	logger logging.Logger
}

func (p *pageServiceImpl) Create(request *schema.CreatePageRequest) (bool, error) {
	_, err := p.db.CreatePage(context.Background(), dbsqlc.CreatePageParams{
		Title: request.Title,
		Owner: request.Owner,
	})

	if err != nil {
		p.logger.Error("services-pages", "failed to create user %v", err)
		return false, fmt.Errorf("failed to create page %v", err)

	}

	return true, nil
}
