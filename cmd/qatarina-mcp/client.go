package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-malawi/qatarina/internal/schema"
)

// Client is a tiny HTTP client for the QATARINA REST API. It logs in with
// email/password on first use and keeps the token in memory.
type Client struct {
	baseURL  string
	email    string
	password string
	http     *http.Client

	mu    sync.Mutex
	login *schema.LoginResponse
}

func NewClient(baseURL, email, password string) *Client {
	return &Client{
		baseURL:  strings.TrimRight(baseURL, "/"),
		email:    email,
		password: password,
		http:     &http.Client{Timeout: 30 * time.Second},
	}
}

// Login authenticates against POST /v1/auth/login and caches the result.
func (c *Client) Login(ctx context.Context) (*schema.LoginResponse, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	body, err := json.Marshal(schema.LoginRequest{Email: c.email, Password: c.password})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/auth/login", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	data, status, err := c.send(req)
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK {
		return nil, fmt.Errorf("login failed (%d): %s", status, data)
	}

	var login schema.LoginResponse
	if err := json.Unmarshal(data, &login); err != nil {
		return nil, fmt.Errorf("failed to decode login response: %w", err)
	}
	c.login = &login
	return &login, nil
}

// Get calls an authenticated GET endpoint and returns the raw JSON body.
// It logs in if needed, and logs in again once if the token was rejected.
func (c *Client) Get(ctx context.Context, path string) (json.RawMessage, error) {
	for attempt := 0; attempt < 2; attempt++ {
		token, err := c.token(ctx, attempt > 0)
		if err != nil {
			return nil, err
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+token)

		data, status, err := c.send(req)
		if err != nil {
			return nil, err
		}
		if status == http.StatusUnauthorized {
			continue
		}
		if status != http.StatusOK {
			return nil, fmt.Errorf("GET %s failed (%d): %s", path, status, data)
		}
		return data, nil
	}
	return nil, fmt.Errorf("GET %s: unauthorized", path)
}

// token returns the cached token, logging in when there is none or when
// forceLogin is set.
func (c *Client) token(ctx context.Context, forceLogin bool) (string, error) {
	c.mu.Lock()
	login := c.login
	c.mu.Unlock()

	if login == nil || forceLogin {
		var err error
		if login, err = c.Login(ctx); err != nil {
			return "", err
		}
	}
	return login.Token, nil
}

func (c *Client) send(req *http.Request) ([]byte, int, error) {
	res, err := c.http.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, 0, err
	}
	return data, res.StatusCode, nil
}
