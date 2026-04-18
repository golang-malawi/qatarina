package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type LocalClient struct {
	basePath string
}

func NewLocalClient(basePath string) *LocalClient {
	return &LocalClient{
		basePath: basePath,
	}
}

func (c *LocalClient) Upload(ctx context.Context, key string, content io.Reader, contentType string) error {
	fullPath := filepath.Join(c.basePath, key)
	os.MkdirAll(filepath.Dir(fullPath), 0755)

	f, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(f, content)
	return err
}

func (c *LocalClient) GetFileURL(key string) string {
	return fmt.Sprintf("/uploads/%s", key)
}
