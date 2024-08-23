# Whats what of QATARINA

This document is a "living" but temporary document about some ideas about the project, particularly
to help developers understand some of the goals. Some of the notes here will be consolidated into
documentation in other files, or other places. We will see.

## Conceptual Flow as JSON API calls

0. Login

`POST /auth/login`

```json
{
	"email": "zikani2@example.com",
	"password": "zikani123"
}
```

1. Create a Project

`POST /v1/projects`

```json
{
	"name": "Project",
	"version": "test",
	"description": "Some description",
	"project_owner_id": 3,
	"github_url": "https://github.com/qatarina",
	"website_url": "https://example.com"
}
```

2. Add Test Cases (in bulk)

`POST /v1/test-cases/bulk`

```json
{
	"project_id": 19,
	"test_cases": [
		{
			"kind": "adhoc",
			"code": "UC-001",
			"feature_or_module": "Login",
			"title": "User can login to the platform",
			"description": "Test that a user can login to the platform",
			"is_draft": true,
			"tags": []
		},
		{
			"kind": "adhoc",
			"code": "UC-002",
			"feature_or_module": "Login as Admin",
			"title": "User can login as an admin to the platform",
			"description": "Test that a user can login to the platform as an amdin",
			"is_draft": true,
			"tags": ["admin-panel", "authentication", "security"]
		}
	]
}
```

3. Create a Test Plan and Assign Test Cases

`POST /v1/test-plans`

```json
{
	"project_id": 19,
	"assigned_to_id": 3,
	"created_by_id": 3,
	"updated_by_id": 3,
	"kind": "general",
	"description": "Testing the basics of the system release v1.0.0",
	"start_at": "2024-01-02T10:04",
	"closed_at": null,
	"scheduled_end_at": "2024-01-02T10:04",
	"planned_tests": [
		{
			"test_case_id": "0191768b-1689-7dea-b3c5-62fe150284f8",
			"user_ids": [ 3 ]
		}
	]
}
```
**Add more tests to the plan**

`POST /v1/test-plans/4/test-cases`

```json
{
	"project_id": 19,
	"test_plan_id": 4,
	"planned_tests": [
		{
			"test_case_id": "0191768b-1689-7dea-b3c5-62fe150284f8",
			"user_ids": [ 3, 4 ]
		}
	]
}
```


4. Each Tester can then record result of their test runs.

`POST /v1/test-runs/bulk/commit`

```json
{
	"test_results": [
		{
			"test_run_id": "01917a6f-d250-78d1-8f61-5d301921fc28",
			"notes": "The test failed",
			"is_closed": true,
			"tested_on": "2024-01-01",
			"actual_result": "Everything failed!",
			"result_state": "failed"
		},
		{
			"test_run_id": "01917a6f-d250-78d1-8f61-5d301921fc28",
			"notes": "The test failed",
			"is_closed": true,
			"tested_on": "2024-01-01",
			"actual_result": "Everything failed!",
			"result_state": "failed"
		}
	]
}
```
