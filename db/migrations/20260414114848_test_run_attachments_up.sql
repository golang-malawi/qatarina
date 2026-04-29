-- +goose Up
CREATE TABLE test_run_attachments (
    id UUID PRIMARY KEY,
    test_run_result_id UUID NOT NULL REFERENCES test_run_results(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- +goose Down
DROP TABLE test_run_attachments;
