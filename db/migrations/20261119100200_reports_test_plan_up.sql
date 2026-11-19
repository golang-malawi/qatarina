-- +goose Up
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS test_plan_id BIGINT NULL REFERENCES test_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_test_plan ON reports(test_plan_id);

COMMENT ON COLUMN reports.test_plan_id IS 'The test plan the report was generated for';

-- Closing a test plan now locks it, so lock the plans that were closed before
UPDATE test_plans
SET is_locked = TRUE
WHERE (is_complete OR closed_at IS NOT NULL)
  AND is_locked IS DISTINCT FROM TRUE;

-- +goose Down
DROP INDEX IF EXISTS idx_reports_test_plan;
ALTER TABLE reports DROP COLUMN IF EXISTS test_plan_id;
