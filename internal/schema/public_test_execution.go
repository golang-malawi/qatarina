package schema

import "github.com/golang-malawi/qatarina/internal/database/dbsqlc"

type PublicTestCaseResponse struct {
	TestCaseID string   `json:"test_case_id"`
	Title      string   `json:"title"`
	Steps      []string `json:"steps"`
}

func NewPublicTestCaseResponse(tc *dbsqlc.TestCase) PublicTestCaseResponse {
	return PublicTestCaseResponse{
		TestCaseID: tc.ID.String(),
		Title:      tc.Title,
	}
}

type PublicTestResultRequest struct {
	TestCaseID string `json:"test_case_id" validate:"required"`
	Result     string `json:"result" validate:"required,oneof=Pass Fail Blocked"`
	Comment    string `json:"comment,omitempty"`
}
