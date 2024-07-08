-- +goose Up
CREATE TYPE test_run_state AS ENUM (
    -- Pending test has not been tested yet
    'pending',
    -- Passed test has passed tester's expectations
    'passed',
    -- Failed test has failed to meet tester's expectations
    'failed'
);

-- Test Runs documents the tests in a specific test plan.
-- The test may be assigned a per-plan Code to differentiate the same test from other "runs" of the test.
-- The test may be marked as passed/failed via the result_state field,
-- this table allows multiple testers to record different results for the same test
CREATE TABLE test_runs (
    id uuid not null primary key,
    project_id integer not null, -- cached here to avoid extra joins on some queries
    test_plan_id integer not null,
    test_case_id uuid not null,
    owner_id integer not null,
    tested_by_id integer not null,
    assigned_to_id integer not null, -- sometimes the assigned person may not be the one who tested it
    assignee_can_change_code boolean default true,
    code text not null,
    external_issue_id text, -- this can also be a GitHub issue or JIRA number
    result_state test_run_state not null,
    is_closed boolean default false,
    notes text not null,
    actual_result text null,
    expected_result text null,
    reactions jsonb null, -- { emoji : integer }
    tested_on date not null,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    CONSTRAINT fk_test_run_project FOREIGN KEY (project_id)
      REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_run_plan FOREIGN KEY (test_plan_id)
      REFERENCES test_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_run_case FOREIGN KEY (test_case_id)
      REFERENCES test_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_run_owner FOREIGN KEY (owner_id)
      REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_run_assignee FOREIGN KEY (assigned_to_id)
      REFERENCES users(id),
    CONSTRAINT fk_test_run_tester FOREIGN KEY (tested_by_id)
      REFERENCES users(id)
);

CREATE TABLE test_runs_comments (
    id bigserial not null primary key,
    test_run_id uuid not null,
    author_id integer not null,
    content text not null,
    media_urls jsonb,
    CONSTRAINT fk_test_runs_comments_run FOREIGN KEY (test_run_id)
      REFERENCES test_runs(id) ON DELETE CASCADE
);

-- +goose Down
