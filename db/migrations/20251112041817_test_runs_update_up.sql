-- +goose Up
CREATE TABLE test_run_results (
    id UUID PRIMARY KEY,
    test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    status test_run_state NOT NULL, -- use the same enum as test_runs
    result TEXT NOT NULL,
    notes TEXT,
    executed_by INT NOT NULL REFERENCES users(id),
    executed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE test_run_results;
