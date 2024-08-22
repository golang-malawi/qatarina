package schema

import "github.com/golang-malawi/qatarina/internal/database/dbsqlc"

type CommitTestRunResult struct {
	UserID int64 `json:"-"`
	// tested_by_id   int64  `json:"tested_by_id"`
	// assigned_to_id int64  `json:"assigned_to_id"`
	TestRunID      string `json:"test_run_id" validate:"required"`
	Notes          string `json:"notes" validate:"required"`
	IsClosed       bool   `json:"is_closed"`
	TestedOn       string `json:"tested_on"`
	ActualResult   string `json:"actual_result"`
	ExpectedResult string `json:"expected_result"`
	// State is the result of the test run
	State dbsqlc.TestRunState `json:"result_state" validate:"required"`
}
