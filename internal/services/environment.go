package services

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/microcosm-cc/bluemonday"
)

type EnvironmentService interface {
	FindByProjectID(ctx context.Context, projectID int64) (*schema.EnvironmentListResponse, error)
	FindByID(ctx context.Context, envID int64) (*schema.EnvironmentResponse, error)
	Create(ctx context.Context, projectID int64, req *schema.EnvironmentRequest) (*schema.EnvironmentResponse, error)
}

type environmentServiceImpl struct {
	queries *dbsqlc.Queries
}

func NewEnvironmentService(db *dbsqlc.Queries) EnvironmentService {
	return &environmentServiceImpl{
		queries: db,
	}
}

func (s *environmentServiceImpl) FindByProjectID(ctx context.Context, projectID int64) (*schema.EnvironmentListResponse, error) {
	envs, err := s.queries.ListEnvironmentsByProject(ctx, common.NewNullInt32(int32(projectID)))
	if err != nil {
		return nil, err
	}

	response := make([]schema.EnvironmentResponse, 0, len(envs))
	for _, env := range envs {
		response = append(response, schema.EnvironmentResponse{
			ID:        int64(env.ID),
			ProjectID: int64(env.ProjectID.Int32),
			Name:      env.Name,
			BaseURL:   env.BaseUrl.String,
			CreatedAt: env.CreatedAt.Format(time.RFC3339),
			UpdatedAt: env.UpdatedAt.Format(time.RFC3339),
		})
	}

	return &schema.EnvironmentListResponse{Environments: response}, nil
}

func (s *environmentServiceImpl) FindByID(ctx context.Context, envID int64) (*schema.EnvironmentResponse, error) {
	env, err := s.queries.GetEnvironment(ctx, int32(envID))
	if err != nil {
		return nil, err
	}

	response := schema.EnvironmentResponse{
		ID:          int64(env.ID),
		ProjectID:   int64(env.ProjectID.Int32),
		Name:        env.Name,
		Description: env.Description.String,
		BaseURL:     env.BaseUrl.String,
		CreatedAt:   env.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   env.UpdatedAt.Format(time.RFC3339),
	}
	return &response, nil
}

func (s *environmentServiceImpl) Create(ctx context.Context, projectID int64, req *schema.EnvironmentRequest) (*schema.EnvironmentResponse, error) {
	policy := bluemonday.StrictPolicy()

	name := policy.Sanitize(strings.TrimSpace(req.Name))
	description := policy.Sanitize(strings.TrimSpace(req.Description))

	var baseURL string
	if req.BaseURL != "" {
		if _, err := url.ParseRequestURI(req.BaseURL); err != nil {
			return nil, fmt.Errorf("invalid base URL: %w", err)
		}
		baseURL = policy.Sanitize(strings.TrimSpace(req.BaseURL))
	}

	env, err := s.queries.CreateEnvironment(ctx, dbsqlc.CreateEnvironmentParams{
		ProjectID:   common.NewNullInt32(int32(projectID)),
		Name:        name,
		Description: common.NullString(description),
		BaseUrl:     common.NullString(baseURL),
	})
	if err != nil {
		return nil, err
	}

	return &schema.EnvironmentResponse{
		ID:          int64(env.ID),
		ProjectID:   int64(env.ProjectID.Int32),
		Name:        env.Name,
		Description: env.Description.String,
		BaseURL:     env.BaseUrl.String,
		CreatedAt:   env.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   env.UpdatedAt.Format(time.RFC3339),
	}, nil
}
