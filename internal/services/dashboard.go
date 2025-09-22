package services

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type DashboardService interface {
	GetDashboardSummary(ctx context.Context) (*schema.DashboardSummaryResponse, error)
}

type dashboardServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewDashboardService(queries *dbsqlc.Queries, logger logging.Logger) DashboardService {
	return &dashboardServiceImpl{
		queries: queries,
		logger:  logger,
	}
}

func (d *dashboardServiceImpl) GetDashboardSummary(ctx context.Context) (*schema.DashboardSummaryResponse, error) {
	projectCount, err := d.queries.GetProjectCount(ctx)
	if err != nil {
		d.logger.Error("failed to get project count", "error", err)
		return nil, fmt.Errorf("failed to get project count: %w", err)
	}

	testerCount, err := d.queries.GetTesterCount(ctx)
	if err != nil {
		d.logger.Error("failed to get tester count", "error", err)
		return nil, fmt.Errorf("failed to get tester count: %w", err)
	}

	testCaseCount, err := d.queries.GetTestCaseCount(ctx)
	if err != nil {
		d.logger.Error("failed to get test case count", "error", err)
		return nil, fmt.Errorf("failed to get test case count: %w", err)
	}

	testPlanCount, err := d.queries.GetTestPlanCount(ctx)
	if err != nil {
		d.logger.Error("failed to get test plan count", "error", err)
		return nil, fmt.Errorf("failed to get test plan count: %w", err)
	}

	statusRatio, err := d.queries.GetTestPlanStatusRatio(ctx)
	if err != nil {
		d.logger.Error("failed to get test plan status ratio", "error", err)
		return nil, fmt.Errorf("failed to get test plan status ratio: %w", err)
	}

	recentProjects, err := d.queries.GetRecentProjects(ctx)
	if err != nil {
		d.logger.Error("failed to gete recent projects", "error", err)
		return nil, fmt.Errorf("failed to get recent projects: %w", err)
	}

	var ratio float64
	if statusRatio.Open > 0 {
		ratio = float64(statusRatio.Closed) / float64(statusRatio.Open)
	}

	projectRecords := make([]schema.DashboardProjectRecord, len(recentProjects))
	for i, p := range recentProjects {
		projectRecords[i] = schema.DashboardProjectRecord{
			ID:        int64(p.ID),
			Name:      p.Name,
			UpdatedAt: p.UpdatedAt,
		}
	}

	return &schema.DashboardSummaryResponse{
		ProjectCount:      projectCount,
		TesterCount:       testerCount,
		TestCaseCount:     testCaseCount,
		TestPlanCount:     testPlanCount,
		ClosedToOpenRatio: ratio,
		RecentProjects:    projectRecords,
	}, nil
}
