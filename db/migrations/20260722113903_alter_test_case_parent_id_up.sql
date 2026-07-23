-- +goose Up
ALTER TABLE test_cases
    DROP COLUMN parent_test_case_id;

ALTER TABLE test_cases
    ADD COLUMN parent_test_case_id uuid NULL;

ALTER TABLE test_cases
    ADD CONSTRAINT fk_parent_test_case
    FOREIGN KEY (parent_test_case_id) REFERENCES test_cases(id);

-- +goose Down
