package common

// AllowedFileTypes defines the MIME types permitted for file uploads.
// Centralized here for easy management and reuse across the application.
var AllowedFileTypes = map[string]bool{
	"text/plain":      true,
	"text/markdown":   true,
	"application/pdf": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // .docx
	"image/jpeg":               true,
	"image/png":                true,
	"image/svg+xml":            true,
	"application/octet-stream": true, // For generic binary files
}
