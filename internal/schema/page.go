package schema

type CreatePageRequest struct {
	Title string `json:"title" validate:"required"`
	Owner string `json:"owner" validate:"required"`
}
