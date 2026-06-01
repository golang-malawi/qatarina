-- +goose Up
ALTER TABLE projects ADD COLUMN testcase_template TEXT;

-- +goose Down
ALTER TABLE projects DROP COLUMN testcase_template;
