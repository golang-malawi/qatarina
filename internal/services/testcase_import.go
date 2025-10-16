package services

import (
	"context"
	"encoding/csv"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/xuri/excelize/v2"
)

type TestCaseImportService interface {
	ParseFile(ctx context.Context, projectID int64, file multipart.File, filename string) ([]schema.CreateTestCaseRequest, error)
}

type testCaseImportServiceImpl struct {
	name           loggedmodule.Name
	projectService ProjectService
	logger         logging.Logger
}

func NewTestCaseImportService(projectService ProjectService, logger logging.Logger) TestCaseImportService {
	return &testCaseImportServiceImpl{
		projectService: projectService,
		name:           "importTestcasesFromFile-service",
		logger:         logger,
	}
}

func (s *testCaseImportServiceImpl) ParseFile(ctx context.Context, projectID int64, file multipart.File, filename string) ([]schema.CreateTestCaseRequest, error) {
	// Validate project existence
	project, err := s.projectService.FindByID(ctx, projectID)
	if err != nil || project == nil {
		s.logger.Error(s.name, "project not found", "projectID", projectID, "error", err)
		return nil, fmt.Errorf("project not found :%w", err)
	}

	ext := strings.ToLower(filepath.Ext(filename))
	var rows [][]string

	switch ext {
	case ".csv":
		reader := csv.NewReader(file)
		rows, err = reader.ReadAll()
		if err != nil {
			s.logger.Error(s.name, "failed to parse CSV file", "error", err)
			return nil, fmt.Errorf("failed to parse CSV file: %w", err)
		}
	case ".xlsx":
		f, err := excelize.OpenReader(file)
		if err != nil {
			s.logger.Error(s.name, "failed to  parse Excel file", "error", err)
			return nil, fmt.Errorf("failed to parse Excel file: %w", err)
		}
		rows, err = f.GetRows("Sheet1")
		if err != nil {
			s.logger.Error(s.name, "failed to read Excel rows", "error", err)
			return nil, fmt.Errorf("failed to read Excel rows: %w", err)
		}
	default:
		s.logger.Error(s.name, "unsupported file type", "filename", filename)
		return nil, fmt.Errorf("unsupported file type")
	}

	// Detect header row
	start := 1
	for i, row := range rows {
		if len(row) >= 7 && strings.ToLower(row[0]) == "title" && strings.ToLower(row[2]) == "kind" {
			start = i + 1
			break
		}
	}

	var testCases []schema.CreateTestCaseRequest
	for i, row := range rows[start:] {
		if len(row) < 7 {
			s.logger.Info(s.name, "skipping row with insuffient columns", "rowIndex", i+start, "columnCount", len(row))
			continue
		}

		tags := strings.Split(row[5], ",")
		for i := range tags {
			tags[i] = strings.TrimSpace(tags[i])
		}

		testCases = append(testCases, schema.CreateTestCaseRequest{
			ProjectID:       projectID,
			Title:           row[0],
			Description:     row[1],
			Kind:            row[2],
			Code:            row[3],
			FeatureOrModule: row[4],
			Tags:            tags,
			IsDraft:         strings.ToLower(row[6]) == "true",
		})
	}

	if len(testCases) == 0 {
		s.logger.Error(s.name, "no valid test cases found", "projectID", projectID)
		return nil, fmt.Errorf("no valid test cases found")
	}

	return testCases, nil
}
