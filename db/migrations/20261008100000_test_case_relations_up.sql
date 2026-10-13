-- +goose Up
CREATE TABLE test_case_relations (
    id UUID PRIMARY KEY NOT NULL,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    related_test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    relation_kind TEXT NOT NULL,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- A CHECK rather than a Postgres enum so kinds can be added by replacing this constraint
    CONSTRAINT test_case_relations_kind_check
        CHECK (relation_kind IN ('depends_on', 'related_to', 'duplicates', 'branched_from')),
    CONSTRAINT test_case_relations_not_self
        CHECK (test_case_id <> related_test_case_id)
);

-- One relation of each kind per pair, whichever way round it was created:
-- stops both "A related_to B" and "B related_to A", and "A depends_on B" with "B depends_on A"
CREATE UNIQUE INDEX test_case_relations_pair_kind_idx ON test_case_relations (
    LEAST(test_case_id, related_test_case_id),
    GREATEST(test_case_id, related_test_case_id),
    relation_kind
);

CREATE INDEX test_case_relations_test_case_idx ON test_case_relations (test_case_id);
CREATE INDEX test_case_relations_related_test_case_idx ON test_case_relations (related_test_case_id);

COMMENT ON TABLE test_case_relations IS 'Typed relationships between two test cases, read as: test_case_id <relation_kind> related_test_case_id';
COMMENT ON COLUMN test_case_relations.relation_kind IS 'One of depends_on, related_to, duplicates, branched_from';
COMMENT ON COLUMN test_case_relations.created_by_id IS 'User who created the relation';

-- +goose Down
DROP TABLE IF EXISTS test_case_relations;
