package schema

import (
	"fmt"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type TestRunRequest struct {
	ProjectID    int32  `json:"project_id" validate:"required"`
	TestPlanID   int32  `json:"test_plan_id" validate:"required"`
	TestCaseID   string `json:"test_case_id" validate:"required"`
	OwnerID      int32  `json:"owner_id" validate:"required"`
	TestedByID   int32  `json:"tested_by_id" validate:"required"`
	AssignedToID int32  `json:"assigned_to_id" validate:"-"`
	Code         string `json:"code"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

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

// NewFoundIssuesRequest contains list of issues which basically translates to "failed test cases/runs"
type NewFoundIssuesRequest struct {
	// TestPlanID can be nil or 0, when this happens Tests are linked to Default Test Plan if available
	TestPlanID int64  `json:"test_plan_id" validate:"-"`
	UserID     int64  `json:"-"`
	TestedOn   string `json:"tested_on" validate:"required"`
	Issues     []CommitTestRunResult
}

func ParseIssuesFromMarkdownList(userID int64, testDate time.Time, content string) ([]CommitTestRunResult, error) {
	if content == "" {
		return nil, fmt.Errorf("checklist content cannot be nil")
	}
	items := strings.Split(content, "\n")

	testRuns := make([]CommitTestRunResult, 0)
	for _, entry := range items {

		entryNormalized := strings.Replace(entry, "-", "", 1)
		entryNormalized = strings.Replace(entryNormalized, "*", "", 1)
		entryNormalized = strings.TrimSpace(entryNormalized)

		item := CommitTestRunResult{
			UserID:         userID,
			TestRunID:      "",
			Notes:          entryNormalized,
			IsClosed:       false,
			TestedOn:       testDate.Format(time.DateOnly),
			ActualResult:   entryNormalized,
			ExpectedResult: fmt.Sprintf("Expected different behavior"),
			State:          dbsqlc.TestRunStateFailed,
		}
		testRuns = append(testRuns, item)
	}

	return testRuns, nil
}

type TestRunResponse struct {
	ID         string `json:"id"`
	ProjectID  int64  `json:"project_id"`
	TestPlanID int64  `json:"test_plan_id"`
}

type TestRunListResponse struct {
	TestRuns []TestRunResponse `json:"test_runs"`
}
