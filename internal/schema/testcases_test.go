package schema

import (
	"testing"

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
