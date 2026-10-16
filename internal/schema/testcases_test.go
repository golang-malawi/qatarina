package schema

import (
	"testing"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/validation"
	"github.com/stretchr/testify/assert"
)

func TestValidateBulkTestCases(t *testing.T) {
	one := CreateTestCaseRequest{}
	bulkRequest := BulkCreateTestCases{
		ProjectID: 1,
		TestCases: make([]CreateTestCaseRequest, 0),
	}
	for i := 0; i < 101; i++ {
		bulkRequest.TestCases = append(bulkRequest.TestCases, one)
	}
	err := validation.ValidateStruct(bulkRequest)
	assert.NotNil(t, err)
	assert.ErrorContains(t, err, "max")
}

func TestParsePriorityLevel(t *testing.T) {
	assert.Equal(t, dbsqlc.PriorityLevelLow, ParsePriorityLevel("low"))
	assert.Equal(t, dbsqlc.PriorityLevelHigh, ParsePriorityLevel(" HIGH "))
	assert.Equal(t, dbsqlc.PriorityLevelUrgent, ParsePriorityLevel("urgent"))
	assert.Equal(t, dbsqlc.PriorityLevelMedium, ParsePriorityLevel("medium"))
	assert.Equal(t, dbsqlc.PriorityLevelMedium, ParsePriorityLevel(""))
	assert.Equal(t, dbsqlc.PriorityLevelMedium, ParsePriorityLevel("critical"))
}

func TestValidatePriorityAndUrgency(t *testing.T) {
	err := validation.ValidateStruct(UpdateTestPlanCaseUrgencyRequest{Urgency: "critical"})
	assert.ErrorContains(t, err, "oneof")

	err = validation.ValidateStruct(UpdateTestPlanCaseUrgencyRequest{Urgency: "urgent"})
	assert.Nil(t, err)

	err = validation.ValidateStruct(AssignTestsToPlanRequest{
		ProjectID:    1,
		PlanID:       1,
		PlannedTests: []TestCaseAssignment{{TestCaseID: "x", UserIDs: []int64{1}, Urgency: "critical"}},
	})
	assert.ErrorContains(t, err, "oneof")
}
