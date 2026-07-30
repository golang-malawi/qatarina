-- +goose Up
ALTER TABLE test_runs ALTER COLUMN tested_by_id DROP NOT NULL;

-- +goose Down
ALTER TABLE test_runs ALTER COLUMN tested_by_id SET NOT NULL;