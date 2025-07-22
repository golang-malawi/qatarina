package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type SuggestTestCaseService interface {
	CreateSuggestions(context.Context, *multipart.FileHeader) ([]string, error)
	ListAllUploads(context.Context) ([]dbsqlc.Upload, error)
	DeleteUpload(context.Context, int32) error
}

type suggestTestCaseServiceImpl struct {
	queries      *dbsqlc.Queries
	logger       logging.Logger
	geminiClient common.GeminiAPI
}

func NewSuggestTestCaseService(conn *dbsqlc.Queries, logger logging.Logger, geminiClient common.GeminiAPI) SuggestTestCaseService {
	return &suggestTestCaseServiceImpl{
		queries:      conn,
		logger:       logger,
		geminiClient: geminiClient,
	}
}

func (u *suggestTestCaseServiceImpl) CreateSuggestions(ctx context.Context, file *multipart.FileHeader) ([]string, error) {
	var req schema.UploadDocumentRequest
	// Get the file extension
	fileExtension := strings.ToLower(filepath.Ext(file.Filename))
	allowedExtensions := map[string]bool{
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".md":   true,
	}
	if !allowedExtensions[fileExtension] {
		return nil, fmt.Errorf("unsupported file type: %s", fileExtension)
	}
	// Create the uploads directory if it doesn't exist
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.Mkdir(uploadDir, os.ModePerm); err != nil {
			u.logger.Error("failed to create uploads directory", "error", err)
			return nil, fmt.Errorf("failed to create the uploads directory %w", err)
		}
	}

	// Save file to uploads directory
	src, err := file.Open()
	if err != nil {
		u.logger.Error("failed to open file", "eror", err)
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	dstPath := filepath.Join(uploadDir, file.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		u.logger.Error("failed to create destination file", "error", err)
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		u.logger.Error("failed to save file", "error", err)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Store the uploaded document details
	_, err = u.queries.CreateUpload(ctx, dbsqlc.CreateUploadParams{
		UserID:    req.UserID,
		ProjectID: req.ProjectID,
		Name:      file.Filename,
	})
	if err != nil {
		u.logger.Error("failed to save upload details into database", "error", err)
		return nil, fmt.Errorf("failed to store upload info: %w", err)
	}

	// Reaad file contents to be used for analysis by Gemini AI model
	contentBytes, err := os.ReadFile(dstPath)
	if err != nil {
		u.logger.Error("failed to read uploaded file", "error", err)
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	fileContents := string(bytes.Runes(contentBytes))

	// Send to Gemini API
	testCases, err := generateTestCasesFromText(fileContents, u.geminiClient)
	if err != nil {
		u.logger.Error("failed to generate test cases", "error", err)
		return nil, fmt.Errorf("failed to analyze file: %w", err)
	}

	return testCases, nil
}

func generateTestCasesFromText(content string, geminiClient common.GeminiAPI) ([]string, error) {
	// Send contenet to Gemini for interpretation
	resp, err := geminiClient.AnalyzeText(content)
	if err != nil {
		return nil, err
	}
	return resp.SuggestedTestCases, nil
}

func (u *suggestTestCaseServiceImpl) ListAllUploads(ctx context.Context) ([]dbsqlc.Upload, error) {
	return nil, nil
}

func (u *suggestTestCaseServiceImpl) DeleteUpload(ctx context.Context, uploadID int32) error {
	return nil
}
