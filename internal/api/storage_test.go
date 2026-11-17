package api

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/afero"
)

func TestServeStoredFile(t *testing.T) {
	fs := afero.NewMemMapFs()
	if err := afero.WriteFile(fs, "test-results/r1/abc-notes.txt", []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}

	api := &API{Storage: fs}
	app := fiber.New()
	app.Get("/uploads/*", api.serveStoredFile)

	tests := []struct {
		name            string
		url             string
		wantStatus      int
		wantDisposition string
	}{
		{"view inline", "/uploads/test-results/r1/abc-notes.txt", 200, ""},
		{"download with original name", "/uploads/test-results/r1/abc-notes.txt?download=notes.txt", 200, `attachment; filename="notes.txt"`},
		{"download name cannot contain a path", "/uploads/test-results/r1/abc-notes.txt?download=..%2F..%2Fevil.txt", 200, `attachment; filename="evil.txt"`},
		{"missing file", "/uploads/test-results/r1/missing.txt", 404, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := app.Test(httptest.NewRequest("GET", tt.url, nil))
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != tt.wantStatus {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tt.wantStatus)
			}
			if got := resp.Header.Get("Content-Disposition"); got != tt.wantDisposition {
				t.Errorf("Content-Disposition = %q, want %q", got, tt.wantDisposition)
			}
			if tt.wantStatus == 200 {
				body, _ := io.ReadAll(resp.Body)
				if string(body) != "hello" {
					t.Errorf("body = %q, want %q", body, "hello")
				}
			}
		})
	}
}
