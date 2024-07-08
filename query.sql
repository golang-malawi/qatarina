-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: ListProjects :many
SELECT * FROM projects ORDER BY created_at DESC;

-- name: GetProject :one
SELECT * FROM projects WHERE id = $1;

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
