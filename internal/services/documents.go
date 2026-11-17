package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/google/uuid"
	"github.com/spf13/afero"
)

var ErrInvalidDocument = errors.New("invalid document")

type DocumentService interface {
	FindAllByProjectID(ctx context.Context, projectID int64) ([]schema.ProjectDocumentResponseItem, error)
	Create(ctx context.Context, projectID int64, uploaderID int64, req *schema.CreateProjectDocumentRequest) (*schema.ProjectDocumentResponseItem, error)
	Delete(ctx context.Context, projectID int64, documentID string) error
}

type documentService struct {
	queries     *dbsqlc.Queries
	logger      logging.Logger
	storage     afero.Fs
	maxFileSize int64
}

func NewDocumentService(conn *dbsqlc.Queries, logger logging.Logger, storage afero.Fs, maxFileSize int64) DocumentService {
	return &documentService{
		queries:     conn,
		logger:      logger,
		storage:     storage,
		maxFileSize: maxFileSize,
	}
}

func (s *documentService) FindAllByProjectID(ctx context.Context, projectID int64) ([]schema.ProjectDocumentResponseItem, error) {
	rows, err := s.queries.ListDocumentsByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	documents := make([]schema.ProjectDocumentResponseItem, 0, len(rows))
	for _, doc := range rows {
		documents = append(documents, newDocumentResponse(doc))
	}
	return documents, nil
}

func (s *documentService) Create(ctx context.Context, projectID int64, uploaderID int64, req *schema.CreateProjectDocumentRequest) (*schema.ProjectDocumentResponseItem, error) {
	if req.FileSize > s.maxFileSize {
		return nil, fmt.Errorf("%w: file size %d exceeds the maximum allowed size of %d bytes", ErrInvalidDocument, req.FileSize, s.maxFileSize)
	}

	docID := uuid.New()
	storageKey := fmt.Sprintf("documents/%d/%s-%s", projectID, docID, common.SafeFileName(req.FileName))

	if err := common.WriteToStorage(s.storage, storageKey, req.Content); err != nil {
		return nil, err
	}

	row, err := s.queries.CreateProjectDocument(ctx, dbsqlc.CreateProjectDocumentParams{
		ID:         docID,
		ProjectID:  projectID,
		UploaderID: uploaderID,
		Name:       req.Name,
		FilePath:   storageKey,
		FileSize:   sql.NullInt64{Int64: req.FileSize, Valid: req.FileSize > 0},
		MimeType:   sql.NullString{String: req.MimeType, Valid: req.MimeType != ""},
	})
	if err != nil {
		_ = s.storage.Remove(storageKey)
		return nil, err
	}

	doc := newDocumentResponse(row)
	return &doc, nil
}

func (s *documentService) Delete(ctx context.Context, projectID int64, documentID string) error {
	id, err := uuid.Parse(documentID)
	if err != nil {
		return fmt.Errorf("invalid document ID format: %w", err)
	}

	doc, err := s.queries.GetProjectDocument(ctx, id)
	if err != nil {
		return err
	}
	if doc.ProjectID != projectID {
		return sql.ErrNoRows
	}

	rowsAffected, err := s.queries.DeleteProjectDocument(ctx, id)
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	if err := s.storage.Remove(doc.FilePath); err != nil {
		s.logger.Error(loggedmodule.ApiProjects, "failed to remove document file from storage", "documentID", documentID, "path", doc.FilePath, "error", err)
	}

	return nil
}

func newDocumentResponse(doc dbsqlc.ProjectDocument) schema.ProjectDocumentResponseItem {
	return schema.ProjectDocumentResponseItem{
		ID:        doc.ID.String(),
		ProjectID: doc.ProjectID,
		Name:      doc.Name,
		FilePath:  doc.FilePath,
		FileName:  documentFileName(doc.FilePath, doc.ID),
		FileURL:   common.StorageURL(doc.FilePath),
		FileSize:  doc.FileSize.Int64,
		MimeType:  doc.MimeType.String,
		CreatedAt: doc.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt: doc.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// documentFileName recovers the uploaded file name from the storage key,
// dropping the "<document id>-" prefix added to keep keys unique.
func documentFileName(filePath string, docID uuid.UUID) string {
	name := path.Base(filePath)
	return strings.TrimPrefix(name, docID.String()+"-")
}
