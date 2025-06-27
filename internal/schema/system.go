package schema

type SystemInfo struct {
	Version    string `json:"version"`
	Title      string `json:"title"`
	SHA        string `json:"sha"`
	BuildDate  string `json:"buildDate"`
	ProjectURL string `json:"projectUrl"`
	Developers string `json:"developedBy"`
}

type HealthStatus struct {
	Status  string `json:"status"`
	Uptime  int64  `json:"uptime"`
	Message string `json:"message,omitempty"`
}

type Metrics struct {
	RequestsTotal int64 `json:"requestsTotal"`
	ErrorsTotal   int64 `json:"errorsTotal"`
	UptimeSeconds int64 `json:"uptimeSeconds"`
}
