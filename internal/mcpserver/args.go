package mcpserver

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/google/uuid"
	"github.com/mark3labs/mcp-go/mcp"
)

// maxPageSize caps how many items a paged tool returns at once.
const maxPageSize = 100

func projectIDParam() mcp.ToolOption {
	return mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects."))
}

func pageParams() []mcp.ToolOption {
	return []mcp.ToolOption{
		mcp.WithNumber("page", mcp.Description("Page number, starting at 1. Defaults to 1.")),
		mcp.WithNumber("page_size", mcp.Description(fmt.Sprintf("Items per page, at most %d. Defaults to 20.", maxPageSize))),
	}
}

// page reads the page and page_size arguments, clamped to sensible values.
func page(req mcp.CallToolRequest) (pageNum, pageSize int) {
	pageNum = max(req.GetInt("page", 1), 1)
	pageSize = min(max(req.GetInt("page_size", 20), 1), maxPageSize)
	return pageNum, pageSize
}

// requireID reads a required, positive integer ID argument.
func requireID(req mcp.CallToolRequest, key string) (int64, error) {
	id, err := req.RequireInt(key)
	if err != nil {
		return 0, err
	}
	if id <= 0 {
		return 0, fmt.Errorf("%s must be a positive number", key)
	}
	return int64(id), nil
}

// optionalID reads an optional, positive integer ID argument. Zero means not given.
func optionalID(req mcp.CallToolRequest, key string) (int64, error) {
	id := req.GetInt(key, 0)
	if id < 0 {
		return 0, fmt.Errorf("%s must be a positive number", key)
	}
	return int64(id), nil
}

// requireUUID reads a required UUID argument. The services parse IDs with
// uuid.MustParse, so they must be checked before they reach them.
func requireUUID(req mcp.CallToolRequest, key string) (string, error) {
	value, err := req.RequireString(key)
	if err != nil {
		return "", err
	}
	id, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return "", fmt.Errorf("%s %q is not a valid ID", key, value)
	}
	return id.String(), nil
}

// optionalUUID reads an optional UUID argument. Empty means not given.
func optionalUUID(req mcp.CallToolRequest, key string) (string, error) {
	value := strings.TrimSpace(req.GetString(key, ""))
	if value == "" {
		return "", nil
	}
	id, err := uuid.Parse(value)
	if err != nil {
		return "", fmt.Errorf("%s %q is not a valid ID", key, value)
	}
	return id.String(), nil
}

// optionalString returns the argument only when the caller sent it, so an
// update can tell "leave unchanged" from "set to empty".
func optionalString(req mcp.CallToolRequest, key string) *string {
	value, ok := req.GetArguments()[key].(string)
	if !ok {
		return nil
	}
	return &value
}

// optionalTime parses an optional date (2006-01-02) or date-time (RFC 3339) argument.
func optionalTime(req mcp.CallToolRequest, key string) (*time.Time, error) {
	value := optionalString(req, key)
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil, nil
	}
	t, err := parseTime(*value)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", key, err)
	}
	return &t, nil
}

func parseTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	for _, layout := range []string{time.RFC3339, time.DateTime, time.DateOnly} {
		if t, err := time.Parse(layout, value); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("%q is not a date (2006-01-02) or date-time (2006-01-02T15:04:05Z)", value)
}

// matchesAny reports whether any of the fields contains the query, ignoring case.
func matchesAny(query string, fields ...string) bool {
	query = strings.ToLower(strings.TrimSpace(query))
	for _, field := range fields {
		if strings.Contains(strings.ToLower(field), query) {
			return true
		}
	}
	return false
}

// loadProject checks the project exists, returning a tool error otherwise.
func (s *Server) loadProject(ctx context.Context, projectID int64) (*dbsqlc.Project, *mcp.CallToolResult) {
	project, err := s.projectService.FindByID(ctx, projectID)
	if err != nil {
		return nil, mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", projectID, err))
	}
	return project, nil
}
