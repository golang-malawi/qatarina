package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ExportFileService struct {
	TestCases []TestCase
}

type TestCase struct {
	Title           string
	Description     string
	Kind            string
	Code            string
	FeatureOrModule string
	Tags            []string
	IsDraft         bool
}

func (e *ExportFileService) ToCSV() ([]byte, error) {
	var buffer bytes.Buffer

	writer := csv.NewWriter(&buffer)

	csvHeader := []string{
		"Title",
		"Description",
		"Kind",
		"Code",
		"FeatureOrModule",
		"Tags",
		"IsDraft",
	}

	if err := writer.Write(csvHeader); err != nil {
		return nil, fmt.Errorf("unable to write CSV header: %w", err)
	}

	for _, testCase := range e.TestCases {
		record := []string{
			testCase.Title,
			testCase.Description,
			testCase.Kind,
			testCase.Code,
			testCase.FeatureOrModule,
			strings.Join(testCase.Tags, ","),
			strconv.FormatBool(testCase.IsDraft),
		}

		if err := writer.Write(record); err != nil {
			return nil, fmt.Errorf("unable to write CSV record: %w", err)
		}
	}

	writer.Flush()

	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("unable to flush CSV data: %w", err)
	}

	return buffer.Bytes(), nil
}

func (e *ExportFileService) ToXLSX() ([]byte, error) {
	file := excelize.NewFile()
	defer file.Close()

	defaultSheet := "Sheet1"

	file.SetCellValue(defaultSheet, "A1", "Title")
	file.SetCellValue(defaultSheet, "B1", "Description")
	file.SetCellValue(defaultSheet, "C1", "Kind")
	file.SetCellValue(defaultSheet, "D1", "Code")
	file.SetCellValue(defaultSheet, "E1", "FeatureOrModule")
	file.SetCellValue(defaultSheet, "F1", "Tags")
	file.SetCellValue(defaultSheet, "G1", "IsDraft")

	for index, testCase := range e.TestCases {
		row := index + 2

		file.SetCellValue(defaultSheet, fmt.Sprintf("A%d", row), testCase.Title)
		file.SetCellValue(defaultSheet, fmt.Sprintf("B%d", row), testCase.Description)
		file.SetCellValue(defaultSheet, fmt.Sprintf("C%d", row), testCase.Kind)
		file.SetCellValue(defaultSheet, fmt.Sprintf("D%d", row), testCase.Code)
		file.SetCellValue(defaultSheet, fmt.Sprintf("E%d", row), testCase.FeatureOrModule)
		file.SetCellValue(defaultSheet, fmt.Sprintf("F%d", row), strings.Join(testCase.Tags, ","))
		file.SetCellValue(defaultSheet, fmt.Sprintf("G%d", row), testCase.IsDraft)
	}

	var buffer bytes.Buffer

	if err := file.Write(&buffer); err != nil {
		return nil, fmt.Errorf("unable to write XLSX data: %w", err)
	}

	return buffer.Bytes(), nil
}
