package search

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMeilisearchLive runs against a real Meilisearch server, e.g.
//
//	QATARINA_TEST_MEILISEARCH_URL=http://localhost:7700 QATARINA_TEST_MEILISEARCH_API_KEY=... go test ./internal/search
func TestMeilisearchLive(t *testing.T) {
	url := os.Getenv("QATARINA_TEST_MEILISEARCH_URL")
	if url == "" {
		t.Skip("QATARINA_TEST_MEILISEARCH_URL not set")
	}
	engine, err := NewMeilisearch(config.MeilisearchConfiguration{
		URL:    url,
		APIKey: os.Getenv("QATARINA_TEST_MEILISEARCH_API_KEY"),
		Index:  "test_cases_it_" + time.Now().Format("150405"),
	})
	require.NoError(t, err)
	ctx := context.Background()

	require.NoError(t, engine.Setup(ctx))
	require.NoError(t, engine.Setup(ctx), "setup must be idempotent")

	require.NoError(t, engine.Reindex(ctx, []TestCaseDocument{
		{ID: "11111111-0000-0000-0000-000000000001", ProjectID: 1, Code: "AUTH-001", Title: "User can login with valid password", Tags: []string{"auth"}},
		{ID: "11111111-0000-0000-0000-000000000002", ProjectID: 1, Code: "AUTH-002", Title: "Account locks after failed attempts", Description: "Enter a wrong password three times"},
		{ID: "11111111-0000-0000-0000-000000000003", ProjectID: 2, Code: "PAY-001", Title: "Checkout with credit card", Tags: []string{"payments"}},
	}))

	search := func(q Query) []string {
		var ids []string
		require.Eventually(t, func() bool {
			ids, err = engine.SearchTestCases(ctx, q)
			require.NoError(t, err)
			return len(ids) > 0
		}, 10*time.Second, 100*time.Millisecond, "no results for %q", q.Text)
		return ids
	}

	// typo tolerance and matching on description
	ids := search(Query{Text: "pasword"})
	assert.ElementsMatch(t, []string{"11111111-0000-0000-0000-000000000001", "11111111-0000-0000-0000-000000000002"}, ids)

	// code and tag matching, project filter
	assert.Equal(t, []string{"11111111-0000-0000-0000-000000000003"}, search(Query{Text: "payments"}))
	assert.Equal(t, []string{"11111111-0000-0000-0000-000000000001"}, search(Query{Text: "AUTH-001", ProjectID: 1})[:1])
	none, err := engine.SearchTestCases(ctx, Query{Text: "checkout", ProjectID: 1})
	require.NoError(t, err)
	assert.Empty(t, none)

	// updates replace the document
	require.NoError(t, engine.IndexTestCases(ctx, TestCaseDocument{ID: "11111111-0000-0000-0000-000000000003", ProjectID: 2, Code: "PAY-001", Title: "Refund a mobile money payment"}))
	assert.Equal(t, []string{"11111111-0000-0000-0000-000000000003"}, search(Query{Text: "refund"}))

	// deletes remove the document
	require.NoError(t, engine.DeleteTestCases(ctx, "11111111-0000-0000-0000-000000000003"))
	require.Eventually(t, func() bool {
		ids, err := engine.SearchTestCases(ctx, Query{Text: "refund"})
		return err == nil && len(ids) == 0
	}, 10*time.Second, 100*time.Millisecond)

	// cleanup the throwaway index
	require.NoError(t, engine.do(ctx, "DELETE", engine.indexPath(""), nil, nil))
}
