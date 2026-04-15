package storage

import (
	"context"
	"io"
)

type Storage interface {
	Upload(ctx context.Context, key string, content io.Reader, contentType string) error
	GetFileURL(key string) string
}
