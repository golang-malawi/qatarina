-- +goose Up

ALTER TABLE projects
ADD COLUMN parent_project_id INTEGER NULL;

-- +goose Down
