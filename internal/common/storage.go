package common

import (
	"fmt"
	"io"
	"path"
	"path/filepath"
	"strings"

	"github.com/spf13/afero"
)

// StoragePathPrefix is the URL prefix that stored files are served from.
const StoragePathPrefix = "/uploads/"

// StorageURL returns the URL path that a stored file is served from.
func StorageURL(storageKey string) string {
	return StoragePathPrefix + storageKey
}

// SafeFileName strips any directory components from a user-supplied file name.
func SafeFileName(fileName string) string {
	name := filepath.Base(strings.ReplaceAll(fileName, "\\", "/"))
	if name == "." || name == "/" || name == ".." {
		return "file"
	}
	return name
}

// WriteToStorage writes content to the given key in storage, creating any
// parent directories needed by the backend.
func WriteToStorage(storage afero.Fs, storageKey string, content io.Reader) error {
	if err := storage.MkdirAll(path.Dir(storageKey), 0o755); err != nil {
		return fmt.Errorf("failed to create storage directory: %w", err)
	}

	f, err := storage.Create(storageKey)
	if err != nil {
		return fmt.Errorf("failed to create file in storage: %w", err)
	}

	if _, err := io.Copy(f, content); err != nil {
		_ = f.Close()
		_ = storage.Remove(storageKey)
		return fmt.Errorf("failed to write file content: %w", err)
	}

	// Close flushes the file, which for S3 is when the upload happens
	if err := f.Close(); err != nil {
		_ = storage.Remove(storageKey)
		return fmt.Errorf("failed to save file to storage: %w", err)
	}
	return nil
}
