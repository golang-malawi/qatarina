package schema

import "io"

type CreateProjectDocumentRequest struct {
	Name     string `form:"name" validate:"required"`
	FileName string
	FileSize int64
	MimeType string
	Content  io.Reader
}
type ProjectDocumentResponseItem struct {
	ID        string `json:"id"`
	ProjectID int64  `json:"project_id"`
	Name      string `json:"name"`
	FilePath  string `json:"file_path"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
