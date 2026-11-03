-- +goose Up
-- IF NOT EXISTS because some databases already have this table from the
-- earlier 20260414114848 version of this migration.
CREATE TABLE IF NOT EXISTS test_run_attachments (
    id UUID PRIMARY KEY,
    test_run_result_id UUID NOT NULL REFERENCES test_run_results(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- The earlier version declared uploaded_by NOT NULL, which conflicts with ON DELETE SET NULL.
ALTER TABLE test_run_attachments ALTER COLUMN uploaded_by DROP NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS test_run_attachments;
