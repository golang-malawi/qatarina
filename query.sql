-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: UserExists :one
SELECT EXISTS(SELECT id FROM users WHERE id = $1);

-- name: FindUserLoginByEmail :one
SELECT id, display_name, email, password, last_login_at FROM users WHERE email = $1 AND is_activated AND deleted_at IS NULL;

-- name: UpdateUserLastLogin :execrows
UPDATE users SET last_login_at = $1 WHERE id = $2 AND is_activated AND deleted_at IS NULL;

-- name: CreateUser :one
INSERT INTO users (
    first_name, last_name, display_name, email, password, phone,
    org_id, country_iso, city, address,
    is_activated, is_reviewed, is_super_admin, is_verified,
    last_login_at, email_confirmed_at, created_at, updated_at, deleted_at
)
VALUES(
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14,
    $15, $16, $17, $18, $19
)
RETURNING id;

-- name: ListProjects :many
SELECT * FROM projects ORDER BY created_at DESC;

-- name: GetProject :one
SELECT * FROM projects WHERE id = $1;

-- name: DeleteProject :execrows
DELETE FROM projects WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (
    title, description, version, is_active, is_public, website_url,
    github_url, trello_url, jira_url, monday_url,
    owner_user_id, created_at, updated_at, deleted_at
)
VALUES(
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14
) RETURNING id;

-- name: ListTestCases :many
SELECT * FROM test_cases ORDER BY created_at DESC;

-- name: GetTestCase :one
SELECT * FROM test_cases WHERE id = $1;

-- name: ListTestCasesByProject :many
SELECT * FROM test_cases WHERE project_id = $1;

-- name: ListTestCasesByCreator :many
SELECT * FROM test_cases WHERE created_by_id = $1;

-- name: IsTestCaseLinkedToProject :one
SELECT EXISTS(
    SELECT * FROM test_cases WHERE project_id = $1
);

-- name: CountTestCasesNotLinkedToProject :one
SELECT COUNT(*) FROM test_cases
RIGHT OUTER JOIN test_plans p ON p.test_case_id = test_cases.id
WHERE p.project_id IS NULL;

-- name: CreateTestCase :one
INSERT INTO test_cases (
    id, kind, code, feature_or_module, title, description, parent_test_case_id,
    is_draft, tags, created_by_id, created_at, updated_at, project_id
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13
)
RETURNING id;

-- name: ListTestPlans :many
SELECT * FROM test_plans ORDER BY created_at DESC;

-- name: ListTestPlansByProject :many
SELECT * FROM test_plans WHERE project_id = $1;

-- name: GetTestPlan :one
SELECT * FROM test_plans WHERE id = $1;

-- name: DeleteTestPlan :execrows
DELETE FROM test_plans WHERE id = $1;

-- name: DeleteAllTestPlansInProject :execrows
DELETE FROM test_plans WHERE project_id = $1;

-- name: CreateTestPlan :one
INSERT INTO test_plans (
    project_id, assigned_to_id, created_by_id, updated_by_id,
    kind, description, start_at, closed_at, scheduled_end_at,
    num_test_cases, num_failures, is_complete, is_locked, has_report,
    created_at, updated_at
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $7, $8,
    $9, $10, $11, $12, $13, $14, $15
)
RETURNING id;

-- name: ListTestRuns :many
SELECT * FROM test_runs ORDER BY created_at DESC;

-- name: ListTestRunsByPlan :many
SELECT * FROM test_runs WHERE test_plan_id = $1;

-- name: ListTestRunsAssignedToUser :many
SELECT * FROM test_runs WHERE assigned_to_id = $1;

-- name: ListTestRunsByOwner :many
SELECT * FROM test_runs WHERE owner_id = $1;

-- name: ListTestRunsByProject :many
SELECT * FROM test_runs WHERE project_id = $1;

-- name: GetTestRun :one
SELECT * FROM test_runs WHERE id = $1;

-- name: DeleteTestRun :execrows
DELETE FROM test_runs WHERE id = $1;

-- name: DeleteAllTestRunsInProject :execrows
DELETE FROM test_runs WHERE project_id = $1;

-- name: CreateNewTestRun :one
INSERT INTO test_runs (
id, project_id, test_plan_id, test_case_id, owner_id, tested_by_id, assigned_to_id, code, created_at, updated_at,
result_state, is_closed, assignee_can_change_code, notes,reactions, tested_on, expected_result
)
VALUES (
$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
'pending', false, false, 'None', '{}'::jsonb, now(), 'Test to Pass'
)
RETURNING id;

-- name: CommitTestRunResult :one
UPDATE test_runs SET
    tested_by_id = $2,
    updated_at = $3,
    result_state = $4,
    is_closed = $5,
    notes = $6,
    tested_on = $7,
    actual_result = $8,
    expected_result = $9
WHERE id = $1
RETURNING id;


-- name: AssignTesterToProject :execrows
INSERT INTO project_testers (
    project_id, user_id, role, is_active, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, now(), now()
);

-- name: GetTestersByProject :many
SELECT
project_testers.*,
p.title as project,
u.display_name as tester_name,
u.last_login_at as tester_last_login_at
FROM project_testers
INNER JOIN users u ON u.id = project_testers.user_id
INNER JOIN projects p ON p.id = project_testers.project_id
WHERE project_id = $1;

-- name: ProjectModules :one
INSERT INTO project_modules(
    project_id, project_name, project_code, modules, created_at, updated_at
)VALUES($1, $2, $3, $4, now(), now()
)
RETURNING *;
