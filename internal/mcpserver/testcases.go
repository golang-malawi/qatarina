package mcpserver

import (
	"context"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/validation"
	"github.com/mark3labs/mcp-go/mcp"
)

// maxTestCasesPerBatch matches the limit on schema.BulkCreateTestCases.
const maxTestCasesPerBatch = 100

var testKinds = []string{
	string(dbsqlc.TestKindGeneral),
	string(dbsqlc.TestKindAdhoc),
	string(dbsqlc.TestKindTriage),
	string(dbsqlc.TestKindIntegration),
	string(dbsqlc.TestKindUserAcceptance),
	string(dbsqlc.TestKindRegression),
	string(dbsqlc.TestKindSecurity),
	string(dbsqlc.TestKindUserInterface),
	string(dbsqlc.TestKindScenario),
}

var priorities = []string{"low", "medium", "high", "urgent"}

func addTestCasesTool() mcp.Tool {
	return mcp.NewTool("add_test_cases",
		mcp.WithDescription(
			"Add test cases to a project in one batch. When asked to add test cases for a feature, "+
				"design a set that covers it rather than a single case: the main success path, input "+
				"validation and error handling, edge and boundary values, permissions, and any related "+
				"flows, then submit them all in one call. Call list_project_test_cases first to avoid "+
				"duplicating existing cases. Codes are generated automatically when omitted; a case "+
				"whose code already exists in the project is skipped. The batch is all-or-nothing."),
		mcp.WithNumber("project_id", mcp.Required(), mcp.Description("ID of the project, as returned by list_projects.")),
		mcp.WithArray("test_cases",
			mcp.Required(),
			mcp.MinItems(1),
			mcp.MaxItems(maxTestCasesPerBatch),
			mcp.Description(fmt.Sprintf("The test cases to add, at most %d.", maxTestCasesPerBatch)),
			mcp.Items(map[string]any{
				"type": "object",
				"properties": map[string]any{
					"title":             map[string]any{"type": "string", "description": "Short summary of what is tested."},
					"description":       map[string]any{"type": "string", "description": "Steps to perform and the expected result. Markdown."},
					"feature_or_module": map[string]any{"type": "string", "description": "Feature or module under test."},
					"kind":              map[string]any{"type": "string", "enum": testKinds, "description": "Kind of test. Defaults to general."},
					"priority":          map[string]any{"type": "string", "enum": priorities, "description": "Defaults to medium."},
					"preconditions":     map[string]any{"type": "string", "description": "State required before running the test. Markdown."},
					"tags":              map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
					"code":              map[string]any{"type": "string", "description": "Leave empty to generate the next code for the project."},
					"is_draft":          map[string]any{"type": "boolean"},
				},
				"required": []string{"title", "description", "feature_or_module"},
			}),
		),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

// addTestCasesResponse reports how many cases were skipped because their code
// already exists, so the agent can tell a partial batch from a full one.
type addTestCasesResponse struct {
	Created   int                       `json:"created"`
	Skipped   int                       `json:"skipped"`
	TestCases []schema.TestCaseResponse `json:"test_cases"`
}

func (s *Server) addTestCases(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}

	var request schema.BulkCreateTestCases
	if err := req.BindArguments(&request); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid arguments: %v", err)), nil
	}
	if errs := validation.ValidateStruct(request); errs != nil {
		return mcp.NewToolResultError(errs.Error()), nil
	}
	if _, err := s.projectService.FindByID(ctx, request.ProjectID); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load project %d: %v", request.ProjectID, err)), nil
	}

	createdByID := strconv.FormatInt(identity.UserID, 10)
	for i := range request.TestCases {
		tc := &request.TestCases[i]
		tc.ProjectID = request.ProjectID
		tc.CreatedByID = createdByID
		if strings.TrimSpace(tc.Kind) == "" {
			tc.Kind = string(dbsqlc.TestKindGeneral)
		}
		if err := validateTestCase(tc); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("test_cases[%d] (%q): %v", i, tc.Title, err)), nil
		}
	}

	testCases, skipped, err := s.testCaseService.BulkCreate(ctx, &request)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return jsonResult(addTestCasesResponse{
		Created:   len(testCases),
		Skipped:   skipped,
		TestCases: schema.NewTestCaseResponseList(testCases),
	})
}

func validateTestCase(tc *schema.CreateTestCaseRequest) error {
	if errs := validation.ValidateStruct(tc); errs != nil {
		return errs
	}
	if !slices.Contains(testKinds, tc.Kind) {
		return fmt.Errorf("kind %q is not one of %s", tc.Kind, strings.Join(testKinds, ", "))
	}
	return validation.ValidateTags(tc.Tags)
}
