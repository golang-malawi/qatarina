-- +goose Up
CREATE TABLE test_case_sequences (
    project_id INTEGER NOT NULL,
    prefix TEXT NOT NULL,
    current_val INTEGER NOT NULL,
    last_generated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (project_id, prefix)
);

CREATE INDEX IF NOT EXISTS idx_test_case_sequences_project_prefix ON test_case_sequences (project_id, prefix);


-- +goose Down
DROP INDEX IF EXISTS idx_test_case_sequences_project_prefix;
DROP TABLE test_case_sequences;


