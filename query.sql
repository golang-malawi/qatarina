-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: SearchUsers :many
SELECT * FROM users 
WHERE first_name ILIKE '%' || $1 || '%'
OR last_name ILIKE '%' || $1 || '%'
OR display_name ILIKE '%' || $1 || '%'
OR email ILIKE '%' || $1 || '%';

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: UserExists :one
SELECT EXISTS(SELECT id FROM users WHERE id = $1);

-- name: FindUserLoginByEmail :one
SELECT id, display_name, email, password, last_login_at FROM users WHERE email = $1 AND is_activated AND deleted_at IS NULL;

-- name: UpdateUserLastLogin :execrows
UPDATE users SET last_login_at = $1 WHERE id = $2 AND is_activated AND deleted_at IS NULL;

-- name: UpdateUser :exec
UPDATE users SET 
    first_name = $2, last_name = $3, display_name = $4, phone = $5,
    org_id = $6, country_iso = $7, city = $8, address = $9,
    is_activated = $10, is_reviewed = $11, is_super_admin = $12, is_verified = $13,
    last_login_at = $14, email_confirmed_at = $15, created_at = $16, updated_at = $17, deleted_at = $18
WHERE id = $1;

-- name: CreateInvite :exec
INSERT INTO invites (sender_email, receiver_email, token, expires_at)
VALUES ($1, $2, $3, $4);

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

-- name: DeleteUser :execrows
DELETE FROM users WHERE id=$1;

-- name: ListProjects :many
SELECT * FROM projects ORDER BY created_at DESC;

-- name: SearchProject :many
SELECT * FROM projects
WHERE title ILIKE '%' || $1 || '%';

-- name: GetProject :one
SELECT * FROM projects WHERE id = $1;

-- name: UpdateProject :execrows
UPDATE projects SET 
title = $2, description = $3, website_url = $4,
version = $5, github_url = $6, 
owner_user_id = $7
WHERE id = $1;  

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

-- name: ListTestCasesByPlan :many
SELECT tc.* FROM test_cases tc 
INNER JOIN test_plans_cases tp ON tp.test_case_id = tc.id  
WHERE tp.test_plan_id = $1;

-- name: ListTestCasesByCreator :many
SELECT * FROM test_cases WHERE created_by_id = $1;

-- name: IsTestCaseLinkedToProject :one
SELECT EXISTS(
    SELECT * FROM test_cases WHERE project_id = $1
);

-- name: IsTestCaseUsedInTestPlan :one
SELECT EXISTS(
    SELECT 1 FROM test_runs WHERE test_case_id = $1
);

-- name: IsTestCaseUsedInTestRun :one
SELECT EXISTS(
    SELECT 1 FROM test_runs WHERE test_case_id = $1
);

-- name: SearchTestCases :many
SELECT * FROM test_cases
WHERE title ILIKE '%' || $1 || '%'
OR code ILIKE '%' || $1 || '%';

-- name: DeleteTestCase :execrows
DELETE FROM test_cases WHERE id = $1;

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

-- name: GetLatestCodeByPrefix :one
SELECT code FROM test_cases
WHERE code LIKE $1 || '%'
ORDER BY code DESC
LIMIT 1
FOR UPDATE;

-- name: GetNextTestCaseSequence :one
UPDATE test_case_sequences
SET current_val = current_val +1,
last_generated_at = now()
WHERE project_id = $1 AND prefix = $2
RETURNING current_val;

-- name: InitTestCaseSequence :exec
INSERT INTO test_case_sequences (project_id, prefix, current_val, last_generated_at)
VALUES ($1, $2, 0, now())
ON CONFLICT (project_id, prefix) DO NOTHING;

-- name: UpdateTestCase :exec
UPDATE test_cases SET
kind = $2,
code = $3,
feature_or_module = $4,
title = $5,
description = $6,
is_draft = $7,
tags = $8,
updated_at = $9
WHERE id = $1;

-- name: GetTestCaseByCode :one
SELECT * FROM test_cases 
WHERE project_id = $1 AND code = $2;

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

