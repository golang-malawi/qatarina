package graphqlapi

import (
	"context"
	"database/sql"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/graph-gophers/graphql-go"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
)

// ---- small conversion helpers -----------------------------------------------

func intID[T ~int32 | ~int64](v T) graphql.ID {
	return graphql.ID(strconv.FormatInt(int64(v), 10))
}

func nullIntID(v sql.NullInt32) *graphql.ID {
	if !v.Valid {
		return nil
	}
	id := intID(v.Int32)
	return &id
}

func nullStr(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	return &v.String
}

func gqlTime(t time.Time) graphql.Time {
	return graphql.Time{Time: t}
}

func nullTime(v sql.NullTime) *graphql.Time {
	if !v.Valid {
		return nil
	}
	t := gqlTime(v.Time)
	return &t
}

// ---- Project ----------------------------------------------------------------

type projectResolver struct {
	root *Resolver
	p    dbsqlc.Project
}

func (r *projectResolver) ID() graphql.ID          { return intID(r.p.ID) }
func (r *projectResolver) Title() string           { return r.p.Title }
func (r *projectResolver) Description() string     { return r.p.Description }
func (r *projectResolver) Code() string            { return r.p.Code }
func (r *projectResolver) Version() *string        { return nullStr(r.p.Version) }
func (r *projectResolver) IsActive() bool          { return r.p.IsActive.Valid && r.p.IsActive.Bool }
func (r *projectResolver) IsPublic() bool          { return r.p.IsPublic.Valid && r.p.IsPublic.Bool }
func (r *projectResolver) WebsiteURL() *string     { return nullStr(r.p.WebsiteUrl) }
func (r *projectResolver) GithubURL() *string      { return nullStr(r.p.GithubUrl) }
func (r *projectResolver) OwnerUserID() graphql.ID { return intID(r.p.OwnerUserID) }
func (r *projectResolver) ParentProjectID() *graphql.ID {
	return nullIntID(r.p.ParentProjectID)
}
func (r *projectResolver) AutomatedTestingEnabled() bool { return r.p.AutomatedTestingEnabled }
func (r *projectResolver) CreatedAt() graphql.Time       { return gqlTime(r.p.CreatedAt) }
func (r *projectResolver) UpdatedAt() graphql.Time       { return gqlTime(r.p.UpdatedAt) }

func (r *projectResolver) TestPlans(ctx context.Context) ([]*testPlanResolver, error) {
	return r.root.testPlansByProject(ctx, int64(r.p.ID))
}

func (r *projectResolver) TestCases(ctx context.Context) ([]*testCaseResolver, error) {
	return r.root.testCasesByProject(ctx, int64(r.p.ID))
}

func (r *projectResolver) TestRuns(ctx context.Context) ([]*testRunResolver, error) {
	return r.root.testRunsByProject(ctx, int64(r.p.ID))
}

func (r *projectResolver) Testers(ctx context.Context) ([]*testerResolver, error) {
	return r.root.testersByProject(ctx, int64(r.p.ID))
}

// ---- TestPlan ---------------------------------------------------------------

type testPlanResolver struct {
	root *Resolver
	tp   schema.TestPlanResponseItem
}

func wrapTestPlans(root *Resolver, plans []schema.TestPlanResponseItem) []*testPlanResolver {
	out := make([]*testPlanResolver, len(plans))
	for i := range plans {
		out[i] = &testPlanResolver{root: root, tp: plans[i]}
	}
	return out
}

func (r *testPlanResolver) ID() graphql.ID        { return intID(r.tp.ID) }
func (r *testPlanResolver) ProjectID() graphql.ID { return intID(r.tp.ProjectID) }
func (r *testPlanResolver) Kind() string          { return r.tp.Kind }
func (r *testPlanResolver) Description() string   { return r.tp.Description }
func (r *testPlanResolver) StartAt() string       { return r.tp.StartAt }
func (r *testPlanResolver) ClosedAt() string      { return r.tp.ClosedAt }
func (r *testPlanResolver) ScheduledEndAt() string {
	return r.tp.ScheduledEndAt
}
func (r *testPlanResolver) IsComplete() bool       { return r.tp.IsComplete }
func (r *testPlanResolver) IsLocked() bool         { return r.tp.IsLocked }
func (r *testPlanResolver) NumTestCases() int32    { return r.tp.NumTestCases }
func (r *testPlanResolver) PassedCount() int32     { return int32(r.tp.PassedCount) }
func (r *testPlanResolver) FailedCount() int32     { return int32(r.tp.FailedCount) }
func (r *testPlanResolver) PendingCount() int32    { return int32(r.tp.PendingCount) }
func (r *testPlanResolver) AssignedTesters() int32 { return int32(r.tp.AssignedTesters) }
func (r *testPlanResolver) CreatedAt() string      { return r.tp.CreatedAt }
func (r *testPlanResolver) UpdatedAt() string      { return r.tp.UpdatedAt }

