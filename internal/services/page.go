package services

import (
	"context"
	"database/sql"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type PageService interface {
	Create(p *schema.PageRequest) (bool, error)
}

func NewPageService(queries *dbsqlc.Queries) PageService {
	return &pageServiceImp{
		db: queries,
	}
}

// Implementation of the PageService
type pageServiceImp struct {
	db *dbsqlc.Queries
}

// Implement the Create method
func (p *pageServiceImp) Create(request *schema.PageRequest) (bool, error) {

	_, err := p.db.CreatePage(context.Background(), dbsqlc.CreatePageParams{
		ParentPageID:       sql.NullInt32{Int32: request.ParentPageID.Int32, Valid: true},
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
		LastEditedBy:       request.LastEditedBy,
		CreatedBy:          request.CreatedBy,
	})

	if err != nil {
		return false, err
	}
	return true, nil
}
