-- +goose Up
ALTER TABLE projects 
ADD COLUMN automated_testing_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose Down
ALTER TABLE projects 
DROP COLUMN automated_testing_enabled;