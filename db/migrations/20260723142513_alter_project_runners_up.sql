-- +goose Up
ALTER TABLE projects
ADD COLUMN supported_runners text[] DEFAULT '{}';

-- +goose Down
