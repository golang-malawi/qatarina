-- +goose Up
ALTER TABLE test_cases
ADD COLUMN status TEXT DEFAULT 'open',
ADD COLUMN result TEXT NULL, 
ADD COLUMN executed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
ADD COLUMN executed_by INT,
ADD COLUMN notes TEXT NULL;

COMMENT ON COLUMN test_cases.status IS 'Current status of a test case, options can be open, closed, skipped, etc';
COMMENT ON COLUMN test_cases.result IS 'Is the outcome of the test case, which can be passed, failed, blocked, etc';
COMMENT ON COLUMN test_cases.executed_at IS 'Time a test case is excecuted';
COMMENT ON COLUMN test_cases.executed_by IS 'The ID of a user carrying out the testing';

-- +goose Down
