-- +goose Up
ALTER TABLE test_cases ADD COLUMN runner TEXT;
ALTER TABLE test_cases ADD COLUMN script_path TEXT;


-- +goose Down

