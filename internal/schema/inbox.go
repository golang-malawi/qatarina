package schema

type InboxFilterParams struct {
	UserID        int64   `json:"-"`
	PageSize      int     `json:"page_size"`
	Page          int     `json:"page"`
	IncludeClosed bool    `json:"include_closed"`
	Projects      []int32 `json:"projects"` // Projects to filter by
}

type InboxUnseenCountResponse struct {
	UnseenCount int64 `json:"unseen_count"`
}

// InboxNavigationResponse holds the neighbouring test cases around a test case
// in the user's inbox, following the inbox order. An empty ID means there is no
// test case in that direction. Position is 1-based within Total.
type InboxNavigationResponse struct {
	PreviousID string `json:"previous_id"`
	NextID     string `json:"next_id"`
	Position   int64  `json:"position"`
	Total      int64  `json:"total"`
}
