# TestLink → Qatarina Import Gap Analysis

**Date:** 2026-10-04  
**Branch:** exploration/testlink-importer  
**Scope:** What is missing or incompatible in Qatarina that would block or degrade a faithful import of data from a TestLink instance.

---

## Summary

TestLink's data model is substantially richer than Qatarina's current schema in several areas. A naive CSV/XLSX-based import would silently discard the majority of TestLink's structured data. The gaps fall into two categories: **blocking** (data that has nowhere to go) and **lossy** (data that can only be partially mapped).

---

## 1. Test Case Steps — Blocking

TestLink stores test cases as versioned records where each version contains ordered **steps**, each with:
- ✅ `step_number`
- ✅ `actions` (HTML)
- ⌛️ `expected_results` (HTML)
- ✅ `execution_type` (manual / automated)

Tables: `tcsteps`, `execution_tcsteps`  
XML field: `<steps><step>…</step></steps>`

**Qatarina gap:** No `steps` concept exists. The `test_cases` table has a single `description` field. Steps would have to be concatenated into `description`, losing all structure, ordering, per-step expected results, and per-step execution results.

**Previous recommendation:** A `test_case_steps` table linked to `test_cases` with at minimum: `step_number`, `action`, `expected_result`, `execution_type`.

**Decision Notes**
- Decision is that if someone wants to add steps to a test case, they should use Markdown checkboxes and UI to recommend that. But we will not add a specific field for the test steps.
- execution_type -> we may not be able to support this as a field per se - but we have a field to store automation script (.e.g playwright or something else)
- Expected result field to be added to the test_cases table, and can also use markdown and checkboxes...

**Import Notes**: the fields from test_link would be imported into the description field, we are okay with that.

---

## 2. Test Case Versioning — Blocking

TestLink's central entity is `tcversions`, not `testcases`. Every change to a test case produces a new version. Executions reference a specific `tcversion_id`, not the test case itself.

Tables: `tcversions` (version, summary, preconditions, importance, author_id, execution_type, active)  
Views: `latest_tcase_version_number`, `latest_tcase_version_id`

**Qatarina gap:** `test_cases` has no versioning. `updated_at` is the only change signal. Importing from TestLink means choosing one version (typically the latest active), discarding all history. There is no way to preserve "which version was used when" for historical executions.

**Previous recommendation:** Either a `test_case_versions` table, or at minimum an `external_version` field on `test_cases` to record which TestLink version was imported.

**Import Notes**: store the version information in the description field.

**Design Notes**:
- We will consider adding the test_case_versions (fields to be included to be discussed)
- test_runs can included optional (nullable) `test_case_version_id`
- Inbox for tester should fetch the latest test case version
- Older / historical test_runs should show the version of the test cases they were run with with the given version if the version id is specified in the test case
- UI -> we can have the option to create a new version, 
- Versioning should be an opt-in feature (consider a feature flag)

---

## 3. Test Suites — Blocking

TestLink organises test cases inside **test suites**, which are hierarchical (a suite can contain sub-suites). This is the primary organisational structure inside a project.

Table: `testsuites` (id FK→nodes_hierarchy, details); hierarchy via `nodes_hierarchy`

**Qatarina gap:** Qatarina has `modules` (name, code, priority, type, description) which are flat, not hierarchical. There is no parent-child relationship between modules, and `test_cases` link to `feature_or_module` as a plain text field, not a foreign key to modules. A multi-level suite tree cannot be faithfully imported.

**What needs to be added:** Either add `parent_module_id` to `modules` to allow nesting, or introduce a dedicated `test_suites` table. The `feature_or_module` field on `test_cases` should become a FK to a proper module/suite record.

---

## 4. Preconditions — Lossy 

TestLink stores `preconditions` as a distinct HTML field on `tcversions`, separate from `summary`.

**Qatarina gap:** Only `description` exists on `test_cases`. Preconditions would have to be concatenated into `description`, losing their semantic distinction.

**Previous recommendation:** A `preconditions` text/HTML field on `test_cases`.

**Design Notes**:
- Needs to be added to test_cases as a text field that accepts markdown.
  
---

## 5. Importance / Priority — Blocking

TestLink has an `importance` field (smallint, default 2 = MEDIUM; values: 1=LOW, 2=MEDIUM, 3=HIGH) on `tcversions`. Test plans also carry `urgency` per linked test case (`testplan_tcversions.urgency`).

**Qatarina gap:** No priority or importance field exists on `test_cases` or `test_plans`/`test_plan_cases`. There is no equivalent to urgency on plan-case assignments.

**Previous recommendation:** An `importance` or `priority` enum/int on `test_cases`, and an `urgency` field on the `test_plan_cases` junction table.
**Design Notes:** 
- A a `priority` field enum on `test_cases`
- Urgency on test_runs to be reviewed and look at linking to the time-aspect of e.g. a test plans

---

## 6. Custom Fields — Blocking

