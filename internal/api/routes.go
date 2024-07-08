package api

import apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"

func (api *API) routes() {
	router := api.app

	router.Get("/healthz", api.getSystemHealthz)
	router.Get("/metrics", api.getSystemMetrics)
	router.Get("/system/info", api.getSystemInfo)

	usersV1 := router.Group("/v1/users")
	{
		usersV1.Get("", apiv1.ListUsers(api.UsersRepo))
		usersV1.Post("", apiv1.CreateUser(api.UsersRepo))
		usersV1.Get("/query", apiv1.SearchUsers(api.UsersRepo))
		usersV1.Get("/{userID}", apiv1.GetOneUser(api.UsersRepo))
		usersV1.Post("/{userID}", apiv1.UpdateUser(api.UsersRepo))
		usersV1.Delete("/{userID}", apiv1.DeleteUser(api.UsersRepo))
	}

	projectsV1 := router.Group("/v1/projects")
	{
		projectsV1.Get("", apiv1.ListProjects(api.ProjectsRepo))
		projectsV1.Post("", apiv1.CreateProject(api.ProjectsRepo))
		projectsV1.Get("/query", apiv1.SearchProjects(api.ProjectsRepo))
		projectsV1.Get("/{projectID}", apiv1.GetOneProject(api.ProjectsRepo))
		projectsV1.Post("/{projectID}", apiv1.UpdateProject(api.ProjectsRepo))
		projectsV1.Delete("/{projectID}", apiv1.DeleteProject(api.ProjectsRepo))
	}
}
