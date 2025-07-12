package schema

import (
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

// CreateTestPlan request to create a new test plan with tests assigned to specific users
type CreateTestPlan struct {
	ProjectID      int64                `json:"project_id" validate:"required"`
	Kind           string               `json:"kind" validate:"required"`
	Description    string               `json:"description" validate:"required"`
	StartAt        string               `json:"start_at" validate:"required"`
	ClosedAt       *string              `json:"closed_at"`
	ScheduledEndAt string               `json:"scheduled_end_at"`
	AssignedToID   int64                `json:"assigned_to_id" validate:"-"`
	CreatedByID    int64                `json:"created_by_id" validate:"-"`
	UpdatedByID    int64                `json:"updated_by_id" validate:"-"`
	PlannedTests   []TestCaseAssignment `json:"planned_tests"`
}

type TestCaseAssignment struct {
	TestCaseID string  `json:"test_case_id"`
	UserIds    []int64 `json:"user_ids"`
}

type AssignTestsToPlanRequest struct {
	ProjectID    int64                `json:"project_id" validate:"required"`
	PlanID       int64                `json:"test_plan_id" validate:"required"`
	PlannedTests []TestCaseAssignment `json:"planned_tests" validate:"required,min=1,max=100"`
}

type TestPlanResponseItem struct {
	ID             int64  `json:"id"`
	ProjectID      int32  `json:"project_id"`
	AssignedToID   int32  `json:"assigned_to_id"`
	CreatedByID    int32  `json:"created_by_id"`
	UpdatedByID    int32  `json:"updated_by_id"`
	Kind           string `json:"kind"`
	Description    string `json:"description"`
	StartAt        string `json:"start_at"`
	ClosedAt       string `json:"closed_at"`
	ScheduledEndAt string `json:"scheduled_end_at"`
	NumTestCases   int32  `json:"num_test_cases"`
	NumFailures    int32  `json:"num_failures"`
	IsComplete     bool   `json:"is_complete"`
	IsLocked       bool   `json:"is_locked"`
	HasReport      bool   `json:"has_report"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

func NewTestPlanListResponse(items []dbsqlc.TestPlan) []TestPlanResponseItem {
	res := make([]TestPlanResponseItem, 0)
	for _, e := range items {
		res = append(res, TestPlanResponseItem{
			ID:             e.ID,
			ProjectID:      e.ProjectID,
			AssignedToID:   e.AssignedToID,
			CreatedByID:    e.CreatedByID,
			UpdatedByID:    e.UpdatedByID,
			Kind:           string(e.Kind),
			Description:    e.Description.String,
			StartAt:        e.StartAt.Time.Format(time.DateTime),
			ClosedAt:       e.ClosedAt.Time.Format(time.DateTime),
			ScheduledEndAt: e.ScheduledEndAt.Time.Format(time.DateTime),
			NumTestCases:   e.NumTestCases,
			NumFailures:    e.NumFailures,
			IsComplete:     e.IsComplete.Bool,
			IsLocked:       e.IsLocked.Bool,
			HasReport:      e.HasReport.Bool,
			CreatedAt:      e.CreatedAt.Time.Format(time.DateTime),
			UpdatedAt:      e.UpdatedAt.Time.Format(time.DateTime),
		})
	}

	return res
}

type TestPlanListResponse struct {
	TestPlans []TestPlanResponseItem `json:"test_plans"`
}

type UpdateTestPlan struct {
	ProjectID      int64     `json:"project_id" validate:"required"`
	Kind           string    `json:"kind" validate:"required"`
	Description    string    `json:"description" validate:"required"`
	StartAt        time.Time `json:"start_at" validate:"required"`
	ClosedAt       time.Time `json:"closed_at"`
	ScheduledEndAt time.Time `json:"scheduled_end_at"`
	AssignedToID   int64     `json:"assigned_to_id" validate:"-"`
	CreatedByID    int64     `json:"created_by_id" validate:"-"`
	UpdatedByID    int64     `json:"updated_by_id" validate:"-"`
}
