-- +goose Up
CREATE TABLE test_plans (
    id bigserial primary key not null,
    project_id integer not null,
    assigned_to_id integer not null,
    created_by_id integer not null,
    updated_by_id integer not null,
    kind test_kind not null default 'user_acceptance',
    description text null,
    start_at timestamp,
    closed_at timestamp null,
    scheduled_end_at timestamp,
    num_test_cases integer not null,
    num_failures integer not null,
    is_complete boolean default false,
    is_locked boolean default false,
    has_report boolean default false,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);

COMMENT ON COLUMN test_plans.project_id IS 'Project which this test plan is under';
COMMENT ON COLUMN test_plans.assigned_to_id IS '[Optional] User who is assigned to the plan';
COMMENT ON COLUMN test_plans.created_by_id IS 'User who created the plan';
COMMENT ON COLUMN test_plans.updated_by_id IS 'User who last updated the plan';
COMMENT ON COLUMN test_plans.kind IS 'The kind of test the plan targets';
COMMENT ON COLUMN test_plans.description IS 'Description of the test plan';
COMMENT ON COLUMN test_plans.start_at IS 'When the test (should) starts';
COMMENT ON COLUMN test_plans.closed_at IS 'When the test plan was actually closed';
COMMENT ON COLUMN test_plans.scheduled_end_at IS '[Optional] A scheduled end date for the test';
COMMENT ON COLUMN test_plans.num_test_cases IS 'Number of test cases under this plan, counter cached';
COMMENT ON COLUMN test_plans.num_failures IS 'Number of failed test cases under this plan, counter cached';
COMMENT ON COLUMN test_plans.is_complete IS 'Whether test plan was completed or not';
COMMENT ON COLUMN test_plans.is_locked IS 'Whether test plan is locked or not';
COMMENT ON COLUMN test_plans.has_report IS 'Whether the test plan has a report generated for it';
-- +goose Down
