-- +goose Up
ALTER TABLE test_plans_cases DROP CONSTRAINT IF EXISTS fk_test_plan;

-- Drop old uuid column
ALTER TABLE test_plans_cases DROP COLUMN test_plan_id;

-- Add new bigint column
ALTER TABLE test_plans_cases ADD COLUMN test_plan_id bigint NOT NULL;

-- Add foreign key constraint
ALTER TABLE test_plans_cases
  ADD CONSTRAINT fk_test_plan FOREIGN KEY (test_plan_id)
  REFERENCES test_plans(id)
  ON DELETE CASCADE;

-- +goose Down
ALTER TABLE test_plans_cases DROP CONSTRAINT IF EXISTS fk_test_plan;

-- Drop bigint column
ALTER TABLE test_plans_cases DROP COLUMN test_plan_id;

-- Add back uuid column
ALTER TABLE test_plans_cases ADD COLUMN test_plan_id uuid NOT NULL;
