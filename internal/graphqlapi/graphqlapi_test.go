package graphqlapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

// ---- fakes: embed the interface and override only what the resolvers use ----

type nopLogger struct{}

func (nopLogger) Debug(loggedmodule.Name, string, ...any) {}
func (nopLogger) Info(loggedmodule.Name, string, ...any)  {}
func (nopLogger) Warn(loggedmodule.Name, string, ...any)  {}
func (nopLogger) Error(loggedmodule.Name, string, ...any) {}

var (
	caseID = uuid.MustParse("11111111-1111-1111-1111-111111111111")
	runID  = uuid.MustParse("22222222-2222-2222-2222-222222222222")
	now    = time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC)
)

var project = dbsqlc.Project{ID: 5, Title: "Qatarina", Code: "QAT", CreatedAt: now, UpdatedAt: now}

type fakeProjects struct{ services.ProjectService }

func (fakeProjects) FindAll(context.Context) ([]dbsqlc.Project, error) {
	return []dbsqlc.Project{project}, nil
}

func (fakeProjects) FindByID(_ context.Context, id int64) (*dbsqlc.Project, error) {
	if id != int64(project.ID) {
		return nil, sql.ErrNoRows
	}
	p := project
	return &p, nil
}

type fakeTestPlans struct{ services.TestPlanService }

func (fakeTestPlans) FindAllByProjectID(context.Context, int64) ([]schema.TestPlanResponseItem, error) {
	return []schema.TestPlanResponseItem{{ID: 7, ProjectID: 5, Kind: "general", PassedCount: 3}}, nil
}

func (fakeTestPlans) FindAllByTestPlanID(context.Context, int32) ([]dbsqlc.ListTestRunsByPlanRow, error) {
	return []dbsqlc.ListTestRunsByPlanRow{{
		ID: runID, ProjectID: 5, TestCaseID: caseID, ResultState: dbsqlc.TestRunStatePassed,
		TestPlanID: sql.NullInt32{Int32: 7, Valid: true}, TestedOn: now,
	}}, nil
}

type fakeTestCases struct{ services.TestCaseService }

func (fakeTestCases) FindByID(_ context.Context, id string) (*dbsqlc.GetTestCaseWithParentRow, error) {
	if id != caseID.String() {
		return nil, sql.ErrNoRows
	}
	return &dbsqlc.GetTestCaseWithParentRow{ID: caseID, Code: "TC-1", Title: "Login works",
		ProjectID: sql.NullInt32{Int32: 5, Valid: true}}, nil
}

type fakeTestRuns struct{ services.TestRunService }
type fakeTesters struct{ services.TesterService }

func (fakeTesters) FindByProjectID(context.Context, int64) ([]schema.Tester, error) {
	return []schema.Tester{{UserID: 9, ProjectID: 5, Name: "Tess", Role: "tester"}}, nil
}

func newTestApp(t *testing.T) *fiber.App {
	t.Helper()
	s, err := NewSchema(Services{
		Projects: fakeProjects{}, TestPlans: fakeTestPlans{}, TestCases: fakeTestCases{},
		TestRuns: fakeTestRuns{}, Testers: fakeTesters{},
	}, nopLogger{})
	require.NoError(t, err, "schema must parse and every field must have a resolver")

	app := fiber.New()
	app.Post("/graphql", Handler(s))
	return app
}

func post(t *testing.T, app *fiber.App, body string) (int, map[string]any) {
	t.Helper()
	req := httptest.NewRequest("POST", "/graphql", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	raw, _ := io.ReadAll(resp.Body)
	var out map[string]any
	require.NoError(t, json.Unmarshal(raw, &out), string(raw))
	return resp.StatusCode, out
}

func TestNestedProjectQuery(t *testing.T) {
	app := newTestApp(t)
	code, out := post(t, app, `{"query":"{ project(id: \"5\") { title testPlans { id passedCount testRuns { resultState testCase { code title } } } testers { name role } } }"}`)

	require.Equal(t, 200, code)
	require.Nil(t, out["errors"])

	p := out["data"].(map[string]any)["project"].(map[string]any)
	assert.Equal(t, "Qatarina", p["title"])

	plan := p["testPlans"].([]any)[0].(map[string]any)
	assert.Equal(t, "7", plan["id"])
	assert.EqualValues(t, 3, plan["passedCount"])

	run := plan["testRuns"].([]any)[0].(map[string]any)
	assert.Equal(t, "passed", run["resultState"])
	assert.Equal(t, "TC-1", run["testCase"].(map[string]any)["code"])

	tester := p["testers"].([]any)[0].(map[string]any)
	assert.Equal(t, "Tess", tester["name"])
}

func TestProjectNotFoundReturnsNull(t *testing.T) {
	app := newTestApp(t)
	_, out := post(t, app, `{"query":"{ project(id: \"999\") { title } }"}`)
	require.Nil(t, out["errors"])
	assert.Nil(t, out["data"].(map[string]any)["project"])
}

func TestInvalidIDReturnsError(t *testing.T) {
	app := newTestApp(t)
	_, out := post(t, app, `{"query":"{ testCase(id: \"not-a-uuid\") { title } }"}`)
	require.NotNil(t, out["errors"])
}

func TestBadRequestBody(t *testing.T) {
	app := newTestApp(t)
	code, _ := post(t, app, `{"query":""}`)
	assert.Equal(t, 400, code)
}
