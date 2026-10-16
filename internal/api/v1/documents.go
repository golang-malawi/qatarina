package v1

import (
	"database/sql"
	"errors"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListProjectDocuments godoc
//
//	@Summary		Get all documents for a project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		int	true	"Project ID"
//	@Success		200			{object}	map[string]any
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/documents [get]
func ListProjectDocuments(docService services.DocumentService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}

		docs, err := docService.FindAllByProjectID(c.Context(), projectID)
		if err != nil {
			logger.Error(loggedmodule.ApiProjects, "failed to fetch documents for project", "projectID", projectID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"documents": docs,
		})
	}
}

// CreateProjectDocument godoc
//
//	@Summary		Upload/Create a document for a project
//	@Tags			projects
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			projectID	path		int		true	"Project ID"
//	@Param			name		formData	string	false	"Document Name"
//	@Param			file		formData	file	true	"Document File"
//	@Success		200			{object}	map[string]any
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/documents [post]
func CreateProjectDocument(docService services.DocumentService, logger logging.Logger, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}

		uploaderID := authutil.GetAuthUserID(c)
		if uploaderID == 0 {
			return problemdetail.NotAuthorizedProblem(c, "unauthorized")
		}

		name := c.FormValue("name")

		fileHeader, err := c.FormFile("file")
		if err != nil {
			return problemdetail.BadRequest(c, "file is required")
		}

		if name == "" {
			name = fileHeader.Filename
		}

		fileSize := fileHeader.Size
		mimeType := fileHeader.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		saveDir := filepath.Join(cfg.Storage.LocalPath, "documents")
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			return problemdetail.ServerErrorProblem(c, "failed to create storage directory")
		}

		savePath := filepath.Join(saveDir, fileHeader.Filename)
		normalizedRelative := filepath.ToSlash(filepath.Join("documents", fileHeader.Filename))

		if err := c.SaveFile(fileHeader, savePath); err != nil {
			logger.Error(loggedmodule.ApiProjects, "failed to save uploaded file", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to save file")
		}

		request := &schema.CreateProjectDocumentRequest{
			Name:     name,
			FilePath: normalizedRelative,
			FileSize: fileSize,
			MimeType: mimeType,
		}

		doc, err := docService.Create(c.Context(), projectID, int64(uploaderID), request)
		if err != nil {
			logger.Error(loggedmodule.ApiProjects, "failed to create project document", "projectID", projectID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"document": doc,
		})
	}
}

// DeleteProjectDocument godoc
//
//	@Summary		Delete a project document
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			documentID	path		string	true	"Document ID (UUID)"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		404			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router /v1/projects/{projectID}/documents/{documentID} [delete]
func DeleteProjectDocument(docService services.DocumentService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		documentID := c.Params("documentID")
		if documentID == "" {
			return problemdetail.BadRequest(c, "missing document ID")
		}

		err := docService.Delete(c.Context(), documentID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return problemdetail.BadRequest(c, "document not found")
			}
			logger.Error(loggedmodule.ApiProjects, "failed to delete project document", "documentID", documentID, "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(fiber.Map{
			"message":     "Document deleted successfully",
			"document_id": documentID,
		})
	}
}
