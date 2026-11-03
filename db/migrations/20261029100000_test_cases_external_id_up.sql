-- +goose Up
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS external_id TEXT NULL;

COMMENT ON COLUMN test_cases.external_id IS 'Identifier of the test case in the source system it was imported from (e.g. TestLink tc_external_id)';

-- +goose Down
ALTER TABLE test_cases DROP COLUMN IF EXISTS external_id;
