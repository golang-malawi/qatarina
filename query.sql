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

-- name: CreateUser :execrows
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
);

-- name: ListProjects :many
SELECT * FROM projects ORDER BY created_at DESC;

-- name: GetProject :one
SELECT * FROM projects WHERE id = $1;

-- name: CreateProject :execrows
INSERT INTO projects (
    title, description, version, is_active, is_public, website_url,
    github_url, trello_url, jira_url, monday_url,
    owner_user_id, created_at, updated_at, deleted_at
)
VALUES(
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14
);

-- name: ListTestCases :many
SELECT * FROM test_cases ORDER BY created_at DESC;

-- name: GetTestCase :one
SELECT * FROM test_cases WHERE id = $1;

-- name: ListTestCasesByProject :many
SELECT * FROM test_cases
INNER JOIN test_plans p ON p.test_case_id = test_cases.id
WHERE p.project_id = $1;

-- name: ListTestCasesByCreator :many
SELECT * FROM test_cases WHERE created_by_id = $1;

-- name: IsTestCaseLinkedToProject :one
SELECT EXISTS(
    SELECT * FROM test_cases
    INNER JOIN test_plans p ON p.test_case_id = test_cases.id
    WHERE p.project_id = $1
);

-- name: CountTestCasesNotLinkedToProject :one
SELECT COUNT(*) FROM test_cases
RIGHT OUTER JOIN test_plans p ON p.test_case_id = test_cases.id
WHERE p.project_id IS NULL;

-- name: CreateTestCase :execrows
INSERT INTO test_cases (
    id, kind, code, feature_or_module, title, description, parent_test_case_id,
    is_draft, tags, created_by_id, created_at, updated_at
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12
);
