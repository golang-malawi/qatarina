-- +goose Up
-- Fix foreign key constraints that prevent user deletion

-- Drop and recreate test_runs foreign keys for assigned_to_id and tested_by_id
ALTER TABLE test_runs ALTER COLUMN assigned_to_id DROP NOT NULL;
ALTER TABLE test_runs DROP CONSTRAINT IF EXISTS fk_test_run_assignee;
ALTER TABLE test_runs ADD CONSTRAINT fk_test_run_assignee 
  FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE test_runs ALTER COLUMN tested_by_id DROP NOT NULL;
ALTER TABLE test_runs DROP CONSTRAINT IF EXISTS fk_test_run_tester;
ALTER TABLE test_runs ADD CONSTRAINT fk_test_run_tester 
  FOREIGN KEY (tested_by_id) REFERENCES users(id) ON DELETE SET NULL;

-- Drop and recreate pages foreign keys
ALTER TABLE pages DROP CONSTRAINT IF EXISTS fk_pages_creator_id;
ALTER TABLE pages ADD CONSTRAINT fk_pages_creator_id 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE pages DROP CONSTRAINT IF EXISTS fk_pages_editor_id;
ALTER TABLE pages ADD CONSTRAINT fk_pages_editor_id 
  FOREIGN KEY (last_edited_by) REFERENCES users(id) ON DELETE SET NULL;

-- Drop and recreate orgs.created_by_id foreign key
ALTER TABLE orgs DROP CONSTRAINT IF EXISTS fk_org_creator;
ALTER TABLE orgs ADD CONSTRAINT fk_org_creator 
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE test_runs DROP CONSTRAINT IF EXISTS fk_test_run_assignee;
ALTER TABLE test_runs ADD CONSTRAINT fk_test_run_assignee 
  FOREIGN KEY (assigned_to_id) REFERENCES users(id);

ALTER TABLE test_runs DROP CONSTRAINT IF EXISTS fk_test_run_tester;
ALTER TABLE test_runs ADD CONSTRAINT fk_test_run_tester 
  FOREIGN KEY (tested_by_id) REFERENCES users(id);
ALTER TABLE test_runs ALTER COLUMN assigned_to_id SET NOT NULL;
ALTER TABLE test_runs ALTER COLUMN tested_by_id SET NOT NULL;

ALTER TABLE pages DROP CONSTRAINT IF EXISTS fk_pages_creator_id;
ALTER TABLE pages ADD CONSTRAINT fk_pages_creator_id 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE pages DROP CONSTRAINT IF EXISTS fk_pages_editor_id;
ALTER TABLE pages ADD CONSTRAINT fk_pages_editor_id 
  FOREIGN KEY (last_edited_by) REFERENCES users(id);

ALTER TABLE orgs DROP CONSTRAINT IF EXISTS fk_org_creator;
ALTER TABLE orgs ADD CONSTRAINT fk_org_creator 
  FOREIGN KEY (created_by_id) REFERENCES users(id);
