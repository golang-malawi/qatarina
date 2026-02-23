-- +goose Up
ALTER TABLE test_plans
ADD COLUMN environment_id INT REFERENCES environments(id) ON DELETE SET NULL;
