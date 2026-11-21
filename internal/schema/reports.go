package schema

import (
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

type ReportResponse struct {
	ID        string `json:"id"`
	ProjectID int64  `json:"project_id"`
	// The test plan the report was generated for, 0 for older reports not linked to a plan
	TestPlanID int64     `json:"test_plan_id,omitempty"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	FilePath   string    `json:"file_path,omitempty"`
}

func NewReportResponse(r dbsqlc.Report) ReportResponse {
	return ReportResponse{
		ID:         r.ID.String(),
		ProjectID:  int64(r.ProjectID),
		TestPlanID: r.TestPlanID.Int64,
		Name:       r.Name,
		Type:       r.Type,
		Status:     r.Status,
		CreatedAt:  r.CreatedAt.Time,
		FilePath:   r.FilePath.String,
	}
}

type ReportListResponse struct {
	Reports    []ReportResponse `json:"reports"`
	Pagination *Pagination      `json:"pagination,omitempty"`
}

type CreateReportRequest struct {
	ProjectID  int64  `json:"project_id" validate:"required"`
	TestPlanID int64  `json:"test_plan_id" validate:"required"`
	Name       string `json:"name" validate:"required"`
	Type       string `json:"type" validate:"required"`
	Status     string `json:"status" validate:"required"`
}

func NewReportResponseList(items []dbsqlc.Report) []ReportResponse {
	res := make([]ReportResponse, 0, len(items))
	for _, item := range items {
		res = append(res, NewReportResponse(item))
	}
	return res
}

type ReportDownloadResponse struct {
	ID       string `json:"id"`
	FilePath string `json:"file_path"`
}

// CloseTestPlanResponse is returned when a test plan is closed. Report is empty when the
// plan was closed but its report could not be generated
type CloseTestPlanResponse struct {
	Message string          `json:"message"`
	Report  *ReportResponse `json:"report,omitempty"`
}
