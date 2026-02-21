-- +goose Up
CREATE TABLE environments (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g."production", "staging", "development"
    base_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
SELECT 'down SQL query';
-- +goose StatementEnd
