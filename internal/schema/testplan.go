package schema

// CreateTestPlan request to create a new test plan with tests assigned to specific users
type CreateTestPlan struct {
	ProjectID      int64                `json:"project_id" validate:"required"`
	AssignedToID   int64                `json:"assigned_to_id" validate:"required"`
	CreatedByID    int64                `json:"created_by_id" validate:"required"`
	UpdatedByID    int64                `json:"updated_by_id" validate:"required"`
	Kind           string               `json:"kind" validate:"required"`
	Description    string               `json:"description" validate:"required"`
	StartAt        string               `json:"start_at" validate:"required"`
	ClosedAt       *string              `json:"closed_at"`
	ScheduledEndAt string               `json:"scheduled_end_at"`
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
