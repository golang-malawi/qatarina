-- +goose Up
ALTER TABLE test_cases
ADD CONSTRAINT unique_test_case_code UNIQUE (project_id, code);

-- +goose Down
