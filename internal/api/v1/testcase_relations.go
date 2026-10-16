package v1

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-malawi/qatarina/internal/api/authutil"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/pkg/problemdetail"
)

// ListTestCaseRelations godoc
//
//	@ID             ListTestCaseRelations
//	@Summary        List relations of a Test Case
//	@Description    List relations where the Test Case is on either side. direction is "outgoing" when the Test Case is the subject (e.g. it depends_on other_test_case) and "incoming" otherwise
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string  true    "Test Case ID"
//	@Success        200         {object}    schema.TestCaseRelationListResponse
//	@Failure        404         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/test-cases/{testCaseID}/relations [get]
func ListTestCaseRelations(relationService services.TestCaseRelationService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		testCaseID := ctx.Params("testCaseID")

		relations, err := relationService.FindAllByTestCase(ctx.Context(), testCaseID)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(ctx, "test case not found")
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to list test case relations", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to list test case relations")
		}

		return ctx.JSON(schema.TestCaseRelationListResponse{Relations: relations})
	}
}

// CreateTestCaseRelation godoc
//
//	@ID             CreateTestCaseRelation
//	@Summary        Relate a Test Case to another Test Case
//	@Description    Create a relation read as "<testCaseID> <relation_kind> <related_test_case_id>". Only one relation of each kind is allowed per pair of Test Cases, in either direction
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string                                  true    "Test Case ID"
//	@Param          request     body        schema.CreateTestCaseRelationRequest    true    "Relation data"
//	@Success        201         {object}    schema.TestCaseRelationResponse
//	@Failure        400         {object}    problemdetail.ProblemDetail
//	@Failure        404         {object}    problemdetail.ProblemDetail
//	@Failure        409         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/test-cases/{testCaseID}/relations [post]
func CreateTestCaseRelation(relationService services.TestCaseRelationService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		testCaseID := ctx.Params("testCaseID")

		request := new(schema.CreateTestCaseRelationRequest)
		if validationErrors, err := common.ParseBodyThenValidate(ctx, request); err != nil {
			if validationErrors {
				return problemdetail.ValidationErrors(ctx, "invalid data in request", err)
			}
			return problemdetail.BadRequest(ctx, "failed to parse data in request")
		}

		userID := authutil.GetAuthUserID(ctx)
		relation, err := relationService.Create(ctx.Context(), testCaseID, userID, request)
		if err != nil {
			switch {
			case errors.Is(err, services.ErrNotFound):
				return problemdetail.NotFound(ctx, "test case not found")
			case errors.Is(err, services.ErrRelationToSelf), errors.Is(err, services.ErrInvalidRelation):
				return problemdetail.BadRequest(ctx, err.Error())
			case errors.Is(err, services.ErrRelationExists):
				return problemdetail.Conflict(ctx, err.Error())
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to create test case relation", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to create test case relation")
		}

		return ctx.Status(fiber.StatusCreated).JSON(relation)
	}
}

// DeleteTestCaseRelation godoc
//
//	@ID             DeleteTestCaseRelation
//	@Summary        Remove a relation from a Test Case
//	@Description    Remove a relation the Test Case is on either side of
//	@Tags           test-cases
//	@Accept         json
//	@Produce        json
//	@Param          testCaseID  path        string  true    "Test Case ID"
//	@Param          relationID  path        string  true    "Relation ID"
//	@Success        204
//	@Failure        404         {object}    problemdetail.ProblemDetail
//	@Failure        500         {object}    problemdetail.ProblemDetail
//	@Router         /v1/test-cases/{testCaseID}/relations/{relationID} [delete]
func DeleteTestCaseRelation(relationService services.TestCaseRelationService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		testCaseID := ctx.Params("testCaseID")
		relationID := ctx.Params("relationID")

		if err := relationService.Delete(ctx.Context(), testCaseID, relationID); err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(ctx, "relation not found")
			}
			logger.Error(loggedmodule.ApiTestCases, "failed to delete test case relation", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "failed to delete test case relation")
		}

		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
