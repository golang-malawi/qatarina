package schema

type CreateProjectModuleRequest struct {
	ProjectID   int32  `json:"projectID" validate:"required"`
	Name        string `json:"name" validate:"required"`
	Code        string `json:"code" validate:"required"`
	Priority    int32  `json:"priority" validate:"required"`
	Type        string `json:"type" validate:"required"`
	Description string `json:"description" validate:"required"`
}

type UpdateProjectModuleRequest struct {
	ID          int32  `json:"id" validate:"required"`
	Name        string `json:"name" validate:"required"`
	Code        string `json:"code" validate:"required"`
	Priority    int32  `json:"priority" validate:"required"`
	Type        string `josn:"name" validate:"required"`
	Description string `json:"description" vlidate:"required"`
}
