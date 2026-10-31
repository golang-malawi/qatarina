package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/golang-malawi/qatarina/internal/schema"
	"golang.org/x/net/html"
	"golang.org/x/net/html/charset"
)

const (
	linkPreviewTimeout      = 6 * time.Second
	linkPreviewMaxBodyBytes = 1 << 20
	linkPreviewMaxRedirects = 5
	linkPreviewCacheTTL     = time.Hour
	linkPreviewFailureTTL   = 10 * time.Minute
	linkPreviewMaxCached    = 500
	linkPreviewUserAgent    = "Mozilla/5.0 (compatible; QatarinaBot/1.0; link preview)"
)

var (
	ErrInvalidPreviewURL  = errors.New("url must be an absolute http or https url")
	ErrBlockedPreviewHost = errors.New("url resolves to a non-public address")
	ErrNoPreview          = errors.New("no preview available for url")
)

// LinkPreviewService fetches Open Graph metadata for URLs so they can be rendered as preview cards
type LinkPreviewService interface {
	Fetch(ctx context.Context, rawURL string) (*schema.LinkPreview, error)
}

type cachedLinkPreview struct {
	preview   *schema.LinkPreview
	err       error
	expiresAt time.Time
}

type linkPreviewService struct {
	client *http.Client

	mu    sync.Mutex
	cache map[string]cachedLinkPreview
}

var _ LinkPreviewService = &linkPreviewService{}

func NewLinkPreviewService() LinkPreviewService {
	dialer := &net.Dialer{
		Timeout: linkPreviewTimeout,
		// Checked against the resolved address of every connection, including redirects,
		// so the server cannot be used to reach internal services
		Control: func(_, address string, _ syscall.RawConn) error {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				return err
			}
			ip := net.ParseIP(host)
			if ip == nil || !isPublicIP(ip) {
				return ErrBlockedPreviewHost
			}
			return nil
		},
	}

	return &linkPreviewService{
		client: &http.Client{
			Timeout: linkPreviewTimeout,
			Transport: &http.Transport{
				Proxy:                 nil,
				DialContext:           dialer.DialContext,
				TLSHandshakeTimeout:   linkPreviewTimeout,
				ResponseHeaderTimeout: linkPreviewTimeout,
				MaxIdleConns:          10,
				IdleConnTimeout:       30 * time.Second,
			},
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= linkPreviewMaxRedirects {
					return errors.New("too many redirects")
				}
				if req.URL.Scheme != "http" && req.URL.Scheme != "https" {
					return ErrInvalidPreviewURL
				}
				return nil
			},
		},
		cache: make(map[string]cachedLinkPreview),
	}
}

func (s *linkPreviewService) Fetch(ctx context.Context, rawURL string) (*schema.LinkPreview, error) {
	target, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil || (target.Scheme != "http" && target.Scheme != "https") || target.Host == "" {
		return nil, ErrInvalidPreviewURL
	}
	target.Fragment = ""
	key := target.String()

	if cached, ok := s.getCached(key); ok {
		return cached.preview, cached.err
	}

	preview, err := s.fetch(ctx, target)
	if err != nil && !errors.Is(err, ErrBlockedPreviewHost) && ctx.Err() == nil {
		// Private GitHub repositories return 404 to anonymous requests, so describe the link from its path instead
		if fallback := githubFallbackPreview(target); fallback != nil {
			preview, err = fallback, nil
		} else {
			err = fmt.Errorf("%w: %v", ErrNoPreview, err)
		}
	}
	s.setCached(key, preview, err)
	return preview, err
}

func (s *linkPreviewService) fetch(ctx context.Context, target *url.URL) (*schema.LinkPreview, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", linkPreviewUserAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		if errors.Is(err, ErrBlockedPreviewHost) {
			return nil, ErrBlockedPreviewHost
		}
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d", resp.StatusCode)
	}
	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/html") && !strings.Contains(contentType, "application/xhtml") {
		return nil, fmt.Errorf("unsupported content type %q", contentType)
	}

	body, err := charset.NewReader(io.LimitReader(resp.Body, linkPreviewMaxBodyBytes), contentType)
	if err != nil {
		return nil, err
	}

	preview := parseLinkPreview(body, resp.Request.URL)
	preview.URL = target.String()
	if preview.Title == "" && preview.Description == "" {
		return nil, errors.New("page has no title or description")
	}
	return preview, nil
}

