package common

import (
	"fmt"
	"mime"
	"path/filepath"
	"strings"
)

// AllowedFileTypes defines the MIME types permitted for file uploads.
// Centralized here for easy management and reuse across the application.
var AllowedFileTypes = []string{
	"text/plain",
	"text/markdown",
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
	"image/jpeg",
	"image/png",
	"image/svg+xml",
	"application/octet-stream", // For generic binary files
}

// ValidateAttachment checks content type and size againist allowed rules.
// Returns the resolved content type and an error if validation fails.
func ValidateAttachment(fileName string, contentType string, size int64, maxSize int64) (string, error) {
	if contentType == "" || contentType == "application/octet-stream" {
		if ext := strings.ToLower(filepath.Ext(fileName)); ext != "" {
			if guessed := mime.TypeByExtension(ext); guessed != "" {
				contentType = guessed
			}
		}
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if !isAllowed(contentType) {
		return "", fmt.Errorf("file type %s is not allowed", contentType)
	}

	if size > maxSize {
		return "", fmt.Errorf("file size %d exceeds the maximum allowed size of %d bytes", size, maxSize)
	}
	return contentType, nil
}

// isAllowed checks if a MIME type is in the AllowedFileTypes slice.
func isAllowed(mimeType string) bool {
	for _, allowed := range AllowedFileTypes {
		if mimeType == allowed {
			return true
		}
	}
	return false
}
