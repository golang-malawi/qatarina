package schema

type InboxFilterParams struct {
	UserID        int64    `json:"-"`
	PageSize      int      `json:"page_size"`
	Page          int      `json:"page"`
	IncludeClosed bool     `json:"include_closed"`
	Projects      []string `json:"projects"` // Projects to filter by
}
