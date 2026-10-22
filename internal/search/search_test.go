package search

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewFromConfig(t *testing.T) {
	engine, err := NewFromConfig(&config.SearchConfiguration{})
	require.NoError(t, err)
	assert.False(t, engine.Enabled())
	_, err = engine.SearchTestCases(context.Background(), Query{Text: "login"})
	assert.True(t, errors.Is(err, ErrDisabled))

	engine, err = NewFromConfig(&config.SearchConfiguration{
		Provider:    "Meilisearch",
		Meilisearch: config.MeilisearchConfiguration{URL: "http://localhost:7700"},
	})
	require.NoError(t, err)
	assert.True(t, engine.Enabled())

	_, err = NewFromConfig(&config.SearchConfiguration{Provider: "meilisearch"})
	assert.Error(t, err, "meilisearch requires a url")

	_, err = NewFromConfig(&config.SearchConfiguration{Provider: "opensearch"})
	assert.Error(t, err, "opensearch is not supported yet")

	_, err = NewFromConfig(&config.SearchConfiguration{Provider: "elastic"})
	assert.Error(t, err)
}

func TestMeilisearchSearchTestCases(t *testing.T) {
	var got map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "/indexes/test_cases/search", r.URL.Path)
		assert.Equal(t, "Bearer secret", r.Header.Get("Authorization"))
		require.NoError(t, json.NewDecoder(r.Body).Decode(&got))
		w.Write([]byte(`{"hits":[{"id":"b"},{"id":"a"}]}`))
	}))
	defer server.Close()

	engine, err := NewMeilisearch(config.MeilisearchConfiguration{URL: server.URL, APIKey: "secret"})
	require.NoError(t, err)

	ids, err := engine.SearchTestCases(context.Background(), Query{Text: "login", ProjectID: 7, Limit: 500})
	require.NoError(t, err)
	assert.Equal(t, []string{"b", "a"}, ids)
	assert.Equal(t, "login", got["q"])
	assert.Equal(t, "project_id = 7", got["filter"])
	assert.EqualValues(t, maxSearchLimit, got["limit"])
}

func TestMeilisearchErrorStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"message":"invalid api key"}`))
	}))
	defer server.Close()

	engine, err := NewMeilisearch(config.MeilisearchConfiguration{URL: server.URL})
	require.NoError(t, err)

	err = engine.IndexTestCases(context.Background(), TestCaseDocument{ID: "a"})
	assert.ErrorContains(t, err, "invalid api key")
}

func TestMeilisearchSetupIgnoresExistingIndex(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/indexes":
			w.Write([]byte(`{"taskUid":1}`))
		case "/tasks/1":
			w.Write([]byte(`{"status":"failed","error":{"message":"Index already exists.","code":"index_already_exists"}}`))
		case "/indexes/test_cases/settings":
			w.Write([]byte(`{"taskUid":2}`))
		case "/tasks/2":
			w.Write([]byte(`{"status":"succeeded"}`))
		default:
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	engine, err := NewMeilisearch(config.MeilisearchConfiguration{URL: server.URL})
	require.NoError(t, err)
	assert.NoError(t, engine.Setup(context.Background()))
}
