// Package search provides optional full-text search for test cases backed by
// an external engine such as Meilisearch. When no provider is configured the
// Noop engine is used and callers fall back to database queries.
package search

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
)

// ErrDisabled is returned by the Noop engine to signal callers to use their fallback
var ErrDisabled = errors.New("search: no search provider configured")

// TestCaseDocument is the representation of a test case stored in the search index
type TestCaseDocument struct {
	ID              string   `json:"id"`
	ProjectID       int64    `json:"project_id"`
	Kind            string   `json:"kind"`
	Code            string   `json:"code"`
	FeatureOrModule string   `json:"feature_or_module"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Preconditions   string   `json:"preconditions"`
	Tags            []string `json:"tags"`
	Priority        string   `json:"priority"`
	IsDraft         bool     `json:"is_draft"`
	Suggested       bool     `json:"suggested"`
	UpdatedAt       int64    `json:"updated_at"`
}

// NewTestCaseDocument converts a test case row into an indexable document
func NewTestCaseDocument(tc *dbsqlc.TestCase) TestCaseDocument {
	doc := TestCaseDocument{
		ID:              tc.ID.String(),
		ProjectID:       int64(tc.ProjectID.Int32),
		Kind:            string(tc.Kind),
		Code:            tc.Code,
		FeatureOrModule: tc.FeatureOrModule.String,
		Title:           tc.Title,
		Description:     tc.Description,
		Preconditions:   tc.Preconditions.String,
		Tags:            tc.Tags,
		Priority:        string(tc.Priority),
		IsDraft:         tc.IsDraft.Bool,
		Suggested:       tc.Suggested.Bool,
	}
	if doc.Tags == nil {
		doc.Tags = []string{}
	}
	if tc.UpdatedAt.Valid {
		doc.UpdatedAt = tc.UpdatedAt.Time.Unix()
	}
	return doc
}

// Query describes a full-text search request
type Query struct {
	Text string
	// ProjectID restricts results to a single project when non-zero
	ProjectID int64
	Limit     int
}

// Engine indexes and searches test cases
type Engine interface {
	// Enabled reports whether this engine is backed by a real search provider
	Enabled() bool
	// Setup prepares the index (creates it and applies settings) and is safe to call repeatedly
	Setup(ctx context.Context) error
	// IndexTestCases adds or replaces the given test cases in the index
	IndexTestCases(ctx context.Context, docs ...TestCaseDocument) error
	// DeleteTestCases removes the test cases with the given IDs from the index
	DeleteTestCases(ctx context.Context, ids ...string) error
	// Reindex replaces the entire contents of the index with the given test cases
	Reindex(ctx context.Context, docs []TestCaseDocument) error
	// SearchTestCases returns the IDs of matching test cases ordered by relevance
	SearchTestCases(ctx context.Context, query Query) ([]string, error)
}

// NewFromConfig creates the Engine for the configured provider
func NewFromConfig(cfg *config.SearchConfiguration) (Engine, error) {
	switch provider := cfg.GetProvider(); provider {
	case config.SearchProviderNone:
		return Noop{}, nil
	case config.SearchProviderMeilisearch:
		return NewMeilisearch(cfg.Meilisearch)
	case config.SearchProviderOpenSearch:
		return nil, fmt.Errorf("search: provider %q is not supported yet", provider)
	default:
		return nil, fmt.Errorf("search: unknown provider %q, expected one of none, meilisearch, opensearch", provider)
	}
}

// Noop is the Engine used when search is disabled
type Noop struct{}

var _ Engine = Noop{}

func (Noop) Enabled() bool                                             { return false }
func (Noop) Setup(context.Context) error                               { return nil }
func (Noop) IndexTestCases(context.Context, ...TestCaseDocument) error { return nil }
func (Noop) DeleteTestCases(context.Context, ...string) error          { return nil }
func (Noop) Reindex(context.Context, []TestCaseDocument) error         { return nil }
func (Noop) SearchTestCases(context.Context, Query) ([]string, error)  { return nil, ErrDisabled }
