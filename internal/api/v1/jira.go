package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
	"github.com/hopesain/jira-gopher/jira"
)

// GetAllJiraProjects godoc
//
// @ID GetAllJiraProjects
// @Summary List all Jira projects
// @Description Fetches all projects visible to the caller's Jira credentials
// @Tags jira
// @Accept json
// @Produce json
// @Param request body schema.GetAllJiraProjectsRequest true "Jira credentials"
// @Success 200 {object} jira.ProjectsResponse
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/jira/projects [post]
func GetAllJiraProjects(logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.GetAllJiraProjectsRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		jiraIntegration, err := services.NewJiraIntegration(jira.Credentials{
			Email:   request.Email,
			Token:   request.Token,
			BaseUrl: request.BaseUrl,
		})
		if err != nil {
			logger.Error("jira-integration", "failed to build jira client", "error", err)
			return problemdetail.BadRequest(c, "invalid jira credentials")
		}

		projects, err := jiraIntegration.GetAllProjects()
		if err != nil {
			logger.Error("jira-integration", "failed to fetch projects", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch jira projects")
		}
		return c.JSON(fiber.Map{
			"projects": projects,
		})
	}
}

// GetJiraProject godoc
//
// @ID GetJiraProject
// @Summary Get a single Jira project
// @Description Fetches a Jira project by ID or key, including its issue types
// @Tags jira
// @Accept json
// @Produce json
// @Param request body schema.GetJiraProjectRequest true "Jira credentials and project id or key"
// @Success 200 {object} jira.GetProjectResponse
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/jira/project [post]
func GetJiraProject(logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.GetJiraProjectRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		jiraIntegration, err := services.NewJiraIntegration(jira.Credentials{
			Email:   request.Email,
			Token:   request.Token,
			BaseUrl: request.BaseUrl,
		})
		if err != nil {
			logger.Error("jira-integration", "failed to build jira client", "error", err)
			return problemdetail.BadRequest(c, "invalid jira credentials")
		}

		project, err := jiraIntegration.GetProject(request.ProjectIDOrKey)
		if err != nil {
			logger.Error("jira-integration", "failed to fetch project", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to fetch jira project")
		}
		return c.JSON(fiber.Map{
			"project": project,
		})
	}
}

// CreateJiraIssue godoc
//
// @ID CreateJiraIssue
// @Summary Create a Jira issue
// @Description Creates an issue in a Jira project using the caller's own Jira credentials
// @Tags jira
// @Accept json
// @Produce json
// @Param request body schema.CreateJiraIssueRequest true "Jira credentials and issue details"
// @Success 200 {object} jira.CreateIssueResponse
// @Failure 400 {object} problemdetail.ProblemDetail "Invalid request"
// @Failure 500 {object} problemdetail.ProblemDetail "Server error"
// @Router /v1/jira/issues [post]
func CreateJiraIssue(logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		request := new(schema.CreateJiraIssueRequest)
		_, err := common.ParseBodyThenValidate(c, request)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to process request body")
		}

		jiraIntegration, err := services.NewJiraIntegration(jira.Credentials{
			Email:   request.Email,
			Token:   request.Token,
			BaseUrl: request.BaseUrl,
		})
		if err != nil {
			logger.Error("jira-integration", "failed to build jira client", "error", err)
			return problemdetail.BadRequest(c, "invalid jira credentials")
		}

		issue, err := jiraIntegration.CreateIssue(request.ProjectID, request.IssueTypeID, request.Summary)
		if err != nil {
			logger.Error("jira-integration", "failed to create issue", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to create jira issue")
		}
		return c.JSON(fiber.Map{
			"issue": issue,
		})
	}
}
