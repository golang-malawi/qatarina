package schema

type InboxFilterParams struct {
	UserID        int64   `json:"-"`
	PageSize      int     `json:"page_size"`
	Page          int     `json:"page"`
	IncludeClosed bool    `json:"include_closed"`
	Projects      []int32 `json:"projects"` // Projects to filter by
	Search        string  `json:"search"`   // Matches title, code, description, feature_or_module or tags
	// SearchIDs are test case IDs matched by the search engine, in relevance order.
	// They are included in the results alongside the database matches for Search
	SearchIDs []string `json:"-"`
}

type InboxUnseenCountResponse struct {
	UnseenCount int64 `json:"unseen_count"`
}
