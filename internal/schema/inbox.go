package schema

type InboxFilterParams struct {
	UserID        int64   `json:"-"`
	PageSize      int     `json:"page_size"`
	Page          int     `json:"page"`
	IncludeClosed bool    `json:"include_closed"`
	Projects      []int32 `json:"projects"`       // Projects to filter by
	EnvironmentID int32   `json:"environment_id"` // 0 means any environment
	TestPlanID    int64   `json:"test_plan_id"`   // 0 means any test plan
	Module        string  `json:"module"`         // Feature or module name; empty means any
	Search        string  `json:"search"`         // Matches title, code or feature/module
}

// InboxFilterOption is one selectable value in an inbox filter dropdown
type InboxFilterOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// InboxFilterOptionsResponse lists the projects, environments, test plans and
// modules present in the current user's inbox
type InboxFilterOptionsResponse struct {
	Projects     []InboxFilterOption `json:"projects"`
	Environments []InboxFilterOption `json:"environments"`
	TestPlans    []InboxFilterOption `json:"test_plans"` // Newest first
	Modules      []InboxFilterOption `json:"modules"`
}

type InboxUnseenCountResponse struct {
	UnseenCount int64 `json:"unseen_count"`
}

// InboxNavigationResponse holds the neighbouring assignments around an assignment
// in the user's inbox, following the inbox order. An inbox row is a test case in a
// test plan, so each neighbour has both. An empty ID means there is no test case in
// that direction. Position is 1-based within Total.
type InboxNavigationResponse struct {
	PreviousID         string `json:"previous_id"`
	PreviousTestPlanID int64  `json:"previous_test_plan_id"`
	NextID             string `json:"next_id"`
	NextTestPlanID     int64  `json:"next_test_plan_id"`
	Position           int64  `json:"position"`
	Total              int64  `json:"total"`
}
