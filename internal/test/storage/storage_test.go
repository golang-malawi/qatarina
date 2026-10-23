package test

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/storage"
	"github.com/spf13/afero"
)

func TestResolveDriver(t *testing.T) {
	tests := []struct {
		name string
		cfg  config.StorageConfiguration
		want string
	}{
		{"empty config uses local", config.StorageConfiguration{}, storage.DriverLocal},
		{"local driver", config.StorageConfiguration{Driver: "local", S3Bucket: "bucket"}, storage.DriverLocal},
		{"s3 without bucket falls back to local", config.StorageConfiguration{Driver: "s3"}, storage.DriverLocal},
		{"s3 with bucket", config.StorageConfiguration{Driver: "s3", S3Bucket: "bucket"}, storage.DriverS3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := storage.ResolveDriver(tt.cfg); got != tt.want {
				t.Errorf("ResolveDriver() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestNewRejectsUnknownDriver(t *testing.T) {
	if _, err := storage.New(context.Background(), config.StorageConfiguration{Driver: "ftp"}); err == nil {
		t.Fatal("expected error for unknown driver")
	}
}

func TestLocalStorageWritesUnderLocalPath(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "uploads")
	fs, err := storage.New(context.Background(), config.StorageConfiguration{Driver: "s3", LocalPath: dir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	key := "test-results/abc/report.txt"
	if err := common.WriteToStorage(fs, key, strings.NewReader("hello")); err != nil {
		t.Fatalf("WriteToStorage() error = %v", err)
	}

	got, err := os.ReadFile(filepath.Join(dir, "test-results", "abc", "report.txt"))
	if err != nil {
		t.Fatalf("file not written under local path: %v", err)
	}
	if string(got) != "hello" {
		t.Errorf("content = %q, want %q", got, "hello")
	}
}

func TestSafeFileName(t *testing.T) {
	for in, want := range map[string]string{
		"report.pdf":            "report.pdf",
		"../../etc/passwd":      "passwd",
		`..\..\windows\win.ini`: "win.ini",
		"..":                    "file",
	} {
		if got := common.SafeFileName(in); got != want {
			t.Errorf("SafeFileName(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestS3FsRoundTrip(t *testing.T) {
	fake := newFakeS3()
	server := httptest.NewServer(fake)
	defer server.Close()

	client := awss3.New(awss3.Options{
		Region:                     "us-east-1",
		BaseEndpoint:               aws.String(server.URL),
		UsePathStyle:               true,
		Credentials:                aws.AnonymousCredentials{},
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
	})
	fs := storage.NewS3Fs("bucket", client)

	key := "documents/1/abc-notes.txt"
	if err := common.WriteToStorage(fs, key, strings.NewReader("stored in s3")); err != nil {
		t.Fatalf("WriteToStorage() error = %v", err)
	}
	if got := fake.get("bucket/" + key); got != "stored in s3" {
		t.Fatalf("object content = %q, want %q", got, "stored in s3")
	}

	info, err := fs.Stat(key)
	if err != nil {
		t.Fatalf("Stat() error = %v", err)
	}
	if info.Size() != int64(len("stored in s3")) {
		t.Errorf("Stat().Size() = %d", info.Size())
	}

	f, err := fs.Open(key)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	content, _ := io.ReadAll(f)
	f.Close()
	if string(content) != "stored in s3" {
		t.Errorf("read content = %q", content)
	}

	if err := fs.Remove(key); err != nil {
		t.Fatalf("Remove() error = %v", err)
	}
	if _, err := fs.Open(key); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("Open() after Remove error = %v, want os.ErrNotExist", err)
	}
	if _, err := fs.Stat(key); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("Stat() after Remove error = %v, want os.ErrNotExist", err)
	}
}

var _ afero.Fs = (*storage.S3Fs)(nil)

// fakeS3 implements the handful of S3 operations S3Fs uses, keyed by "bucket/key".
type fakeS3 struct {
	mu      sync.Mutex
	objects map[string][]byte
}

func newFakeS3() *fakeS3 { return &fakeS3{objects: map[string][]byte{}} }

func (s *fakeS3) get(path string) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return string(s.objects[path])
}

func (s *fakeS3) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	path := strings.TrimPrefix(r.URL.Path, "/")

	switch r.Method {
	case http.MethodPut:
		body, _ := io.ReadAll(r.Body)
		s.objects[path] = body
		w.WriteHeader(http.StatusOK)
	case http.MethodGet, http.MethodHead:
		body, ok := s.objects[path]
		if !ok {
			w.Header().Set("Content-Type", "application/xml")
			w.WriteHeader(http.StatusNotFound)
			if r.Method == http.MethodGet {
				io.WriteString(w, `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>not found</Message></Error>`)
			}
			return
		}
		w.Header().Set("Content-Length", strconv.Itoa(len(body)))
		w.WriteHeader(http.StatusOK)
		if r.Method == http.MethodGet {
			w.Write(body)
		}
	case http.MethodDelete:
		delete(s.objects, path)
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
