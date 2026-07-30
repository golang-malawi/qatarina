-- +goose Up
ALTER TABLE test_run_results ALTER COLUMN executed_by DROP NOT NULL;

-- +goose Down
ALTER TABLE test_run_results ALTER COLUMN executed_by SET NOT NULL;