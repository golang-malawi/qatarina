package schema

// LinkPreview holds the Open Graph metadata used to render a preview card for a URL
type LinkPreview struct {
	URL         string `json:"url"`
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Image       string `json:"image,omitempty"`
	SiteName    string `json:"site_name,omitempty"`
	Favicon     string `json:"favicon,omitempty"`
}
