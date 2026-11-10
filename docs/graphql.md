# GraphQL API

qatarina exposes a read-only GraphQL API at `POST /graphql`, alongside the REST
API under `/v1`. It lets you fetch projects, test plans, test cases, test runs
and testers, including their relationships, in a single request.

- The REST API is unchanged. GraphQL is an additional option, not a replacement.
- Queries only. Creating, updating and deleting data stays on the REST API.
- The schema lives in [`internal/graphqlapi/schema.graphql`](../internal/graphqlapi/schema.graphql).
- Resolvers call the same services as the REST handlers, so results match.

## Authentication

`/graphql` uses the same JWT authentication as the REST API. Get a token from
`POST /v1/auth/login` and send it as `Authorization: Bearer <token>`.

## Example

```bash
TOKEN=$(curl -s -X POST http://localhost:4597/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"..."}' | jq -r .token)

curl -s -X POST http://localhost:4597/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ project(id: \"1\") { title testPlans { id kind passedCount failedCount testRuns { resultState testCase { code title } } } testers { name role } } }"}'
```

The request body follows the standard GraphQL-over-HTTP shape:

```json
{ "query": "...", "operationName": "optional", "variables": { "optional": "..." } }
```

## Available queries

| Query                                    | Returns                                    |
| ---------------------------------------- | ------------------------------------------ |
| `projects`, `project(id)`, `searchProjects(keyword)` | Projects                       |
| `testPlans(projectId?)`, `testPlan(id)`  | Test plans, optionally for one project     |
| `testCases(projectId?)`, `testCase(id)`  | Test cases, optionally for one project     |
| `testRuns(projectId?)`, `testRun(id)`    | Test runs, optionally for one project      |
| `testers(projectId?)`, `tester(userId)`  | Testers, optionally for one project        |

Nested fields such as `Project.testPlans`, `TestPlan.testRuns`, `TestRun.testCase`
and `Tester.project` let you walk the data model in one query. Lookups by ID
return `null` when the record doesn't exist.

## Limits

To protect the server, queries are limited to a nesting depth of 10 and a
length of 20,000 characters. Nested fields are resolved with one service call
per parent object, so very wide nested queries (for example every test run of
every plan of every project) can be slow. Batching with dataloaders is a
possible follow-up if that becomes a problem.
