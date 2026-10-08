package schema

import "time"

// Relation kinds allowed by the test_case_relations_kind_check constraint
const (
	RelationKindDependsOn    = "depends_on"
	RelationKindRelatedTo    = "related_to"
	RelationKindDuplicates   = "duplicates"
	RelationKindBranchedFrom = "branched_from"
	RelationKindBlocks       = "blocks"
)

// RelationDirection says which side of a relation the requested test case is on
const (
	// RelationDirectionOutgoing: <this test case> <relation_kind> <other test case>
	RelationDirectionOutgoing = "outgoing"
	// RelationDirectionIncoming: <other test case> <relation_kind> <this test case>
	RelationDirectionIncoming = "incoming"
)

type CreateTestCaseRelationRequest struct {
	RelatedTestCaseID string `json:"related_test_case_id" validate:"required,uuid"`
	RelationKind      string `json:"relation_kind" validate:"required,oneof=depends_on related_to duplicates branched_from blocks" enums:"depends_on,related_to,duplicates,branched_from,blocks"`
}

type RelatedTestCaseSummary struct {
	ID        string `json:"id"`
	Code      string `json:"code"`
	Title     string `json:"title"`
	ProjectID int64  `json:"project_id"`
}

type TestCaseRelationResponse struct {
	ID string `json:"id"`
	// Stored as: test_case_id <relation_kind> related_test_case_id
	TestCaseID        string `json:"test_case_id"`
	RelatedTestCaseID string `json:"related_test_case_id"`
	RelationKind      string `json:"relation_kind" enums:"depends_on,related_to,duplicates,branched_from,blocks"`
	// Direction relative to the test case in the request path
	Direction     string                 `json:"direction" enums:"outgoing,incoming"`
	OtherTestCase RelatedTestCaseSummary `json:"other_test_case"`
	CreatedByID   int32                  `json:"created_by_id"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
}

type TestCaseRelationListResponse struct {
	Relations []TestCaseRelationResponse `json:"relations"`
}
