-- +goose Up
CREATE TABLE test_plans_cases (
    test_plan_id uuid not null,
    test_case_id uuid not null,
    added_by_id integer,
    created_at timestamp without time zone,
    primary key(test_plan_id, test_case_id)
);
-- +goose Down