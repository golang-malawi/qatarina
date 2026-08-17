package schema

type CreateProjectDocumentRequest struct {
	Name     string `json:"name" validate:"required"`
	FilePath string `json:"file_path" validate:"required"`
}

type ProjectDocumentResponseItem struct {
	ID        string `json:"id"`
	ProjectID int64  `json:"project_id"`
	Name      string `json:"name"`
	FilePath  string `json:"file_path"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
