package schema

import (
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type Tester struct {
	UserID      int64  `json:"user_id"`
	ProjectID   int64  `json:"project_id"`
	Name        string `json:"name"`
	Project     string `json:"project"`
	Role        string `json:"role"`
	LastLoginAt string `json:"last_login_at"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	// TestPlans   []string `json:"test_plans"`
}

func NewTesterFromUser(user *dbsqlc.User) Tester {
	return Tester{
		UserID:      int64(user.ID),
		Name:        user.DisplayName.String,
		LastLoginAt: user.LastLoginAt.Time.Format(time.DateTime),
		// TestPlans:   []string{}, // TODO: fill the test plans this user is part of
	}
}

type BulkAssignTesters struct {
	ProjectID int64 `json:"project_id"`
	Testers   []struct {
		UserID int64  `json:"user_id"`
		Role   string `json:"role"`
	} `json:"testers"`
}

type TesterListResponse struct {
	Testers []Tester `json:"testers"`
}
