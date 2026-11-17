package services

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestParseLinkPreview(t *testing.T) {
	page := `<!doctype html><html><head>
		<title>Fallback title</title>
		<meta property="og:title" content="Fix flaky login test by someone · Pull Request #42 · acme/app">
		<meta property="og:description" content="Retries the &amp;quot;login&amp;quot; step when the session cookie is missing.">
		<link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://github.githubassets.com/favicons/favicon.svg">
		<link rel="apple-touch-icon" href="/apple.png">
		<meta property="og:image" content="/assets/card.png">
		<meta property="og:site_name" content="GitHub">
		</head><body><meta property="og:title" content="ignored"></body></html>`
	pageURL, _ := url.Parse("https://github.com/acme/app/pull/42")

	preview := parseLinkPreview(strings.NewReader(page), pageURL)

	if preview.Title != "Fix flaky login test by someone · Pull Request #42 · acme/app" {
		t.Errorf("unexpected title %q", preview.Title)
	}
	if preview.Description != `Retries the "login" step when the session cookie is missing.` {
		t.Errorf("unexpected description %q", preview.Description)
	}
	if preview.Image != "https://github.com/assets/card.png" {
		t.Errorf("relative image was not resolved, got %q", preview.Image)
	}
	if preview.SiteName != "GitHub" {
		t.Errorf("unexpected site name %q", preview.SiteName)
	}
	if preview.Favicon != "https://github.githubassets.com/favicons/favicon.svg" {
		t.Errorf("unexpected favicon %q", preview.Favicon)
	}
}

func TestParseLinkPreviewFallsBackToTitleAndHost(t *testing.T) {
	page := `<html><head><title> Plain page </title><meta name="description" content="Just a page"></head></html>`
	pageURL, _ := url.Parse("https://www.example.com/page")

	preview := parseLinkPreview(strings.NewReader(page), pageURL)

	if preview.Title != "Plain page" || preview.Description != "Just a page" || preview.SiteName != "example.com" {
		t.Errorf("unexpected preview %+v", preview)
	}
	if preview.Image != "" {
		t.Errorf("expected no image, got %q", preview.Image)
	}
	if preview.Favicon != "https://www.example.com/favicon.ico" {
		t.Errorf("expected favicon.ico fallback, got %q", preview.Favicon)
	}
}

func TestParseLinkPreviewRejectsNonHTTPImage(t *testing.T) {
	page := `<html><head><title>x</title><meta property="og:image" content="javascript:alert(1)"></head></html>`
	pageURL, _ := url.Parse("https://example.com")

	if preview := parseLinkPreview(strings.NewReader(page), pageURL); preview.Image != "" {
		t.Errorf("expected unsafe image to be dropped, got %q", preview.Image)
	}
}

func TestLinkPreviewFetchRejectsInvalidURLs(t *testing.T) {
	svc := NewLinkPreviewService()
	for _, raw := range []string{"", "not a url", "ftp://example.com/file", "javascript:alert(1)", "/relative/path"} {
		if _, err := svc.Fetch(context.Background(), raw); !errors.Is(err, ErrInvalidPreviewURL) {
			t.Errorf("%q: expected ErrInvalidPreviewURL, got %v", raw, err)
		}
	}
}

func TestLinkPreviewFetchBlocksPrivateAddresses(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprint(w, `<html><head><title>internal</title></head></html>`)
	}))
	defer server.Close()

	svc := NewLinkPreviewService()
	for _, raw := range []string{server.URL, strings.Replace(server.URL, "127.0.0.1", "localhost", 1)} {
		if _, err := svc.Fetch(context.Background(), raw); !errors.Is(err, ErrBlockedPreviewHost) {
			t.Errorf("%q: expected ErrBlockedPreviewHost, got %v", raw, err)
		}
	}
}

func TestIsPublicIP(t *testing.T) {
	cases := map[string]bool{
		"8.8.8.8":         true,
		"140.82.112.3":    true,
		"2606:4700::1111": true,
		"127.0.0.1":       false,
		"10.1.2.3":        false,
		"172.16.0.1":      false,
		"192.168.1.10":    false,
		"169.254.169.254": false,
		"100.64.0.1":      false,
		"0.0.0.0":         false,
		"::1":             false,
		"fe80::1":         false,
		"fd00::1":         false,
		"::ffff:10.0.0.1": false,
	}
	for raw, want := range cases {
		if got := isPublicIP(net.ParseIP(raw)); got != want {
			t.Errorf("isPublicIP(%s) = %v, want %v", raw, got, want)
		}
	}
}

func TestGitHubFallbackPreview(t *testing.T) {
	cases := map[string]string{
		"https://github.com/nndi-tech/hue-hr/pull/547":         "nndi-tech/hue-hr · Pull request #547",
		"https://github.com/nndi-tech/hue-hr/issues/12":        "nndi-tech/hue-hr · Issue #12",
		"https://github.com/nndi-tech/hue-hr/commit/abcdef123": "nndi-tech/hue-hr · Commit abcdef1",
		"https://www.github.com/nndi-tech/hue-hr":              "nndi-tech/hue-hr",
		"https://github.com/nndi-tech/hue-hr/tree/main":        "nndi-tech/hue-hr",
	}
	for raw, want := range cases {
		u, _ := url.Parse(raw)
		preview := githubFallbackPreview(u)
		if preview == nil || preview.Title != want || preview.SiteName != "GitHub" {
			t.Errorf("%s: got %+v, want title %q", raw, preview, want)
		}
	}
	for _, raw := range []string{"https://example.com/a/b", "https://github.com/", "https://github.com/settings"} {
		u, _ := url.Parse(raw)
		if preview := githubFallbackPreview(u); preview != nil {
			t.Errorf("%s: expected no fallback, got %+v", raw, preview)
		}
	}
}