func (r *testPlanResolver) Project(ctx context.Context) (*projectResolver, error) {
	return r.root.projectByID(ctx, int64(r.tp.ProjectID))
}

func (r *testPlanResolver) TestCases(ctx context.Context) ([]*testPlanTestCaseResolver, error) {
	items, err := r.root.svc.TestCases.FindAllByTestPlanID(ctx, r.tp.ID)
	if err != nil {
		if isNotFound(err) {
			return []*testPlanTestCaseResolver{}, nil
		}
		return nil, r.root.fail("testPlan.testCases", err)
	}
	out := make([]*testPlanTestCaseResolver, len(items))
	for i := range items {
		out[i] = &testPlanTestCaseResolver{root: r.root, item: items[i]}
	}
	return out, nil
}

func (r *testPlanResolver) TestRuns(ctx context.Context) ([]*testRunResolver, error) {
	rows, err := r.root.svc.TestPlans.FindAllByTestPlanID(ctx, int32(r.tp.ID))
	if err != nil {
		if isNotFound(err) {
			return []*testRunResolver{}, nil
		}
		return nil, r.root.fail("testPlan.testRuns", err)
	}
	out := make([]*testRunResolver, len(rows))
	for i := range rows {
		out[i] = &testRunResolver{root: r.root, tr: testRunFromPlanRow(&rows[i])}
	}
	return out, nil
}

// ---- TestPlanTestCase -------------------------------------------------------

type testPlanTestCaseResolver struct {
	root *Resolver
	item schema.TestCaseResponseItem
}

func (r *testPlanTestCaseResolver) ID() graphql.ID   { return graphql.ID(r.item.ID) }
func (r *testPlanTestCaseResolver) Code() string     { return r.item.Code }
func (r *testPlanTestCaseResolver) Title() string    { return r.item.Title }
func (r *testPlanTestCaseResolver) Priority() string { return r.item.Priority }
func (r *testPlanTestCaseResolver) Urgency() string  { return r.item.Urgency }

func (r *testPlanTestCaseResolver) AssignedTesterIDs() []graphql.ID {
	out := make([]graphql.ID, len(r.item.AssignedTesterIDs))
	for i, id := range r.item.AssignedTesterIDs {
		out[i] = intID(id)
	}
	return out
}

func (r *testPlanTestCaseResolver) TestCase(ctx context.Context) (*testCaseResolver, error) {
	if _, err := uuid.Parse(r.item.ID); err != nil {
		return nil, nil
	}
	return r.root.testCaseByID(ctx, r.item.ID)
}

// ---- TestCase ---------------------------------------------------------------

// testCaseData is the common shape of the two test case structs the
// services return (list queries vs. single lookups).
type testCaseData struct {
	ID              uuid.UUID
	Code            string
	Kind            string
	Title           string
	Description     string
	FeatureOrModule sql.NullString
	Preconditions   sql.NullString
	Priority        string
	IsDraft         sql.NullBool
	Tags            []string
	ProjectID       sql.NullInt32
	CreatedByID     int32
	CreatedAt       sql.NullTime
	UpdatedAt       sql.NullTime
}

func testCaseFromModel(tc *dbsqlc.TestCase) testCaseData {
	return testCaseData{
		ID: tc.ID, Code: tc.Code, Kind: string(tc.Kind), Title: tc.Title,
		Description: tc.Description, FeatureOrModule: tc.FeatureOrModule,
		Preconditions: tc.Preconditions, Priority: string(tc.Priority),
		IsDraft: tc.IsDraft, Tags: tc.Tags, ProjectID: tc.ProjectID,
		CreatedByID: tc.CreatedByID, CreatedAt: tc.CreatedAt, UpdatedAt: tc.UpdatedAt,
	}
}

