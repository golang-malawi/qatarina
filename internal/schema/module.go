package schema

type ModulesRequest struct {
	ProjectID int32  `json:"projectID"`
	Name      string `json:"name"`
	Code      string `json:"code"`
	Priority  int32  `json:"priority"`
}
