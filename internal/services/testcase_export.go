package services

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ExportFileService struct {
	FileName  string
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

func (e *ExportFileService) ToCSV() error {
	fileExtension := ".csv"
	f := e.FileName + fileExtension

	file, err := os.Create(f)
	if err != nil {
		return fmt.Errorf("unable to create %s file: %w", f, err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	csvHeader := []string{"Title", "Description", "Kind", "Code", "FeatureOrModule", "Tags", "IsDraft"}
	var csvData [][]string
	csvData = append(csvData, csvHeader)

	for _, testCase := range e.TestCases {
		csvData = append(csvData, []string{
			testCase.Title,
			testCase.Description,
			testCase.Kind,
			testCase.Code,
			testCase.FeatureOrModule,
			strings.Join(testCase.Tags, ","),
			strconv.FormatBool(testCase.IsDraft),
		})
	}

	if err := writer.WriteAll(csvData); err != nil {
		return fmt.Errorf("unable to write CSV records for file %s: %w", f, err)
	}

	return nil

}

func (e *ExportFileService) ToXLSX() error {
	fileExtension := ".xlsx"
	fName := e.FileName + fileExtension

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

	if err := file.SaveAs(fName); err != nil {
		return fmt.Errorf("unable to save the xlsx file %s: %w", fName, err)
	}

	return nil
}
