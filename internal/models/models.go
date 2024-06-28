package models

type User struct {
	ID          int64  `db:"id" json:"id"`
	DisplayName string `db:"display_name" json:"displayName"`
	Username    string `db:"username" json:"username"`
	Password    string `db:"password" json:"-"`
}

type Project struct{}

type Tester struct{}

type TestCase struct{}

type ProjectTestCase struct{}

type TestGroup struct{}