TestLink has a full custom fields system:
- `custom_fields` (name, label, type, possible_values, validation regex, length constraints)
- Per-project assignment (`cfield_testprojects`) with required/show/enable flags per context
- Values stored at design time (`cfield_design_values`) and execution time (`cfield_execution_values`)
- Four display contexts: design, execution, testplan_design, build_design

**Qatarina gap:** No custom field infrastructure exists. There is a `testcase_template` field on projects (text), but no mechanism to define, store, or query per-project custom field values.

**What needs to be added:** A custom fields system (field definitions table + per-entity value storage), or at minimum a `custom_fields` JSONB column on `test_cases` and `test_runs` to store arbitrary key-value data from TestLink without losing it.

---

## 7. Keywords — Lossy

TestLink keywords are project-scoped named entities with notes, assigned to test cases via `testcase_keywords` and to other objects via `object_keywords`.

**Qatarina gap:** `test_cases.tags` is a `varchar(100)[]` array — a flat list of strings per test case. Keywords with notes, project scope, and shared reuse cannot be modelled. Tags and keywords are functionally similar but structurally different (no keyword entity, no project scope, no notes).

**What needs to be added:** Either a `keywords` table (id, project_id, name, notes) with a junction table to `test_cases`, or at minimum document that keyword names will be imported as plain tags with notes discarded.

---

## 8. Builds — Blocking

TestLink's execution model is anchored to **builds** — specific software releases being tested under a test plan. Executions reference a `build_id`. Builds carry: name, notes, release_date, commit_id, tag, branch, release_candidate, active/open flags.

Table: `builds` (linked to `testplans`)

**Qatarina gap:** No build concept exists. Test runs reference test plans and environments but not a named software build/release. Execution history per build cannot be imported.

**What needs to be added:** A `builds` table linked to `test_plans` (name, notes, release_date, commit_id, tag, branch), with `test_runs` referencing `build_id`.

---

## 9. Platforms — Lossy

TestLink supports **platforms** (e.g. Firefox, Chrome, Windows, iOS) as first-class entities per project. The same test case can be executed multiple times in a single test plan, once per platform. Executions record `platform_id`.

Tables: `platforms`, `testplan_platforms`, `testcase_platforms`

**Qatarina gap:** Qatarina has `environments` (name, description, base_url) which partially overlaps with platforms conceptually, but:
- `test_runs` has a single `environment_id`, not a platform
- A test plan cannot run the same test case against multiple environments (there is no (test_plan_id, test_case_id, environment_id) composite key)
- The `test_plan_cases` PK is `(test_plan_id, test_case_id, assigned_to_id)`, not per-platform

**What needs to be added:** Multi-platform execution support — either extend `test_plan_cases` to include platform/environment as part of the composite key, or add a dedicated `platforms` table and update execution records accordingly.

---

## 10. Requirements Management — Blocking

TestLink has a full requirements subsystem:
- Hierarchical `req_specs` containing `requirements` with `req_versions`
- `req_coverage` links requirements to specific test case versions
- Revision history for requirements and specs
- `req_monitor` for user subscriptions
- Expected coverage counts per requirement

Tables: `req_specs`, `requirements`, `req_versions`, `req_coverage`, `req_relations`, `req_revisions`, `req_specs_revisions`, `req_monitor`

**Qatarina gap:** No requirements tables exist. Requirements and their coverage cannot be imported at all.

**What needs to be added:** At minimum, `requirements` (id, project_id, doc_id, title, description, status) and a `requirement_coverage` junction table linking requirements to test cases. Full versioning and revision history would require more.

---

## 11. Attachments — Blocking

TestLink has a universal `attachments` table (fk_id, fk_table, title, description, file_name, file_path, file_size, file_type, content LONGBLOB, compression_type) that can attach files to any entity.

**Qatarina gap:** No dedicated attachments table exists. `test_runs_comments` has a `media_urls` JSONB field. File attachments on test cases, test suites, requirements, or execution records cannot be imported.

**What needs to be added:** An `attachments` table (entity_type, entity_id, filename, file_path, file_size, mime_type, uploaded_by, created_at) to store or reference imported attachments.

---

## 12. Per-Step Execution Results — Blocking

TestLink records pass/fail/blocked status per step during execution via `execution_tcsteps` (execution_id, tcstep_id, notes, status). There is also a WIP table (`execution_tcsteps_wip`) for in-progress runs.

**Qatarina gap:** `test_run_results` records a single status + result per run. There is no per-step execution record. Granular step-level results from TestLink executions are unimportable.

**What depends on:** Resolving gap #1 (test case steps must exist first).

---

## 13. Issue/Bug Tracker Integration — Lossy

TestLink links bugs to specific execution steps via `execution_bugs` (execution_id, bug_id, tcstep_id) and stores issue tracker configurations in `issuetrackers` / `testproject_issuetracker`.

**Qatarina gap:** `test_runs.external_issue_id` holds a single text reference per run. Step-level bug links and tracker configuration are lost. Multiple bugs per execution cannot be stored.

**What needs to be added:** A `test_run_bugs` table (test_run_id, step_id nullable, bug_id, tracker_url) to preserve multi-bug associations from TestLink executions.

---

## 14. Roles and Rights — Lossy

