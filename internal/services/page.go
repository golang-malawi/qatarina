package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type PageService interface {
	Create(context.Context, *schema.PageRequest) (bool, error)
	GetOnePage(ctx context.Context, id int32) (dbsqlc.Page, error)
	GetAllPages(ctx context.Context) ([]dbsqlc.Page, error)
}

func NewPageService(queries *dbsqlc.Queries) PageService {
	return &pageServiceImp{
		db: queries,
	}
}

// Implementation of the PageService
type pageServiceImp struct {
	db     *dbsqlc.Queries
	logger logging.Logger
}

// Implement the Create method
func (p *pageServiceImp) Create(ctx context.Context, request *schema.PageRequest) (bool, error) {

	_, err := p.db.CreatePage(ctx, dbsqlc.CreatePageParams{
		ParentPageID:       common.NewNullInt32(request.ParentPageID.Int32),
		PageVersion:        request.PageVersion,
		OrgID:              request.OrgID,
		ProjectID:          request.ProjectID,
		Code:               request.Code,
		Title:              request.Title,
		FilePath:           common.NullString(request.FilePath.String),
		Content:            request.Content,
		PageType:           request.PageType,
		MimeType:           request.MimeType,
		HasEmbeddedMedia:   request.HasEmbeddedMedia,
		ExternalContentUrl: common.NullString(request.ExternalContentUrl.String),
		NotionUrl:          common.NullString(request.NotionUrl.String),
		CreatedBy:          request.CreatedBy,
		LastEditedBy:       request.LastEditedBy,
	})

	if err != nil {
		return false, fmt.Errorf("failed to create page %v", err)
	}

	return true, nil
}

func (p *pageServiceImp) GetOnePage(ctx context.Context, id int32) (dbsqlc.Page, error) {
	page, err := p.db.GetPage(ctx, id)
	if err != nil {
		p.logger.Error("services-pages", "failed to fetch with id %d: %v", id, err)
		return dbsqlc.Page{}, err
	}

	return page, nil
}

func (p *pageServiceImp) GetAllPages(ctx context.Context) ([]dbsqlc.Page, error) {
	pages, err := p.db.GetAllPages(ctx)
	if err != nil {
		p.logger.Error("failed to fetxh pages", "error", err)
		return nil, err
	}
	return pages, nil
}
