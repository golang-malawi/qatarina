-- +goose Up
CREATE TABLE test_case_sequences (
    project_id INTEGER NOT NULL,
    prefix TEXT NOT NULL,
    current_val INTEGER NOT NULL,
    last_generated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (project_id, prefix)
);

INSERT INTO test_case_sequences (project_id, current_val, last_generated_at)
VALUES 
(1, '', 0, now()), 
(2, '', 0, now())
ON CONFLICT (project_id, prefix) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_test_case_sequences_project_prefix ON test_case_sequences (project_id, prefix);


-- +goose Down
DROP INDEX IF EXISTS idx_test_case_sequences_project_prefix;
DROP TABLE test_case_sequences;


