package schema

type SystemInfo struct {
	Version    string `json:"version"`
	Title      string `json:"title"`
	SHA        string `json:"sha"`
	BuildDate  string `json:"buildDate"`
	ProjectURL string `json:"projectUrl"`
	Developers string `json:"developedBy"`
}
