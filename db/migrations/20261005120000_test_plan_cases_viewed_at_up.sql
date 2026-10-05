-- +goose Up
ALTER TABLE test_plan_cases
ADD COLUMN viewed_at TIMESTAMP NULL;

-- Assignments the tester has already acted on should not show up as unseen
UPDATE test_plan_cases pc
SET viewed_at = now()
WHERE EXISTS (
    SELECT 1 FROM test_runs tr
    WHERE tr.test_case_id = pc.test_case_id
      AND tr.test_plan_id = pc.test_plan_id
      AND tr.tested_by_id = pc.assigned_to_id
);

-- +goose Down
ALTER TABLE test_plan_cases
DROP COLUMN viewed_at;
