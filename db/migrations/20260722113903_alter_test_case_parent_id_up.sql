-- +goose Up
ALTER TABLE test_cases
    ALTER COLUMN parent_test_case_id TYPE uuid
    USING (parent_test_case_id::uuid);

-- If you want to enforce referential integrity:
ALTER TABLE test_cases
    ADD CONSTRAINT fk_parent_test_case
    FOREIGN KEY (parent_test_case_id) REFERENCES test_cases(id);

-- +goose Down