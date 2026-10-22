package search

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
)

const (
	defaultMeilisearchIndex = "test_cases"
	defaultSearchLimit      = 20
	maxSearchLimit          = 100
	reindexBatchSize        = 1000
)

// Meilisearch is an Engine backed by a Meilisearch server, using its HTTP API directly
type Meilisearch struct {
	baseURL string
	apiKey  string
	index   string
	client  *http.Client
}

var _ Engine = (*Meilisearch)(nil)

func NewMeilisearch(cfg config.MeilisearchConfiguration) (*Meilisearch, error) {
	if strings.TrimSpace(cfg.URL) == "" {
		return nil, errors.New("search: meilisearch url is required")
	}
	if _, err := url.ParseRequestURI(cfg.URL); err != nil {
		return nil, fmt.Errorf("search: invalid meilisearch url: %w", err)
	}
	index := cfg.Index
	if index == "" {
		index = defaultMeilisearchIndex
	}
	return &Meilisearch{
		baseURL: strings.TrimRight(cfg.URL, "/"),
		apiKey:  cfg.APIKey,
		index:   index,
		client:  &http.Client{Timeout: 10 * time.Second},
	}, nil
}

func (m *Meilisearch) Enabled() bool { return true }

// meiliTask is the summarized task returned by Meilisearch for asynchronous operations
type meiliTask struct {
	TaskUID int64 `json:"taskUid"`
}

type meiliTaskStatus struct {
	Status string `json:"status"`
	Error  *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error"`
}

func (m *Meilisearch) Setup(ctx context.Context) error {
	var task meiliTask
	err := m.do(ctx, http.MethodPost, "/indexes", map[string]string{
		"uid":        m.index,
		"primaryKey": "id",
	}, &task)
	if err != nil {
		return err
	}
	if err := m.waitForTask(ctx, task.TaskUID); err != nil && !strings.Contains(err.Error(), "index_already_exists") {
		return err
	}

	settings := map[string]any{
		"searchableAttributes": []string{"code", "title", "feature_or_module", "tags", "description", "preconditions"},
		"filterableAttributes": []string{"project_id", "kind", "priority", "is_draft", "suggested", "tags"},
		"sortableAttributes":   []string{"updated_at"},
	}
	if err := m.do(ctx, http.MethodPatch, m.indexPath("/settings"), settings, &task); err != nil {
		return err
	}
	return m.waitForTask(ctx, task.TaskUID)
}

func (m *Meilisearch) IndexTestCases(ctx context.Context, docs ...TestCaseDocument) error {
	if len(docs) == 0 {
		return nil
	}
	return m.do(ctx, http.MethodPost, m.indexPath("/documents?primaryKey=id"), docs, nil)
}

func (m *Meilisearch) DeleteTestCases(ctx context.Context, ids ...string) error {
	if len(ids) == 0 {
		return nil
	}
	return m.do(ctx, http.MethodPost, m.indexPath("/documents/delete-batch"), ids, nil)
}

func (m *Meilisearch) Reindex(ctx context.Context, docs []TestCaseDocument) error {
	// Tasks on an index are processed in order, so documents added below
	// are never removed by this delete
	if err := m.do(ctx, http.MethodDelete, m.indexPath("/documents"), nil, nil); err != nil {
		return err
	}
	for start := 0; start < len(docs); start += reindexBatchSize {
		end := min(start+reindexBatchSize, len(docs))
		if err := m.IndexTestCases(ctx, docs[start:end]...); err != nil {
			return err
		}
	}
	return nil
}

func (m *Meilisearch) SearchTestCases(ctx context.Context, query Query) ([]string, error) {
	limit := query.Limit
	if limit <= 0 {
		limit = defaultSearchLimit
	}
	limit = min(limit, maxSearchLimit)

	request := map[string]any{
		"q":                    query.Text,
		"limit":                limit,
		"attributesToRetrieve": []string{"id"},
	}
	if query.ProjectID > 0 {
		request["filter"] = fmt.Sprintf("project_id = %d", query.ProjectID)
	}

	var response struct {
		Hits []struct {
			ID string `json:"id"`
		} `json:"hits"`
	}
	if err := m.do(ctx, http.MethodPost, m.indexPath("/search"), request, &response); err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(response.Hits))
	for _, hit := range response.Hits {
		ids = append(ids, hit.ID)
	}
	return ids, nil
}

// waitForTask polls an asynchronous Meilisearch task until it completes
func (m *Meilisearch) waitForTask(ctx context.Context, taskUID int64) error {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		var status meiliTaskStatus
		if err := m.do(ctx, http.MethodGet, fmt.Sprintf("/tasks/%d", taskUID), nil, &status); err != nil {
			return err
		}
		switch status.Status {
		case "succeeded":
			return nil
		case "failed", "canceled":
			if status.Error != nil {
				return fmt.Errorf("search: meilisearch task %d %s: %s (%s)", taskUID, status.Status, status.Error.Message, status.Error.Code)
			}
			return fmt.Errorf("search: meilisearch task %d %s", taskUID, status.Status)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (m *Meilisearch) indexPath(suffix string) string {
	return "/indexes/" + url.PathEscape(m.index) + suffix
}

func (m *Meilisearch) do(ctx context.Context, method, path string, body any, out any) error {
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("search: failed to encode request: %w", err)
		}
		reader = bytes.NewReader(payload)
	}

	req, err := http.NewRequestWithContext(ctx, method, m.baseURL+path, reader)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if m.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+m.apiKey)
	}

	res, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("search: meilisearch request failed: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= http.StatusBadRequest {
		msg, _ := io.ReadAll(io.LimitReader(res.Body, 4096))
		return fmt.Errorf("search: meilisearch %s %s returned %d: %s", method, path, res.StatusCode, strings.TrimSpace(string(msg)))
	}
	if out == nil {
		return nil
	}
	if err := json.NewDecoder(res.Body).Decode(out); err != nil {
		return fmt.Errorf("search: failed to decode meilisearch response: %w", err)
	}
	return nil
}
