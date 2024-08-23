package schema

import "github.com/golang-malawi/qatarina/internal/database/dbsqlc"

type BulkCommitTestResults struct {
	UserID      int64                 `json:"-"`
	TestResults []CommitTestRunResult `json:"test_results" validate:"required,min=1,max=100"`
}

type CommitTestRunResult struct {
	UserID         int64  `json:"-"`
	TestRunID      string `json:"test_run_id" validate:"required"`
	Notes          string `json:"notes" validate:"required"`
	IsClosed       bool   `json:"is_closed"`
	TestedOn       string `json:"tested_on" validate:"required"`
	ActualResult   string `json:"actual_result" validate:"required"`
	ExpectedResult string `json:"expected_result"`
	// State is the result of the test run
	State dbsqlc.TestRunState `json:"result_state" validate:"required"`
}
