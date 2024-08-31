-- +goose Up
ALTER TABLE test_cases ADD COLUMN project_id integer;

ALTER TABLE test_cases ADD CONSTRAINT fk_testcase_project
  FOREIGN KEY (project_id)
  REFERENCES projects(id) ON DELETE CASCADE;

COMMENT ON COLUMN test_cases.project_id IS 'Project for the test cases';
-- +goose Down
