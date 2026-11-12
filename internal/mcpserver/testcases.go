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

func addTestCaseTool() mcp.Tool {
	return mcp.NewTool("add_test_case",
		mcp.WithDescription("Add a single test case to a project. To add several, or a set covering a feature, "+
			"use add_test_cases instead. Call search_test_cases first to avoid duplicating an existing case. "+
			"The code is generated automatically when omitted."),
		projectIDParam(),
		mcp.WithString("title", mcp.Required(), mcp.Description("Short summary of what is tested.")),
		mcp.WithString("description", mcp.Required(), mcp.Description("Steps to perform and the expected result. Markdown.")),
		mcp.WithString("feature_or_module", mcp.Required(), mcp.Description("Feature or module under test, for example a module name from list_modules.")),
		mcp.WithString("kind", mcp.Enum(testKinds...), mcp.Description("Kind of test. Defaults to general.")),
		mcp.WithString("priority", mcp.Enum(priorities...), mcp.Description("Defaults to medium.")),
		mcp.WithString("preconditions", mcp.Description("State required before running the test. Markdown.")),
		mcp.WithArray("tags", mcp.WithStringItems()),
		mcp.WithString("code", mcp.Description("Leave empty to generate the next code for the project.")),
		mcp.WithBoolean("is_draft", mcp.Description("Drafts are not yet ready to be tested.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(false),
	)
}

func updateTestCaseTool() mcp.Tool {
	return mcp.NewTool("update_test_case",
		mcp.WithDescription("Change a test case. Only the fields given are changed; the rest keep their "+
			"current values. Tags given replace the existing tags. The code cannot be changed."),
		mcp.WithString("test_case_id", mcp.Required(), mcp.Description("ID of the test case, as returned by list_project_test_cases or search_test_cases.")),
		mcp.WithString("title", mcp.Description("Short summary of what is tested.")),
		mcp.WithString("description", mcp.Description("Steps to perform and the expected result. Markdown.")),
		mcp.WithString("feature_or_module", mcp.Description("Feature or module under test.")),
		mcp.WithString("kind", mcp.Enum(testKinds...), mcp.Description("Kind of test.")),
		mcp.WithString("priority", mcp.Enum(priorities...)),
		mcp.WithString("preconditions", mcp.Description("State required before running the test. Markdown. An empty string removes them.")),
		mcp.WithArray("tags", mcp.WithStringItems(), mcp.Description("Replaces the test case's tags. An empty list removes them.")),
		mcp.WithBoolean("is_draft", mcp.Description("Drafts are not yet ready to be tested.")),
		mcp.WithReadOnlyHintAnnotation(false),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithIdempotentHintAnnotation(true),
	)
}

func (s *Server) addTestCase(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	identity, ok := identityFrom(ctx)
	if !ok {
		return mcp.NewToolResultError("not authenticated"), nil
	}

	var request schema.CreateTestCaseRequest
	if err := req.BindArguments(&request); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid arguments: %v", err)), nil
	}
	if request.ProjectID <= 0 {
		return mcp.NewToolResultError("project_id must be a positive number"), nil
	}
	if _, errResult := s.loadProject(ctx, request.ProjectID); errResult != nil {
		return errResult, nil
	}

	request.CreatedByID = strconv.FormatInt(identity.UserID, 10)
	if strings.TrimSpace(request.Kind) == "" {
		request.Kind = string(dbsqlc.TestKindGeneral)
	}
	if err := validateTestCase(&request); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	testCase, err := s.testCaseService.Create(ctx, &request)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to add test case: %v", err)), nil
	}
	return jsonResult(schema.NewTestCaseResponseFromRow(testCase))
}

func (s *Server) updateTestCase(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	testCaseID, err := requireUUID(req, "test_case_id")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	existing, err := s.testCaseService.FindByID(ctx, testCaseID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to load test case %s: %v", testCaseID, err)), nil
	}

	// Start from the current values so fields that are not given stay as they are
	request := schema.UpdateTestCaseRequest{
		ID:              testCaseID,
		ProjectID:       int64(existing.ProjectID.Int32),
		Kind:            string(existing.Kind),
		Code:            existing.Code,
		FeatureOrModule: existing.FeatureOrModule.String,
		Title:           existing.Title,
		Description:     existing.Description,
		Preconditions:   existing.Preconditions.String,
		ExternalID:      existing.ExternalID.String,
		IsDraft:         existing.IsDraft.Bool,
		Tags:            existing.Tags,
		Runner:          existing.Runner.String,
		ScriptPath:      existing.ScriptPath.String,
		Priority:        string(existing.Priority),
	}
	if v := optionalString(req, "title"); v != nil {
		request.Title = strings.TrimSpace(*v)
	}
	if v := optionalString(req, "description"); v != nil {
		request.Description = *v
	}
	if v := optionalString(req, "feature_or_module"); v != nil {
		request.FeatureOrModule = strings.TrimSpace(*v)
	}
	if v := optionalString(req, "kind"); v != nil {
		request.Kind = strings.TrimSpace(*v)
	}
	if v := optionalString(req, "priority"); v != nil {
		request.Priority = strings.TrimSpace(*v)
	}
	if v := optionalString(req, "preconditions"); v != nil {
		request.Preconditions = *v
	}
	if _, ok := req.GetArguments()["tags"]; ok {
		request.Tags = req.GetStringSlice("tags", []string{})
	}
	if _, ok := req.GetArguments()["is_draft"]; ok {
		request.IsDraft = req.GetBool("is_draft", request.IsDraft)
	}

	if errs := validation.ValidateStruct(request); errs != nil {
		return mcp.NewToolResultError(errs.Error()), nil
	}
	if !slices.Contains(testKinds, request.Kind) {
		return mcp.NewToolResultError(fmt.Sprintf("kind %q is not one of %s", request.Kind, strings.Join(testKinds, ", "))), nil
	}
	if err := validation.ValidateTags(request.Tags); err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}

	updated, err := s.testCaseService.Update(ctx, &request)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to update test case: %v", err)), nil
	}
	return jsonResult(schema.NewTestCaseResponseFromRow(updated))
}
