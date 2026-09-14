package schema

// ExportTestCasesRequest is the request body for exporting test cases
// to a downloadable file (CSV or XLSX).
type ExportTestCasesRequest struct {
	FileName   string              `json:"filename"`
	FileFormat string              `json:"fileformat"`
	TestCases  []ExportedTestCase  `json:"testcases" validate:"required,min=1"`
}

// ExportedTestCase mirrors services.TestCase but carries JSON tags for
// decoding the user-supplied export request.
type ExportedTestCase struct {
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Kind            string   `json:"kind"`
	Code            string   `json:"code"`
	FeatureOrModule string   `json:"featureOrModule"`
	Tags            []string `json:"tags"`
	IsDraft         bool     `json:"isDraft"`
}