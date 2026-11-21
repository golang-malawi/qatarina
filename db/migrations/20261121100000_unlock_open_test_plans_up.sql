-- +goose Up
-- 20261119100200_reports_test_plan also locked test plans that only had a closed_at,
-- which used to be typed in on the test plan forms, so plans still in progress got
-- locked. Only closing a plan locks it, and closing also completes it, so a locked
-- plan that is not complete was locked by that migration.
UPDATE test_plans
SET is_locked = FALSE
WHERE is_locked
  AND is_complete IS NOT TRUE;

-- +goose Down
-- Nothing to undo: the plans unlocked here were never closed
SELECT 1;
