package schema

// ExportTestCasesRequest exports either the given testcases, or the test cases
// picked by selection, which are loaded on the server
type ExportTestCasesRequest struct {
	FileName   string             `json:"filename"`
	FileFormat string             `json:"fileformat"`
	TestCases  []ExportedTestCase `json:"testcases,omitempty"`
	Selection  *TestCaseSelection `json:"selection,omitempty" validate:"omitempty"`
}

type ExportedTestCase struct {
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Kind            string   `json:"kind"`
	Code            string   `json:"code"`
	FeatureOrModule string   `json:"featureOrModule"`
	Tags            []string `json:"tags"`
	IsDraft         bool     `json:"isDraft"`
	Priority        string   `json:"priority"`
}
