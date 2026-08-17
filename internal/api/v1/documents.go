package v1

import (
	"database/sql"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
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
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		int								true	"Project ID"
//	@Param			request		body		schema.CreateProjectDocumentRequest	true	"Document Data"
//	@Success		200			{object}	map[string]any
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/projects/{projectID}/documents [post]
func CreateProjectDocument(docService services.DocumentService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		projectID, err := common.ParseIDFromCtx(c, "projectID")
		if err != nil {
			return problemdetail.BadRequest(c, "invalid parameter for projectID")
		}

		var request schema.CreateProjectDocumentRequest
		if _, err := common.ParseBodyThenValidate(c, &request); err != nil {
			return problemdetail.ValidationErrors(c, "invalid data in the request", err)
		}

		doc, err := docService.Create(c.Context(), projectID, &request)
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
//	@Router			/v1/documents/{documentID} [delete]
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
