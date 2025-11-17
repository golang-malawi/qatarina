-- +goose Up
ALTER TYPE test_run_state ADD VALUE 'blocked';

-- +goose Down
