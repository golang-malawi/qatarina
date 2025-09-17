package schema

import "time"

type DashboardSummaryResponse struct {
	ProjectCount      int64                    `json:"project_count"`
	TesterCount       int64                    `json:"tester_count"`
	TestCaseCount     int64                    `json:"test_case_count"`
	TestPlanCount     int64                    `json:"test_plan_count"`
	ClosedToOpenRatio float64                  `json:"closed_to_open_ration"`
	RecentProjects    []DashboardProjectRecord `json:"recent_projects"`
}

type DashboardProjectRecord struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	UpdatedAt time.Time `json:"updated_at"`
}
