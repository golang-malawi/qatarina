package schema

import (
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type CreateTestCaseRequest struct {
	Kind            string   `json:"kind" validate:"required"`
	Code            string   `json:"code,omitempty"` // optional; auto-generated if blank
	FeatureOrModule string   `json:"feature_or_module" validate:"required"`
	Title           string   `json:"title" validate:"required"`
	Description     string   `json:"description" validate:"required"`
	IsDraft         bool     `json:"is_draft" validate:"-"`
	Tags            []string `json:"tags" validate:"required"`
	CreatedByID     string   `json:"-" validate:"-"`
	ProjectID       int64    `json:"project_id" validate:"-"`
}

type TestCaseResponse struct {
	ID              string   `json:"id"`
	ProjectID       int64    `json:"project_id"`
	CreatedByID     int64    `json:"created_by"`
	Kind            string   `json:"kind"`
	Code            string   `json:"code"`
	FeatureOrModule string   `json:"feature_or_module"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	IsDraft         bool     `json:"is_draft"`
	Tags            []string `json:"tags"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
	Status          string   `json:"status"`
	Result          string   `json:"result"`
	ExecutedBy      int64    `json:"executed_by"`
	Notes           string   `json:"notes"`
}

func NewTestCaseResponse(e *dbsqlc.TestCase) TestCaseResponse {
	return TestCaseResponse{
		ID:              e.ID.String(),
		ProjectID:       int64(e.ProjectID.Int32),
		CreatedByID:     int64(e.CreatedByID),
		Kind:            string(e.Kind),
		Code:            e.Code,
		FeatureOrModule: e.FeatureOrModule.String,
		Title:           e.Title,
		Description:     e.Description,
		IsDraft:         e.IsDraft.Bool,
		Tags:            e.Tags,
		CreatedAt:       formatSqlDateTime(e.CreatedAt),
		UpdatedAt:       formatSqlDateTime(e.UpdatedAt),
		Status:          e.Status.String,
		Result:          e.Result.String,
		ExecutedBy:      int64(e.ExecutedBy.Int32),
		Notes:           e.Notes.String,
	}
}

func NewTestCaseResponseList(items []dbsqlc.TestCase) []TestCaseResponse {
	res := make([]TestCaseResponse, 0)
	for _, item := range items {
		res = append(res, NewTestCaseResponse(&item))
	}
	return res
}

type UpdateTestCaseRequest struct {
	ID              string   `json:"id" validate:"required"`
	Kind            string   `json:"kind" validate:"required"`
	Code            string   `json:"code" validate:"required"`
	FeatureOrModule string   `json:"feature_or_module" validate:"required"`
	Title           string   `json:"title" validate:"required"`
	Description     string   `json:"description" validate:"required"`
	IsDraft         bool     `json:"is_draft" validate:"required"`
	Tags            []string `json:"tags" validate:"required"`
	CreatedByID     string   `json:"-" validate:"-"`
}

type BulkCreateTestCases struct {
	ProjectID int64                   `json:"project_id" validate:"required"`
	TestCases []CreateTestCaseRequest `json:"test_cases" validate:"required,min=1,max=100"`
}

type ImportFromGithubRequest struct {
	Owner       string `json:"owner"`
	Repository  string `json:"repository"`
	GitHubToken string `json:"github_token"`
	ProjectID   int64  `json:"project_id"`
}

type TestCaseListResponse struct {
	TestCases []TestCaseResponse `json:"test_cases"`
}

type AssignedTestCaseListResponse struct {
	TestCases []AssignedTestCase `json:"test_cases"`
}

type AssignedTestCase struct {
	ID                    string              `json:"id"`
	Kind                  dbsqlc.TestKind     `json:"kind"`
	Code                  string              `json:"code"`
	FeatureOrModule       string              `json:"feature_or_module"`
	Title                 string              `json:"title"`
	Description           string              `json:"description"`
	ParentTestCaseID      int                 `json:"parent_test_case_id"`
	IsDraft               bool                `json:"is_draft"`
	Tags                  []string            `json:"tags"`
	CreatedByID           int32               `json:"created_by_id"`
	TestCaseCreatedAt     time.Time           `json:"test_case_created_at"`
	TestCaseUpdatedAt     time.Time           `json:"test_case_updated_at"`
	ProjectID             int64               `json:"project_id"`
	TestRunID             string              `json:"test_run_id"`
	TestPlanID            int32               `json:"test_plan_id"`
	TestCaseID            string              `json:"-"`
	OwnerID               int32               `json:"owner_id"`
	TestedByID            int32               `json:"tested_by_id"`
	AssignedToID          int32               `json:"assigned_to_id"`
	AssigneeCanChangeCode bool                `json:"assignee_can_change_code"`
	ExternalIssueID       string              `json:"external_issue_id"`
	ResultState           dbsqlc.TestRunState `json:"result_state"`
	IsClosed              bool                `json:"is_closed"`
	Notes                 string              `json:"notes"`
	ActualResult          string              `json:"actual_result"`
	ExpectedResult        string              `json:"expected_result"`
	Reactions             []byte              `json:"reactions"`
	TestedOn              *time.Time          `json:"tested_on"`
	CreatedAt             time.Time           `json:"created_at"`
	UpdatedAt             time.Time           `json:"updated_at"`
}
