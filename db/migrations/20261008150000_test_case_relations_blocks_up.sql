-- +goose Up
ALTER TABLE test_case_relations
    DROP CONSTRAINT test_case_relations_kind_check;

ALTER TABLE test_case_relations
    ADD CONSTRAINT test_case_relations_kind_check
        CHECK (relation_kind IN ('depends_on', 'related_to', 'duplicates', 'branched_from', 'blocks'));

COMMENT ON COLUMN test_case_relations.relation_kind IS 'One of depends_on, related_to, duplicates, branched_from, blocks';

-- +goose Down
DELETE FROM test_case_relations WHERE relation_kind = 'blocks';

ALTER TABLE test_case_relations
    DROP CONSTRAINT test_case_relations_kind_check;

ALTER TABLE test_case_relations
    ADD CONSTRAINT test_case_relations_kind_check
        CHECK (relation_kind IN ('depends_on', 'related_to', 'duplicates', 'branched_from'));

COMMENT ON COLUMN test_case_relations.relation_kind IS 'One of depends_on, related_to, duplicates, branched_from';
