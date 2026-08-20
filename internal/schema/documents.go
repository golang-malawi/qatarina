package schema

type CreateProjectDocumentRequest struct {
	Name     string `form:"name" validate:"required"`
	FilePath string
	FileSize int64
	MimeType string
}
type ProjectDocumentResponseItem struct {
	ID        string `json:"id"`
	ProjectID int64  `json:"project_id"`
	Name      string `json:"name"`
	FilePath  string `json:"file_path"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