-- name: UpdateTestPlan :exec
UPDATE test_plans SET project_id = $2, assigned_to_id = $3, created_by_id = $4,
updated_by_id = $5, kind = $6, description = $7, start_at = $8,
closed_at = $9, scheduled_end_at = $10, num_test_cases = $11,
num_failures = $12, is_complete = $13, is_locked = $14,
has_report = $15, created_at = $16, updated_at = $17
WHERE id = $1;

-- name: CloseTestPlan :execrows
UPDATE test_plans
SET is_complete = TRUE,
closed_at = $2,
updated_at = $2
WHERE id = $1;

-- name: GetTestRunStatesForPlan :many
SELECT result_state, is_closed FROM test_runs WHERE test_plan_id = $1;

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

-- name: InsertTestRunResult :one
INSERT INTO test_run_results (
    id, test_run_id, test_case_id, status, result, notes, executed_by, executed_at, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
RETURNING id; 

-- name: AssignTesterToProject :execrows
INSERT INTO project_testers (
    project_id, user_id, role, is_active, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, now(), now()
);
-- name: SearchProjectTesters :many
SELECT 
project_testers.*,
u.display_name AS tester_name
FROM project_testers
INNER JOIN users u On u.id = project_testers.user_id
WHERE project_testers.role ILIKE '%' || $1 || '%';

-- name: DeleteProjectTester :execrows
DELETE FROM project_testers WHERE id = $1;

-- name: GetTestersByID :one
SELECT
project_testers.*,
p.title as project,
u.display_name as tester_name,
u.last_login_at as tester_last_login_at
FROM project_testers
INNER JOIN users u ON u.id = project_testers.user_id
INNER JOIN projects p ON p.id = project_testers.project_id
WHERE project_id = $1;

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

-- name: CreateProjectModules :one
INSERT INTO modules(
    project_id, name, code, priority, type, description, created_at, updated_at
)VALUES($1, $2, $3, $4, $5, $6, now(), now()
)
RETURNING *;

-- name: GetOneModule :one
SELECT * FROM modules
WHERE id = $1;

-- name: GetAllModules :many
SELECT * FROM modules
ORDER BY created_at DESC;

-- name: UpdateProjectModule :exec
UPDATE modules SET name = $2, code = $3, priority = $4, type = $5, description = $6
WHERE id = $1;

-- name: DeleteProjectModule :execrows
DELETE FROM modules WHERE id = $1;

-- name: GetProjectModules :many
SELECT * FROM modules
WHERE project_id = $1;
-- name: CreatePage :one
INSERT INTO pages(parent_page_id, page_version, org_id, project_id, code, title, file_path, content, page_type, mime_type, has_embedded_media, external_content_url, notion_url, last_edited_by, created_by, created_at, updated_at, deleted_at
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now(), now()) RETURNING *;

-- name: GetPage :one
SELECT * FROM pages WHERE id = $1;

-- name: GetAllPages :many
SELECT * FROM pages
ORDER BY created_at DESC;

-- name: UpdatePage :exec
UPDATE pages SET parent_page_id = $2, page_version = $3, org_id = $4, project_id = $5, code = $6, title = $7, file_path = $8, content = $9, page_type = $10, mime_type = $11, has_embedded_media = $12, external_content_url = $13, notion_url = $14, last_edited_by = $15, created_by = $16
WHERE id = $1;

-- name: DeletePage :execrows
DELETE FROM pages WHERE id = $1;

-- name: GetProjectCount :one
SELECT COUNT(*) FROM projects;

-- name: GetTesterCount :one
SELECT COUNT(DISTINCT user_id) FROM project_testers WHERE is_active = true;

-- name: GetTesterCountByProject :one
SELECT COUNT(DISTINCT user_id) FROM project_testers WHERE project_id = $1 AND is_active = true;

-- name: GetTestCaseCount :one
SELECT COUNT(*) FROM test_cases;

-- name: GetTestPlanCount :one
SELECT COUNT(*) FROM test_plans;

-- name: GetTestPlanStatusRatio :one
SELECT
COUNT(*) FILTER (WHERE is_complete = true) AS closed,
COUNT(*) FILTER (WHERE is_complete = false) AS open
FROM test_plans;

-- name: GetRecentProjects :many
SELECT id, title AS name, updated_at
FROM projects
ORDER BY updated_at DESC
LIMIT 5;
