package schema

import (
	"database/sql"

	"github.com/gobuffalo/nulls"
)

type PageRequest struct {
	ParentPageID       sql.NullInt32 `json:"parentPageId"`
	PageVersion        string        `json:"pageVersion"`
	OrgID              int32         `json:"orgId"`
	ProjectID          int32         `json:"projectId"`
	Code               string        `json:"code"`
	Title              string        `json:"title"`
	FilePath           nulls.String  `json:"filePath"`
	Content            string        `json:"content"`
	PageType           string        `json:"pageType"`
	MimeType           string        `json:"mimeType"`
	HasEmbeddedMedia   bool          `json:"hasEmbeddedMedia"`
	ExternalContentUrl nulls.String  `json:"externalContentUrl"`
	NotionUrl          nulls.String  `json:"notionUrl"`
	LastEditedBy       int32         `json:"-"`
	CreatedBy          int32         `json:"-"`
}
