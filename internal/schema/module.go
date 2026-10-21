package schema

type CreateProjectModuleRequest struct {
	ProjectID   int32  `json:"project_id" validate:"required"`
	Name        string `json:"name" validate:"required"`
	Code        string `json:"code" validate:"required"`
	Priority    int32  `json:"priority" validate:"required"`
	Type        string `json:"type" validate:"required"`
	Description string `json:"description" validate:"required"`
	// ParentModuleID is the module this module sits under, omit for a top-level module
	ParentModuleID *int32 `json:"parent_module_id"`
}

type UpdateProjectModuleRequest struct {
	ID          int32  `json:"id,omitempty" swaggerignore:"true"`
	Name        string `json:"name" validate:"required"`
	Code        string `json:"code" validate:"required"`
	Priority    int32  `json:"priority" validate:"required"`
	Type        string `json:"type" validate:"required"`
	Description string `json:"description" vlidate:"required"`
	// ParentModuleID is the module this module sits under, omit or null to make it a top-level module
	ParentModuleID *int32 `json:"parent_module_id"`
}
