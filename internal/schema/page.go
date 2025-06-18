package schema

type PageRequest struct {
	Title string `json:"title" validate:"required"`
	Owner string `json:"owner" validate:"required"`
}
