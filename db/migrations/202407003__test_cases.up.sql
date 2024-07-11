-- +goose Up

-- Generic test cases table, this table can be used to define general or common
-- test cases and also forms the basis for linking test-cases to projects
CREATE TABLE test_cases (
    id uuid primary key not null,
    kind test_kind not null,
    code varchar(200) not null,
    feature_or_module text null,
    title text not null,
    description text not null,
    parent_test_case_id integer null,
    is_draft boolean default false,
    tags varchar(100)[],
    created_by_id integer not null,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);

COMMENT ON COLUMN test_cases.kind IS  'The kind of test this case represents';
COMMENT ON COLUMN test_cases.code IS  'A global or project defined code for this test cases';
COMMENT ON COLUMN test_cases.feature_or_module IS  'Feature or module under test if applicable';
COMMENT ON COLUMN test_cases.title IS  'The title of the test case, think of as E-mail subject';
COMMENT ON COLUMN test_cases.description IS  'Description of the test-case';
COMMENT ON COLUMN test_cases.parent_test_case_id IS  'If applicable, the parent test-cases';
COMMENT ON COLUMN test_cases.is_draft IS  'Whether test case is a draft i.e. not complete';
COMMENT ON COLUMN test_cases.tags IS  'Tags for the test case';
COMMENT ON COLUMN test_cases.created_by_id IS  'User who created the test case';
-- +goose Down
