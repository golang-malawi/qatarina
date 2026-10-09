-- +goose Up
ALTER TABLE test_cases ADD COLUMN preconditions TEXT NULL;

COMMENT ON COLUMN test_cases.preconditions IS 'Conditions that must hold before the test case can be executed (Markdown)';

-- +goose Down
ALTER TABLE test_cases DROP COLUMN preconditions;
