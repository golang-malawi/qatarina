-- +goose Up
ALTER TABLE test_cases ADD COLUMN runner TEXT;


-- +goose Down

