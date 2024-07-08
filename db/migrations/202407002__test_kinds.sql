-- +goose Up

CREATE TYPE test_kind AS ENUM (
    -- Catch-all for tests that have not yet been placed in a specific category
    'general',
    -- Adhoc tests are tests that can be performed at any time without being part of a specific test plan
    'adhoc',
    -- Triaging tests are for scenarios where developer teams are trying to establish cause of a bug/failure
    'triage',
    -- Integration tests are for testing that the software integrates with another software/hardware system
    'integration',
    -- User Acceptance Tests are performed by users to accept requirements or features agreed on prior
    'user_acceptance',
    -- Regression tests check for any regressions since updating software
    'regression',
    -- Security tests are for testing security related functions of the software
    'security',
    -- User Interface tests are for user interface elements and how they are expected to behave
    'user_interface',
    -- Scenario Tests test different user stories or scenarios across whole flows
    'scenario'
);
-- +goose Down
