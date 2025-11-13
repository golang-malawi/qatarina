-- +goose Up
CREATE TABLE test_run_results (
    id UUID PRIMARY KEY,
    test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'blocked')),
    result TEXT NOT NULL,
    notes TEXT,
    executed_by INT NOT NULL,
    executed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE test_run_results;