// parseLinkPreview reads Open Graph, Twitter card and standard meta tags from the document head
func parseLinkPreview(r io.Reader, pageURL *url.URL) *schema.LinkPreview {
	meta := make(map[string]string)
	icons := make(map[string]string)
	var title string
	inTitle := false

	tokenizer := html.NewTokenizer(r)
parse:
	for {
		switch tokenizer.Next() {
		case html.ErrorToken:
			break parse
		case html.StartTagToken, html.SelfClosingTagToken:
			name, hasAttr := tokenizer.TagName()
			switch string(name) {
			case "body":
				break parse
			case "title":
				inTitle = true
			case "meta":
				var key, content string
				for hasAttr {
					var k, v []byte
					k, v, hasAttr = tokenizer.TagAttr()
					switch strings.ToLower(string(k)) {
					case "property", "name":
						key = strings.ToLower(strings.TrimSpace(string(v)))
					case "content":
						content = strings.TrimSpace(string(v))
					}
				}
				if key != "" && content != "" {
					if _, exists := meta[key]; !exists {
						meta[key] = content
					}
				}
			case "link":
				var rel, href string
				for hasAttr {
					var k, v []byte
					k, v, hasAttr = tokenizer.TagAttr()
					switch strings.ToLower(string(k)) {
					case "rel":
						rel = strings.ToLower(strings.Join(strings.Fields(string(v)), " "))
					case "href":
						href = strings.TrimSpace(string(v))
					}
				}
				if rel != "" && href != "" {
					if _, exists := icons[rel]; !exists {
						icons[rel] = href
					}
				}
			}
		case html.TextToken:
			if inTitle && title == "" {
				title = strings.TrimSpace(string(tokenizer.Text()))
			}
		case html.EndTagToken:
			name, _ := tokenizer.TagName()
			switch string(name) {
			case "title":
				inTitle = false
			case "head":
				break parse
			}
		}
	}

	first := func(keys ...string) string {
		for _, k := range keys {
			if v := meta[k]; v != "" {
				return v
			}
		}
		return ""
	}

	// Some sites (GitHub included) escape entities twice, so decode once more to avoid showing "&quot;"
	clean := func(v string, max int) string {
		return truncateRunes(strings.TrimSpace(html.UnescapeString(v)), max)
	}

	preview := &schema.LinkPreview{
		Title:       clean(first("og:title", "twitter:title"), 300),
		Description: clean(first("og:description", "twitter:description", "description"), 500),
		SiteName:    clean(first("og:site_name", "application-name"), 100),
	}
	if preview.Title == "" {
		preview.Title = clean(title, 300)
	}
	if preview.SiteName == "" && pageURL != nil {
		preview.SiteName = strings.TrimPrefix(pageURL.Hostname(), "www.")
	}
	if image := first("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"); image != "" && pageURL != nil {
		if imageURL, err := pageURL.Parse(image); err == nil && (imageURL.Scheme == "http" || imageURL.Scheme == "https") {
			preview.Image = imageURL.String()
		}
	}
	if pageURL != nil {
		preview.Favicon = resolveFavicon(icons, pageURL)
	}
	return preview
}

// resolveFavicon picks the page's declared icon, falling back to /favicon.ico on the same host
func resolveFavicon(icons map[string]string, pageURL *url.URL) string {
	for _, rel := range []string{"icon", "shortcut icon", "apple-touch-icon", "apple-touch-icon-precomposed"} {
		href, ok := icons[rel]
		if !ok {
			continue
		}
		if iconURL, err := pageURL.Parse(href); err == nil && (iconURL.Scheme == "http" || iconURL.Scheme == "https") {
			return iconURL.String()
		}
	}
	return (&url.URL{Scheme: pageURL.Scheme, Host: pageURL.Host, Path: "/favicon.ico"}).String()
}

var githubLinkKinds = map[string]string{
	"pull":        "Pull request",
	"issues":      "Issue",
	"discussions": "Discussion",
	"commit":      "Commit",
	"releases":    "Release",
}

// githubFallbackPreview builds a preview for a GitHub link that could not be fetched, e.g. in a private repository
func githubFallbackPreview(target *url.URL) *schema.LinkPreview {
	host := strings.TrimPrefix(strings.ToLower(target.Hostname()), "www.")
	if host != "github.com" {
		return nil
	}
	parts := strings.Split(strings.Trim(target.Path, "/"), "/")
	if len(parts) < 2 || parts[0] == "" || parts[1] == "" {
		return nil
	}

	repo := parts[0] + "/" + parts[1]
	title := repo
	if len(parts) >= 4 {
		if kind, ok := githubLinkKinds[parts[2]]; ok {
			ref := parts[3]
			switch parts[2] {
			case "commit":
				if len(ref) > 7 {
					ref = ref[:7]
				}
			case "releases":
				if parts[3] == "tag" && len(parts) >= 5 {
					ref = parts[4]
				}
			default:
				ref = "#" + ref
			}
			title = fmt.Sprintf("%s · %s %s", repo, kind, ref)
		}
	}

	return &schema.LinkPreview{
		URL:         target.String(),
		Title:       title,
		Description: "Preview not available. This repository may be private, open the link to view it on GitHub.",
		SiteName:    "GitHub",
		Favicon:     "https://github.githubassets.com/favicons/favicon.svg",
	}
}

var carrierGradeNAT = &net.IPNet{IP: net.IPv4(100, 64, 0, 0), Mask: net.CIDRMask(10, 32)}

func isPublicIP(ip net.IP) bool {
	return !(ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsUnspecified() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsInterfaceLocalMulticast() ||
		ip.IsMulticast() ||
		carrierGradeNAT.Contains(ip))
}

func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max-1]) + "…"
}

func (s *linkPreviewService) getCached(key string) (cachedLinkPreview, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	cached, ok := s.cache[key]
	if !ok || time.Now().After(cached.expiresAt) {
		return cachedLinkPreview{}, false
	}
	return cached, true
}

func (s *linkPreviewService) setCached(key string, preview *schema.LinkPreview, err error) {
	// Do not cache cancellations or timeouts caused by the caller going away
	if errors.Is(err, context.Canceled) {
		return
	}
	ttl := linkPreviewCacheTTL
	if err != nil {
		ttl = linkPreviewFailureTTL
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.cache) >= linkPreviewMaxCached {
		now := time.Now()
		for k, v := range s.cache {
			if now.After(v.expiresAt) {
				delete(s.cache, k)
			}
		}
		if len(s.cache) >= linkPreviewMaxCached {
			s.cache = make(map[string]cachedLinkPreview)
		}
	}
	s.cache[key] = cachedLinkPreview{preview: preview, err: err, expiresAt: time.Now().Add(ttl)}
}