func testCaseFromRow(tc *dbsqlc.GetTestCaseWithParentRow) testCaseData {
	return testCaseData{
		ID: tc.ID, Code: tc.Code, Kind: string(tc.Kind), Title: tc.Title,
		Description: tc.Description, FeatureOrModule: tc.FeatureOrModule,
		Preconditions: tc.Preconditions, Priority: string(tc.Priority),
		IsDraft: tc.IsDraft, Tags: tc.Tags, ProjectID: tc.ProjectID,
		CreatedByID: tc.CreatedByID, CreatedAt: tc.CreatedAt, UpdatedAt: tc.UpdatedAt,
	}
}

func wrapTestCases(root *Resolver, cases []dbsqlc.TestCase) []*testCaseResolver {
	out := make([]*testCaseResolver, len(cases))
	for i := range cases {
		out[i] = &testCaseResolver{root: root, tc: testCaseFromModel(&cases[i])}
	}
	return out
}

type testCaseResolver struct {
	root *Resolver
	tc   testCaseData
}

func (r *testCaseResolver) ID() graphql.ID           { return graphql.ID(r.tc.ID.String()) }
func (r *testCaseResolver) Code() string             { return r.tc.Code }
func (r *testCaseResolver) Kind() string             { return r.tc.Kind }
func (r *testCaseResolver) Title() string            { return r.tc.Title }
func (r *testCaseResolver) Description() string      { return r.tc.Description }
func (r *testCaseResolver) FeatureOrModule() *string { return nullStr(r.tc.FeatureOrModule) }
func (r *testCaseResolver) Preconditions() *string   { return nullStr(r.tc.Preconditions) }
func (r *testCaseResolver) Priority() string         { return r.tc.Priority }
func (r *testCaseResolver) IsDraft() bool            { return r.tc.IsDraft.Valid && r.tc.IsDraft.Bool }
func (r *testCaseResolver) ProjectID() *graphql.ID   { return nullIntID(r.tc.ProjectID) }
func (r *testCaseResolver) CreatedByID() graphql.ID  { return intID(r.tc.CreatedByID) }
func (r *testCaseResolver) CreatedAt() *graphql.Time { return nullTime(r.tc.CreatedAt) }
func (r *testCaseResolver) UpdatedAt() *graphql.Time { return nullTime(r.tc.UpdatedAt) }

func (r *testCaseResolver) Tags() []string {
	if r.tc.Tags == nil {
		return []string{}
	}
	return r.tc.Tags
}

func (r *testCaseResolver) Project(ctx context.Context) (*projectResolver, error) {
	if !r.tc.ProjectID.Valid {
		return nil, nil
	}
	return r.root.projectByID(ctx, int64(r.tc.ProjectID.Int32))
}

// ---- TestRun ----------------------------------------------------------------

// testRunData is the common shape of the two test run structs the services
// return (dbsqlc.TestRun vs. the per-plan listing row).
type testRunData struct {
	ID             uuid.UUID
	Code           string
	ProjectID      int32
	TestPlanID     sql.NullInt32
	TestCaseID     uuid.UUID
	ResultState    string
	IsClosed       sql.NullBool
	Notes          string
	ActualResult   sql.NullString
	ExpectedResult sql.NullString
	OwnerID        int32
	TestedByID     sql.NullInt32
	AssignedToID   sql.NullInt32
	EnvironmentID  sql.NullInt32
	TestedOn       time.Time
	CreatedAt      sql.NullTime
	UpdatedAt      sql.NullTime
}

func testRunFromModel(tr *dbsqlc.TestRun) testRunData {
	return testRunData{
		ID: tr.ID, Code: tr.Code, ProjectID: tr.ProjectID, TestPlanID: tr.TestPlanID,
		TestCaseID: tr.TestCaseID, ResultState: string(tr.ResultState), IsClosed: tr.IsClosed,
		Notes: tr.Notes, ActualResult: tr.ActualResult, ExpectedResult: tr.ExpectedResult,
		OwnerID: tr.OwnerID, TestedByID: tr.TestedByID, AssignedToID: tr.AssignedToID,
		EnvironmentID: tr.EnvironmentID, TestedOn: tr.TestedOn,
		CreatedAt: tr.CreatedAt, UpdatedAt: tr.UpdatedAt,
	}
}

func testRunFromPlanRow(tr *dbsqlc.ListTestRunsByPlanRow) testRunData {
	return testRunData{
		ID: tr.ID, Code: tr.Code, ProjectID: tr.ProjectID, TestPlanID: tr.TestPlanID,
		TestCaseID: tr.TestCaseID, ResultState: string(tr.ResultState), IsClosed: tr.IsClosed,
		Notes: tr.Notes, ActualResult: tr.ActualResult, ExpectedResult: tr.ExpectedResult,
		OwnerID: tr.OwnerID, TestedByID: tr.TestedByID, AssignedToID: tr.AssignedToID,
		EnvironmentID: tr.EnvironmentID, TestedOn: tr.TestedOn,
		CreatedAt: tr.CreatedAt, UpdatedAt: tr.UpdatedAt,
	}
}

