-- +goose Up
UPDATE test_plan_cases
SET assigned_to_id = 0
WHERE assigned_to_id IS NULL;

ALTER TABLE test_plan_cases
ALTER COLUMN assigned_to_id SET NOT NULL;

ALTER TABLE test_plan_cases DROP CONSTRAINT IF EXISTS test_plan_cases_pkey;

ALTER TABLE test_plan_cases
ADD CONSTRAINT test_plan_cases_pkey PRIMARY KEY (test_plan_id, test_case_id, assigned_to_id);

-- +goose Down

