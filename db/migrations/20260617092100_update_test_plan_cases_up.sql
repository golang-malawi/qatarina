-- +goose Up
ALTER TABLE test_plan_cases
ADD COLUMN assigned_to_id BIGINT NULL;

-- +goose Down
ALTER TABLE test_plan_cases
DROP COLUMN assigned_to_id;
