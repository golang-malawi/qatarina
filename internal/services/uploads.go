package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
)

type UploadService interface {
	CreateUpload(context.Context, *multipart.FileHeader) error
	ListAllUploads(context.Context) ([]dbsqlc.Upload, error)
	DeleteUpload(context.Context, int32) error
}

type uploadServiceImpl struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
	cfg     *config.Config
}

func NewUploadService(conn *dbsqlc.Queries, logger logging.Logger, cfg *config.Config) UploadService {
	return &uploadServiceImpl{
		queries: conn,
		logger:  logger,
		cfg:     cfg,
	}
}

func (u *uploadServiceImpl) CreateUpload(ctx context.Context, file *multipart.FileHeader) error {
	var req schema.UploadDocumentRequest
	// Get the file extension
	fileExtension := strings.ToLower(filepath.Ext(file.Filename))

	// Create the uploads directory if it doesn't exist
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.Mkdir(uploadDir, os.ModePerm); err != nil {
			u.logger.Error("failed to create uploads directory", "error", err)
			return fmt.Errorf("failed to create the uploads directory %w", err)
		}
	}

	var savedFilename string

	// Uploading the file in the directory
	if fileExtension != ".pdf" {
		pdfBytes, err := convertToPDF(file, u.cfg.Gotenberg.LibreOffice)
		if err != nil {
			u.logger.Error("failed to convert Word to pdf", "error", err)
			return fmt.Errorf("failed to convert to pdf %w", err)
		}

		// Save the converted PDF file
		savedFilename = strings.TrimSuffix(file.Filename, fileExtension) + ".pdf"
		dstPath := filepath.Join(uploadDir, savedFilename)

		err = os.WriteFile(dstPath, pdfBytes, 0644)
		if err != nil {
			u.logger.Error("failed to write file", "error", err)
			return fmt.Errorf("failed to write file %v", err)
		}

	} else {
		// Save the already pdf file
		src, err := file.Open()
		if err != nil {
			u.logger.Error("failed to open file", "eror", err)
			return fmt.Errorf("failed to open file: %w", err)
		}
		defer src.Close()

		savedFilename = file.Filename
		dstPath := filepath.Join(uploadDir, file.Filename)
		dst, err := os.Create(dstPath)
		if err != nil {
			u.logger.Error("failed to create destination file", "error", err)
			return fmt.Errorf("failed to create file: %w", err)
		}
		defer dst.Close()

		if _, err := io.Copy(dst, src); err != nil {
			u.logger.Error("failed to save file", "error", err)
			return fmt.Errorf("failed to save file: %w", err)
		}
	}

	// Store the uploaded document details
	_, err := u.queries.CreateUpload(ctx, dbsqlc.CreateUploadParams{
		UserID:    req.UserID,
		ProjectID: req.ProjectID,
		Name:      savedFilename,
	})
	if err != nil {
		u.logger.Error("failed to save upload details into database", "error", err)
		return fmt.Errorf("failed ot store upload info: %w", err)
	}

	return nil
}

// converting a word document file to pdf using gotenberg API
func convertToPDF(fileHeader *multipart.FileHeader, gotenbergURL string) ([]byte, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	part, err := writer.CreateFormFile("files", fileHeader.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create a form file: %w", err)
	}

	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("failed to copy file contents: %w", err)
	}

	writer.Close()

	request, err := http.NewRequest("POST", gotenbergURL, &requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	request.Header.Set("Content-Type", writer.FormDataContentType())
	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("conversion request failed: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("conversion failed with status: %s", response.Status)
	}

	pdfBytes, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read PDF response: %w", err)
	}

	return pdfBytes, nil
}
func (u *uploadServiceImpl) ListAllUploads(ctx context.Context) ([]dbsqlc.Upload, error) {
	return nil, nil
}

func (u *uploadServiceImpl) DeleteUpload(ctx context.Context, uploadID int32) error {
	return nil
}
