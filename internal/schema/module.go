package schema

type CreateProjectModuleRequest struct {
	ProjectID int32  `json:"projectID" validate:"required"`
	Name      string `json:"name" validate:"required"`
	Code      string `json:"code" validate:"required"`
	Priority  int32  `json:"priority" validate:"required"`
}

type UpdateProjectModuleRequest struct {
	ProjectID int32  `json:"projectID" validate:"required"`
	Name      string `json:"name" validate:"required"`
}
