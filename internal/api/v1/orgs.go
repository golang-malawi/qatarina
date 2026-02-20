package v1

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// CreateOrg godoc
//
//	@ID				CreateOrg
//	@Summary		Create a new organization
//	@Description	Create a new organization
//	@Tags			organizations
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.CreateOrgRequest	true	"Organization data"
//	@Success		200			{object}	schema.Org
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/orgs [post]
func CreateOrg(orgService services.OrgService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req schema.CreateOrgRequest
		if validationErrors, err := common.ParseBodyThenValidate(c, &req); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		userID := authutil.GetAuthUserID(c)

		org, err := orgService.Create(context.Background(), req, userID)
		if err != nil {
			logger.Error(loggedmodule.ApiOrgs, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}

		return c.JSON(org)

	}
}

// ListOrgs godoc
//
//	@ID				ListOrgs
//	@Summary		List All organizations
//	@Description	List All organizations
//	@Tags			organizations
//	@Accept			json
//	@Produce		json
//	@Success		200			{object}	schema.OrgListResponse
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/orgs [get]
func ListOrgs(orgService services.OrgService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		orgs, err := orgService.ListAll(context.Background())
		if err != nil {
			logger.Error(loggedmodule.ApiOrgs, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(schema.OrgListResponse{
			Total: len(orgs),
			Orgs:  orgs,
		})
	}
}

// GetOrg godoc
//
//	@ID				GetOrg
//	@Summary		Get organization by ID
//	@Description	Get organization by ID
//	@Tags			organizations
//	@Accept			json
//	@Produce		json
//	@Param			id	path string	true	"Organization ID"
//	@Success		200			{object}	schema.Org
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/orgs/{orgID} [get]
func GetOrg(orgService services.OrgService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("orgID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}
		org, err := orgService.GetOne(context.Background(), int64(id))
		if err != nil {
			logger.Error(loggedmodule.ApiOrgs, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(org)
	}
}

// UpdateOrg godoc
//
//	@ID				UpdateOrg
//	@Summary		Update organization
//	@Description	Update organization
//	@Tags			organizations
//	@Accept			json
//	@Produce		json
//	@Param			request	body		schema.UpdateOrgRequest	true	"Organization data"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/orgs/{orgID} [put]
func UpdateOrg(orgService services.OrgService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("orgID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}

		var req schema.UpdateOrgRequest
		if validationErrors, err := common.ParseBodyThenValidate(c, &req); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(c, "invalid data in request", err)
			}
			return problemdetail.BadRequest(c, "failed to parse data in request")
		}

		req.ID = int32(id)
		err = orgService.Update(context.Background(), req)
		if err != nil {
			logger.Error(loggedmodule.ApiOrgs, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(fiber.Map{
			"message": "Organization updated successfully",
		})
	}
}

// DeleteOrg godoc
//
//	@ID				DeleteOrg
//	@Summary		Delete organization
//	@Description	Delete organization
//	@Tags			organizations
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string	true	"Organization ID"
//	@Success		200			{object}	map[string]string
//	@Failure		400			{object}	problemdetail.ProblemDetail
//	@Failure		500			{object}	problemdetail.ProblemDetail
//	@Router			/v1/orgs/{orgID} [delete]
func DeleteOrg(orgService services.OrgService, logger logging.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := c.ParamsInt("orgID", 0)
		if err != nil {
			return problemdetail.BadRequest(c, "failed to parse id data in request")
		}
		err = orgService.DeleteOrg(context.Background(), int64(id))
		if err != nil {
			logger.Error(loggedmodule.ApiOrgs, "failed to process request", "error", err)
			return problemdetail.ServerErrorProblem(c, "failed to process request")
		}
		return c.JSON(fiber.Map{
			"message": "Organization deleted successfully",
		})
	}

}