TestLink has:
- Global roles with 36+ granular rights (`roles`, `rights`, `role_rights`)
- Per-project role overrides (`user_testproject_roles`)
- Per-testplan role overrides (`user_testplan_roles`)

**Qatarina gap:** `project_testers.role` is a plain text enum: `lead`, `engineer`, `client`, `bot`, `ai_agent`. No per-testplan roles. No granular rights. TestLink's fine-grained RBAC data cannot be preserved, only approximately mapped to qatarina roles.

---

## 15. Execution Duration — Lossy

TestLink records `execution_duration` (decimal 6,2 — minutes) on `executions`. Build-level execution time tracking is also supported.

**Qatarina gap:** No duration field on `test_runs` or `test_run_results`.

**What needs to be added:** A `duration_minutes` (or `duration_seconds`) numeric column on `test_runs`.

---

## 16. Milestones — Blocking

TestLink has `milestones` per test plan (name, target_date, start_date, and threshold counters a/b/c).

**Qatarina gap:** No milestone concept. `test_plans.scheduled_end_at` is the closest, but a plan can only have one end date — not multiple milestones.

---

## 17. Test Case Relations — Lossy

TestLink supports `testcase_relations` (source_id, destination_id, link_status, relation_type) for arbitrary typed relationships between test cases.

**Qatarina gap:** `test_cases.parent_test_case_id` models a single-parent tree. Peer relationships (e.g. "depends on", "related to", "duplicates") between test cases cannot be expressed.

---

## 18. Import Format — Blocking

TestLink's canonical import/export format is **XML** (testspec, results, requirements, keywords, platforms, custom_fields XML schemas — all with CDATA sections for HTML content).

**Qatarina gap:** The existing import at `POST /v1/test-cases/import-file` accepts only CSV and XLSX. There is no XML parser. A TestLink export file cannot be fed to Qatarina's import endpoint at all.  
Source: `internal/services/testcase_import.go`, `internal/api/v1/testcase_import.go`

**What needs to be added:** An XML import handler that parses TestLink's testspec XML format, including nested testsuites, test cases, steps, keywords, and custom fields.

---

## 19. External ID Preservation — Lossy

TestLink uses `tc_external_id` (e.g. `PRJ-42`) and `internalid` as stable identifiers across versions. These are critical for re-import deduplication and for cross-referencing execution results XML.

**Qatarina gap:** `test_cases.code` could serve this purpose, but:
- It is generated by qatarina's own sequencing (`test_case_sequences`)
- There is no dedicated `external_id` field for preserving the TestLink source identifier
- Re-imports cannot detect duplicates by external ID

**What needs to be added:** An `external_id` (or `testlink_id`) field on `test_cases` to preserve the source system's identifier and support idempotent re-imports.

---

## 20. Test Case Execution Type — Lossy

TestLink marks each test case version with `execution_type` (1=manual, 2=automated) at the `tcversions` level, and per step at `tcsteps` level.

**Qatarina gap:** Qatarina has `runner` and `script_path` on `test_cases` for automation, but no explicit `execution_type` enum. Manual vs automated distinction from TestLink data is not cleanly representable.

---

## Gap Summary Table

| # | Gap | Severity | Schema Change Required |
|---|-----|----------|----------------------|
| 1 | Test case steps | Blocking | New `test_case_steps` table |
| 2 | Test case versioning | Blocking | New `test_case_versions` table or `external_version` field |
| 3 | Test suites (hierarchy) | Blocking | Hierarchical `modules` or new `test_suites` table |
| 4 | Preconditions | Lossy | Add `preconditions` field to `test_cases` |
| 5 | Importance / priority | Blocking | Add `importance` to `test_cases`, `urgency` to `test_plan_cases` |
| 6 | Custom fields | Blocking | New custom field tables or JSONB column |
| 7 | Keywords (scoped, with notes) | Lossy | New `keywords` table + junction |
| 8 | Builds | Blocking | New `builds` table linked to `test_plans` |
| 9 | Platforms (multi-platform exec) | Lossy | Extend `test_plan_cases` PK or add `platforms` table |
| 10 | Requirements & coverage | Blocking | New requirements subsystem |
| 11 | Attachments | Blocking | New `attachments` table |
| 12 | Per-step execution results | Blocking | Depends on #1; add `test_run_step_results` |
| 13 | Bug links per execution/step | Lossy | New `test_run_bugs` table |
| 14 | Granular RBAC | Lossy | Accept role approximation or add rights system |
| 15 | Execution duration | Lossy | Add `duration` field to `test_runs` |
| 16 | Milestones | Blocking | New `milestones` table on `test_plans` |
| 17 | Test case relations | Lossy | New `test_case_relations` table |
| 18 | XML import format | Blocking | New XML importer service + endpoint |
| 19 | External ID preservation | Lossy | Add `external_id` field to `test_cases` |
| 20 | Execution type (manual/auto) | Lossy | Add `execution_type` enum to `test_cases` |

**Blocking** = data is completely unimportable without schema changes.  
**Lossy** = data can be partially imported but with information loss.
