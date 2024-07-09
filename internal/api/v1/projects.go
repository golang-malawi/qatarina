// Handlers for Projects endpoints
package v1

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/datastore"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListProject godoc
//
//	@ID				ListProject
//	@Summary		List Projects available on the platform
//	@Description	List Projects available on the platform
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects [get]
func ListProjects(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to list Projects")
	}
}

// SearchProjects godoc
//
//	@ID				SearchProjects
//	@Summary		Search for a Project
//	@Description	Search for a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	interface{}
//	@Failure		400	{object}	problemdetail.ProblemDetail
//	@Failure		500	{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/query [get]
func SearchProjects(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to search Projects")
	}
}

// GetOneProject godoc
//
//	@ID				GetOneProject
//	@Summary		Get a single Project
//	@Description	Get a single Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [get]
func GetOneProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to get one Project")
	}
}

// CreateProject godoc
//
//	@ID				CreateProject
//	@Summary		Create a Project
//	@Description	Create a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"Project Creation data"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects [post]
func CreateProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to create Project")
	}
}

// UpdateProject godoc
//
//	@ID				UpdateProject
//	@Summary		Update a Project
//	@Description	Update a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string		true	"Project ID"
//	@Param			request		body		interface{}	true	"Project Update data"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [post]
func UpdateProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to update Project")
	}
}

// ImportProject godoc
//
//	@ID				ImportProject
//	@Summary		Import Projects from some source
//	@Description	Import Projects from some source
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			request	body		interface{}	true	"Import Specification"
//	@Success		200		{object}	interface{}
//	@Failure		400		{object}	problemdetail.ProblemDetail
//	@Failure		500		{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/import [post]
func ImportProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to import Project")
	}
}

// DeleteProject godoc
//
//	@ID				DeleteProject
//	@Summary		Delete a Project
//	@Description	Delete a Project
//	@Tags			projects
//	@Accept			json
//	@Produce		json
//	@Param			projectID	path		string	true	"Project ID"
//	@Success		200			{object}	interface{}
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/api/v1/projects/{projectID} [delete]
func DeleteProject(datastore.ProjectRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return problemdetail.NotImplemented(c, "failed to delete Project")
	}
}
