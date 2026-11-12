-- +goose Up
-- test_runs_comments was created with the test_runs table but never used.
-- Record when each comment was made so comments can be listed in order.
ALTER TABLE test_runs_comments
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();

-- +goose Down
ALTER TABLE test_runs_comments DROP COLUMN IF EXISTS created_at;
