package schema

import (
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type Tester struct {
	UserID      int64    `json:"user_id"`
	Name        string   `json:"name"`
	LastLoginAt string   `json:"last_login_at"`
	TestPlans   []string `json:"test_plans"`
}

func NewTesterFromUser(user *dbsqlc.User) Tester {
	return Tester{
		UserID:      int64(user.ID),
		Name:        user.DisplayName.String,
		LastLoginAt: user.LastLoginAt.Time.Format(time.DateTime),
		TestPlans:   []string{}, // TODO: fill the test plans this user is part of
	}
}
