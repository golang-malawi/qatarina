-- +goose Up
ALTER TABLE projects ADD COLUMN code VARCHAR(10) NOT NULL DEFAULT '';

-- Ensure code is atleast 3 charaters, ASCII-only, no whitespate
-- ALTER TABLE projects ADD CONSTRAINT project_code_valid CHECK (
--     LENGTH(code) >= 3 AND
--     code ~ '^[A-Z0-9]+$'
-- );


-- +goose Down
-- ALTER TABLE projects DROP CONSTRAINT project_code_valid;
ALTER TABLE projects DROP COLUMN code;

