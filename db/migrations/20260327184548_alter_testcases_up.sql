-- +goose Up
ALTER TABLE test_cases ADD COLUMN suggested BOOLEAN DEFAULT false;

-- +goose Down