func wrapTestRuns(root *Resolver, runs []dbsqlc.TestRun) []*testRunResolver {
	out := make([]*testRunResolver, len(runs))
	for i := range runs {
		out[i] = &testRunResolver{root: root, tr: testRunFromModel(&runs[i])}
	}
	return out
}

type testRunResolver struct {
	root *Resolver
	tr   testRunData
}

func (r *testRunResolver) ID() graphql.ID             { return graphql.ID(r.tr.ID.String()) }
func (r *testRunResolver) Code() string               { return r.tr.Code }
func (r *testRunResolver) ProjectID() graphql.ID      { return intID(r.tr.ProjectID) }
func (r *testRunResolver) TestPlanID() *graphql.ID    { return nullIntID(r.tr.TestPlanID) }
func (r *testRunResolver) TestCaseID() graphql.ID     { return graphql.ID(r.tr.TestCaseID.String()) }
func (r *testRunResolver) ResultState() string        { return r.tr.ResultState }
func (r *testRunResolver) IsClosed() bool             { return r.tr.IsClosed.Valid && r.tr.IsClosed.Bool }
func (r *testRunResolver) Notes() string              { return r.tr.Notes }
func (r *testRunResolver) ActualResult() *string      { return nullStr(r.tr.ActualResult) }
func (r *testRunResolver) ExpectedResult() *string    { return nullStr(r.tr.ExpectedResult) }
func (r *testRunResolver) OwnerID() graphql.ID        { return intID(r.tr.OwnerID) }
func (r *testRunResolver) TestedByID() *graphql.ID    { return nullIntID(r.tr.TestedByID) }
func (r *testRunResolver) AssignedToID() *graphql.ID  { return nullIntID(r.tr.AssignedToID) }
func (r *testRunResolver) EnvironmentID() *graphql.ID { return nullIntID(r.tr.EnvironmentID) }
func (r *testRunResolver) TestedOn() graphql.Time     { return gqlTime(r.tr.TestedOn) }
func (r *testRunResolver) CreatedAt() *graphql.Time   { return nullTime(r.tr.CreatedAt) }
func (r *testRunResolver) UpdatedAt() *graphql.Time   { return nullTime(r.tr.UpdatedAt) }

func (r *testRunResolver) Project(ctx context.Context) (*projectResolver, error) {
	return r.root.projectByID(ctx, int64(r.tr.ProjectID))
}

func (r *testRunResolver) TestPlan(ctx context.Context) (*testPlanResolver, error) {
	if !r.tr.TestPlanID.Valid {
		return nil, nil
	}
	return r.root.testPlanByID(ctx, int64(r.tr.TestPlanID.Int32))
}

func (r *testRunResolver) TestCase(ctx context.Context) (*testCaseResolver, error) {
	return r.root.testCaseByID(ctx, r.tr.TestCaseID.String())
}

// ---- Tester -----------------------------------------------------------------

type testerResolver struct {
	root *Resolver
	t    schema.Tester
}

func wrapTesters(root *Resolver, testers []schema.Tester) []*testerResolver {
	out := make([]*testerResolver, len(testers))
	for i := range testers {
		out[i] = &testerResolver{root: root, t: testers[i]}
	}
	return out
}

func (r *testerResolver) UserID() graphql.ID    { return intID(r.t.UserID) }
func (r *testerResolver) Name() string          { return r.t.Name }
func (r *testerResolver) Email() string         { return r.t.Email }
func (r *testerResolver) Role() string          { return r.t.Role }
func (r *testerResolver) ProjectID() graphql.ID { return intID(r.t.ProjectID) }
func (r *testerResolver) ProjectName() string   { return r.t.Project }
func (r *testerResolver) LastLoginAt() string   { return r.t.LastLoginAt }
func (r *testerResolver) CreatedAt() string     { return r.t.CreatedAt }
func (r *testerResolver) UpdatedAt() string     { return r.t.UpdatedAt }

func (r *testerResolver) Project(ctx context.Context) (*projectResolver, error) {
	return r.root.projectByID(ctx, r.t.ProjectID)
}
