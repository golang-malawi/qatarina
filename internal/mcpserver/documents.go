package mcpserver

import (
	"context"

	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/mark3labs/mcp-go/mcp"
)

func projectListDocumentsTool() mcp.Tool {
	return mcp.NewTool("project_list_documents",
		mcp.WithDescription("List the documents uploaded to a project, such as specifications and user guides, "+
			"newest first. Each document has a file_url it can be downloaded from."),
		projectIDParam(),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

func projectSearchDocumentsTool() mcp.Tool {
	return mcp.NewTool("project_search_documents",
		mcp.WithDescription("Find a project's documents whose name, file name or file type contains the query, "+
			"ignoring case. Only these details are searched, not the documents' contents."),
		projectIDParam(),
		mcp.WithString("query", mcp.Required(), mcp.Description("Text to look for, for example \"login\" or \"pdf\".")),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
	)
}

type documentListResponse struct {
	Documents []schema.ProjectDocumentResponseItem `json:"documents"`
}

func (s *Server) projectListDocuments(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	documents, errResult := s.loadDocuments(ctx, projectID)
	if errResult != nil {
		return errResult, nil
	}
	return jsonResult(documentListResponse{Documents: documents})
}

func (s *Server) projectSearchDocuments(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	projectID, err := requireID(req, "project_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	query, err := req.RequireString("query")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	documents, errResult := s.loadDocuments(ctx, projectID)
	if errResult != nil {
		return errResult, nil
	}
	matches := []schema.ProjectDocumentResponseItem{}
	for _, doc := range documents {
		if matchesAny(query, doc.Name, doc.FileName, doc.MimeType) {
			matches = append(matches, doc)
		}
	}
	return jsonResult(documentListResponse{Documents: matches})
}

func (s *Server) loadDocuments(ctx context.Context, projectID int64) ([]schema.ProjectDocumentResponseItem, *mcp.CallToolResult) {
	if _, errResult := s.loadProject(ctx, projectID); errResult != nil {
		return nil, errResult
	}
	documents, err := s.documentService.FindAllByProjectID(ctx, projectID)
	if err != nil {
		return nil, mcp.NewToolResultError(err.Error())
	}
	return documents, nil
}
