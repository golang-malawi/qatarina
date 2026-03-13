-- +goose Up
ALTER TABLE test_runs 
ADD COLUMN environment_id INT REFERENCES environments(id) ON DELETE SET NULL;

-- +goose Down

