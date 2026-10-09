-- +goose Up
CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

ALTER TABLE test_cases
ADD COLUMN priority priority_level NOT NULL DEFAULT 'medium';

COMMENT ON COLUMN test_cases.priority IS 'Importance of the test case: low, medium, high or urgent';

ALTER TABLE test_plan_cases
ADD COLUMN urgency priority_level NOT NULL DEFAULT 'medium';

COMMENT ON COLUMN test_plan_cases.urgency IS 'Urgency of the test case within the test plan: low, medium, high or urgent';

-- +goose Down
ALTER TABLE test_plan_cases DROP COLUMN urgency;
ALTER TABLE test_cases DROP COLUMN priority;
DROP TYPE IF EXISTS priority_level;
