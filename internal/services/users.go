package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

var (
	ErrEmailAlreadyInUse = errors.New("email or username already in use")
)

type UserService interface {
	// FindAll finds all users in the system
	FindAll(context.Context) (*schema.CompactUserListResponse, error)
	// Create creates a new user in the system with the given information
	// provided that the user's email is not already in use and that the information is valid
	Create(context.Context, *schema.NewUserRequest) (*dbsqlc.User, error)
	// GetOne retrives one user from system
	GetOne(ctx context.Context, id int32) (dbsqlc.User, error)
	// SearchUser searches the user in the system based on typed keywords
	Search(ctx context.Context, keyword string) ([]dbsqlc.User, error)
	//Update updates the user
	Update(context.Context, schema.UpdateUserRequest) (bool, error)
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

func (s *userServiceImpl) FindAll(ctx context.Context) (*schema.CompactUserListResponse, error) {
	response := &schema.CompactUserListResponse{}
	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return response, nil
		}
		return nil, fmt.Errorf("could not fetch users: %v", err)
	}
	response.Users = make([]schema.UserCompact, 0)
	for _, user := range users {
		response.Users = append(response.Users, schema.UserCompact{
			ID:          int64(user.ID),
			DisplayName: user.DisplayName.String,
			Email:       user.Email,
			CreatedAt:   user.CreatedAt.Time.Format(time.DateTime),
		})
	}
	return response, nil
}

func (s *userServiceImpl) Create(ctx context.Context, request *schema.NewUserRequest) (*dbsqlc.User, error) {

	existing, err := s.queries.FindUserLoginByEmail(ctx, request.Email)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("failed to run pre-check for existing account: %v", err)
		}
	}
	if existing.Email == request.Email && err == nil {
		return nil, ErrEmailAlreadyInUse
	}

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

func (u *userServiceImpl) GetOne(ctx context.Context, id int32) (dbsqlc.User, error) {
	user, err := u.queries.GetUser(ctx, id)
	if err != nil {
		u.logger.Error("failed to find the user", "error", err)
		return dbsqlc.User{}, err
	}
	return user, nil
}

func (u *userServiceImpl) Search(ctx context.Context, keyword string) ([]dbsqlc.User, error) {
	users, err := u.queries.SearchUsers(ctx, common.NullString(keyword))
	if err != nil {
		u.logger.Error("failed to search users with keyword %q: %w", keyword, err)
		return nil, err
	}
	if len(users) == 0 {
		return nil, fmt.Errorf("no users found matching %q", keyword)
	}
	return users, nil
}

func (u *userServiceImpl) Update(ctx context.Context, request schema.UpdateUserRequest) (bool, error) {
	err := u.queries.UpdateUser(ctx, dbsqlc.UpdateUserParams{
		ID:          request.ID,
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		DisplayName: common.NullString(request.DisplayName),
		Phone:       request.Phone,
		OrgID:       common.NewNullInt32(request.OrgID),
		CountryIso:  request.CountryIso,
		City:        common.NullString(request.City),
		Address:     request.Address,
	})
	if err != nil {
		u.logger.Error("failed to update user", "error", err)
		return false, fmt.Errorf("failed to update user")
	}
	return true, nil
}
