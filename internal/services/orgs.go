package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type OrgService interface {
	Create(ctx context.Context, req schema.CreateOrgRequest, userID int64) (*schema.Org, error)
	GetOne(ctx context.Context, id int64) (*schema.Org, error)
	ListAll(ctx context.Context) ([]schema.Org, error)
	Update(ctx context.Context, req schema.UpdateOrgRequest) error
	DeleteOrg(ctx context.Context, id int64) error
}

type orgServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewOrgService(queries *dbsqlc.Queries, logger logging.Logger) OrgService {
	return &orgServiceImpl{
		queries: queries,
		logger:  logger,
	}
}

func (o *orgServiceImpl) Create(ctx context.Context, req schema.CreateOrgRequest, userID int64) (*schema.Org, error) {
	org, err := o.queries.CreateOrg(ctx, dbsqlc.CreateOrgParams{
		Name:        req.Name,
		Address:     common.NullString(req.Address),
		Country:     common.NullString(req.Country),
		GithubUrl:   common.NullString(req.GithubURL),
		WebsiteUrl:  common.NullString(req.WebsiteURL),
		CreatedByID: int32(userID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create org: %w", err)
	}
	return &schema.Org{
		ID:         org.ID,
		Name:       org.Name,
		Address:    org.Address.String,
		Country:    org.Country.String,
		GithubURL:  org.GithubUrl.String,
		WebsiteURL: org.WebsiteUrl.String,
		CreatedBy:  int64(org.CreatedByID),
		CreatedAt:  common.FormatSqlDateTime(org.CreatedAt),
		UpdatedAt:  common.FormatSqlDateTime(org.UpdatedAt),
	}, nil
}

func (o *orgServiceImpl) ListAll(ctx context.Context) ([]schema.Org, error) {
	orgs, err := o.queries.ListOrgs(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list all orgs: %w", err)
	}
	result := make([]schema.Org, len(orgs))
	for i, org := range orgs {
		result[i] = schema.Org{
			ID:         org.ID,
			Name:       org.Name,
			Address:    org.Address.String,
			Country:    org.Country.String,
			GithubURL:  org.GithubUrl.String,
			WebsiteURL: org.WebsiteUrl.String,
			CreatedBy:  int64(org.CreatedByID),
			CreatedAt:  common.FormatSqlDateTime(org.CreatedAt),
			UpdatedAt:  common.FormatSqlDateTime(org.UpdatedAt),
		}
	}
	return result, nil
}

func (o *orgServiceImpl) GetOne(ctx context.Context, id int64) (*schema.Org, error) {
	org, err := o.queries.GetOrgByID(ctx, int32(id))
	if err != nil {
		return nil, fmt.Errorf("failed to get org with id %d: %w", id, err)
	}
	return &schema.Org{
		ID:         org.ID,
		Name:       org.Name,
		Address:    org.Address.String,
		Country:    org.Country.String,
		GithubURL:  org.GithubUrl.String,
		WebsiteURL: org.WebsiteUrl.String,
		CreatedBy:  int64(org.CreatedByID),
		CreatedAt:  common.FormatSqlDateTime(org.CreatedAt),
		UpdatedAt:  common.FormatSqlDateTime(org.UpdatedAt),
	}, nil
}

func (o *orgServiceImpl) Update(ctx context.Context, req schema.UpdateOrgRequest) error {
	err := o.queries.UpdateOrg(ctx, dbsqlc.UpdateOrgParams{
		ID:         req.ID,
		Name:       req.Name,
		Address:    common.NullString(req.Address),
		Country:    common.NullString(req.Country),
		GithubUrl:  common.NullString(req.GithubURL),
		WebsiteUrl: common.NullString(req.WebsiteURL),
	})
	if err != nil {
		return fmt.Errorf("failed to update org with id %d: %w", req.ID, err)
	}
	return nil
}

func (o *orgServiceImpl) DeleteOrg(ctx context.Context, id int64) error {
	err := o.queries.DeleteOrg(ctx, int32(id))
	if err != nil {
		return fmt.Errorf("failed to delete org with id %d: %w", id, err)
	}

	return nil
}
