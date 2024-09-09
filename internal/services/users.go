package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type UserService interface {
	// FindAll finds all users in the system
	FindAll(context.Context) ([]dbsqlc.User, error)
	// Create creates a new user in the system with the given information
	// provided that the user's email is not already in use and that the information is valid
	Create(context.Context, *schema.NewUserRequest) (*dbsqlc.User, error)
}

type OrganizationUserService interface {
	// FindAll finds all users in a given organization
	FindAll(context.Context, int64) ([]dbsqlc.User, error)
}

type userServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewUserService(conn *dbsqlc.Queries, logger logging.Logger) UserService {
	return &userServiceImpl{
		queries: conn,
		logger:  logger,
	}
}

func (s *userServiceImpl) FindAll(ctx context.Context) ([]dbsqlc.User, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *userServiceImpl) Create(ctx context.Context, request *schema.NewUserRequest) (*dbsqlc.User, error) {
	userParams := dbsqlc.CreateUserParams{
		FirstName:    request.FirstName,
		LastName:     request.LastName,
		DisplayName:  sql.NullString{String: request.DisplayName, Valid: true},
		Email:        request.Email,
		Password:     common.MustHashPassword(request.Password),
		IsActivated:  sql.NullBool{Bool: true, Valid: true},
		IsReviewed:   sql.NullBool{Bool: false, Valid: true},
		IsSuperAdmin: sql.NullBool{Bool: false, Valid: true},
		IsVerified:   sql.NullBool{Bool: false, Valid: true},
		CreatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
		UpdatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
	}

	userID, err := s.queries.CreateUser(context.Background(), userParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create user got %v", err)
	}

	user, err := s.queries.GetUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
