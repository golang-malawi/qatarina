package schema

type CreateTestCaseRequest struct {
	Kind            string   `json:"kind" validate:"required"`
	Code            string   `json:"code" validate:"required"`
	FeatureOrModule string   `json:"feature_or_module" validate:"required"`
	Title           string   `json:"title" validate:"required"`
	Description     string   `json:"description" validate:"required"`
	IsDraft         bool     `json:"is_draft" validate:"required"`
	Tags            []string `json:"tags" validate:"required"`
	CreatedByID     string   `json:"-" validate:"-"`
}

type UpdateTestCaseRequest struct {
	// TODO: update the fields here..
	Kind            string   `json:"kind" validate:"required"`
	Code            string   `json:"code" validate:"required"`
	FeatureOrModule string   `json:"feature_or_module" validate:"required"`
	Title           string   `json:"title" validate:"required"`
	Description     string   `json:"description" validate:"required"`
	IsDraft         string   `json:"is_draft" validate:"required"`
	Tags            []string `json:"tags" validate:"required"`
	CreatedByID     string   `json:"-" validate:"-"`
}

type BulkCreateTestCases struct {
	ProjectID int64                   `json:"project_id" validate:"required"`
	TestCases []CreateTestCaseRequest `json:"test_cases" validate:"required,min=1,max=100"`
}
