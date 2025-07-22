package schema

type UploadDocumentRequest struct {
	UserID    int32  `json:"user_id"`
	ProjectID int32  `json:"project_id"`
	Name      string `json:"name"`
}
