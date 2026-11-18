package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
)

type ReportService interface {
	ListByProject(ctx context.Context, projectID int64) ([]dbsqlc.Report, error)
	Create(ctx context.Context, req *schema.CreateReportRequest) (*dbsqlc.Report, error)
	GetByID(ctx context.Context, id string) (*dbsqlc.Report, error)
	DeleteByID(ctx context.Context, id string) error
}

type reportServiceImpl struct {
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewReportService(db *sql.DB, queries *dbsqlc.Queries, logger logging.Logger) ReportService {
	return &reportServiceImpl{db: db, queries: queries, logger: logger}
}

func (s *reportServiceImpl) ListByProject(ctx context.Context, projectID int64) ([]dbsqlc.Report, error) {
	return s.queries.ListReportsByProject(ctx, int32(projectID))
}

// ErrTestPlanNotClosed is returned when a report is requested for a test plan that is still open
var ErrTestPlanNotClosed = errors.New("reports can only be generated for closed test plans")

func (s *reportServiceImpl) Create(ctx context.Context, req *schema.CreateReportRequest) (*dbsqlc.Report, error) {
	plan, err := s.queries.GetTestPlan(ctx, req.TestPlanID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		s.logger.Error("reports-service", "failed to fetch test plan", "testPlanID", req.TestPlanID, "error", err)
		return nil, fmt.Errorf("failed to fetch test plan: %w", err)
	}
	if int64(plan.ProjectID) != req.ProjectID {
		return nil, ErrTestPlanProjectMismatch
	}
	if !plan.IsComplete.Bool && !plan.ClosedAt.Valid {
		return nil, ErrTestPlanNotClosed
	}
	return createTestPlanReport(ctx, s.queries, s.logger, plan, req.Name, req.Type, req.Status)
}

// createTestPlanReport generates the PDF report of a test plan, stores it linked to
// the plan and marks the plan as having a report
func createTestPlanReport(ctx context.Context, queries *dbsqlc.Queries, logger logging.Logger, plan dbsqlc.GetTestPlanRow, name, reportType, status string) (*dbsqlc.Report, error) {
	stats, err := queries.GetTestPlanRunStats(ctx, common.NewNullInt32(int32(plan.ID)))
	if err != nil {
		logger.Error("reports-service", "failed to fetch plan stats", "testPlanID", plan.ID, "error", err)
		return nil, fmt.Errorf("failed to fetch test plan stats: %w", err)
	}

	runs, err := queries.ListTestRunsByPlan(ctx, common.NewNullInt32(int32(plan.ID)))
	if err != nil {
		logger.Error("reports-service", "failed to fetch test runs", "testPlanID", plan.ID, "error", err)
		return nil, fmt.Errorf("failed to fetch test runs: %w", err)
	}

	id := uuid.New()

	// Ensure storage/reports directory exists
	reportDir := "storage/reports"
	if err := os.MkdirAll(reportDir, os.ModePerm); err != nil {
		logger.Error("reports-service", "failed to create reports directory", "dir", reportDir, "error", err)
		return nil, fmt.Errorf("failed to prepare reports directory: %w", err)
	}

	filePath := filepath.Join(reportDir, fmt.Sprintf("%s.pdf", id.String()))

	// Create PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, fmt.Sprintf("Report: %s", name))
	pdf.Ln(12)

	// Plan summary
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, fmt.Sprintf("Test Plan: %s", plan.Description.String))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Environment ID: %d", plan.EnvironmentID.Int32))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Passed: %d", stats.PassedCount))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Failed: %d", stats.FailedCount))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Pending: %d", stats.PendingCount))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Assigned Testers: %d", stats.AssignedTestersCount))
	pdf.Ln(12)

	// Run details table
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 10, "Test Run Details")
	pdf.Ln(12)

	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(30, 7, "Run ID", "1", 0, "", false, 0, "")
	pdf.CellFormat(30, 7, "Code", "1", 0, "", false, 0, "")
	pdf.CellFormat(40, 7, "Executed By", "1", 0, "", false, 0, "")
	pdf.CellFormat(30, 7, "Result", "1", 0, "", false, 0, "")
	pdf.CellFormat(30, 7, "Status", "1", 0, "", false, 0, "")
	pdf.Ln(-1)

	for _, run := range runs {
		runID := run.ID.String()
		if len(runID) > 8 {
			runID = runID[:8] + "..."
		}
		pdf.CellFormat(30, 7, runID, "1", 0, "", false, 0, "")
		pdf.CellFormat(30, 7, run.Code, "1", 0, "", false, 0, "")
		executedBy := "Unknown"
		if run.ExecutedBy.Valid {
			executedBy = run.ExecutedBy.String
		}
		pdf.CellFormat(40, 7, executedBy, "1", 0, "", false, 0, "")
		pdf.CellFormat(30, 7, string(run.ResultState), "1", 0, "", false, 0, "")
		status := "Open"
		if run.IsClosed.Bool {
			status = "Closed"
		}
		pdf.CellFormat(30, 7, status, "1", 0, "", false, 0, "")
		pdf.Ln(-1)
	}

	// Save the PDF before storing the report, so no report is left without its file
	if err := pdf.OutputFileAndClose(filePath); err != nil {
		logger.Error("reports-service", "failed to write PDF", "filePath", filePath, "error", err)
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	r, err := queries.CreateReport(ctx, dbsqlc.CreateReportParams{
		ID:         id,
		ProjectID:  plan.ProjectID,
		TestPlanID: sql.NullInt64{Int64: plan.ID, Valid: true},
		Name:       name,
		Type:       reportType,
		Status:     status,
		FilePath:   sql.NullString{String: filePath, Valid: true},
	})
	if err != nil {
		os.Remove(filePath)
		logger.Error("reports-service", "failed to insert report", "error", err)
		return nil, fmt.Errorf("failed to create report: %w", err)
	}

	if err := queries.RefreshTestPlanHasReport(ctx, plan.ID); err != nil {
		logger.Error("reports-service", "failed to mark test plan as having a report", "testPlanID", plan.ID, "error", err)
		return nil, fmt.Errorf("failed to mark test plan as having a report: %w", err)
	}
	return &r, nil
}

func (s *reportServiceImpl) GetByID(ctx context.Context, id string) (*dbsqlc.Report, error) {
	reportID, err := uuid.Parse(id)
	if err != nil {
		return nil, ErrNotFound
	}
	r, err := s.queries.GetReport(ctx, reportID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *reportServiceImpl) DeleteByID(ctx context.Context, id string) error {
	report, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if _, err := s.queries.DeleteReport(ctx, report.ID); err != nil {
		return err
	}
	if report.FilePath.Valid {
		if err := os.Remove(report.FilePath.String); err != nil && !errors.Is(err, os.ErrNotExist) {
			s.logger.Error("reports-service", "failed to remove report file", "filePath", report.FilePath.String, "error", err)
		}
	}
	// The plan keeps has_report only while another report is linked to it
	if report.TestPlanID.Valid {
		if err := s.queries.RefreshTestPlanHasReport(ctx, report.TestPlanID.Int64); err != nil {
			return fmt.Errorf("failed to update test plan report flag: %w", err)
		}
	}
	return nil
}
