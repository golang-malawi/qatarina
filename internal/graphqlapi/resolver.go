// Package graphqlapi exposes a read-only GraphQL API over qatarina's core
// data model (projects, test plans, test cases, test runs and testers).
//
// It sits alongside the REST API and reuses the same services, so business
// logic stays in one place.
package graphqlapi

import (
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"github.com/graph-gophers/graphql-go"

	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/logging/loggedmodule"
	"github.com/golang-malawi/qatarina/internal/services"
)

//go:embed schema.graphql
var schemaSDL string

// Services holds the services the resolvers read from.
type Services struct {
	Projects  services.ProjectService
	TestPlans services.TestPlanService
	TestCases services.TestCaseService
	TestRuns  services.TestRunService
	Testers   services.TesterService
}

// Resolver is the root resolver for the Query type.
type Resolver struct {
	svc    Services
	logger logging.Logger
}

// NewSchema parses the schema and binds it to the resolvers.
func NewSchema(svc Services, logger logging.Logger) (*graphql.Schema, error) {
	return graphql.ParseSchema(schemaSDL, &Resolver{svc: svc, logger: logger},
		graphql.MaxDepth(10),
		graphql.MaxQueryLength(20_000),
		graphql.MaxParallelism(10),
	)
}

// errInternal is what clients see when a service call fails, so internal
// details (SQL errors and the like) are logged but never returned.
var errInternal = errors.New("internal error while resolving the request")

// fail logs err and returns a sanitised error for the client.
func (r *Resolver) fail(what string, err error) error {
	r.logger.Error(loggedmodule.ApiGraphQL, "failed to resolve "+what, "error", err)
	return errInternal
}

func isNotFound(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}

func parseInt64ID(id graphql.ID) (int64, error) {
	v, err := strconv.ParseInt(string(id), 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid id %q: must be an integer", string(id))
	}
	return v, nil
}

func parseUUID(id graphql.ID) (string, error) {
	if _, err := uuid.Parse(string(id)); err != nil {
		return "", fmt.Errorf("invalid id %q: must be a UUID", string(id))
	}
	return string(id), nil
}

// ---- Projects ---------------------------------------------------------------

func (r *Resolver) Projects(ctx context.Context) ([]*projectResolver, error) {
	projects, err := r.svc.Projects.FindAll(ctx)
	if err != nil {
		return nil, r.fail("projects", err)
	}
	out := make([]*projectResolver, len(projects))
	for i := range projects {
		out[i] = &projectResolver{root: r, p: projects[i]}
	}
	return out, nil
}

func (r *Resolver) Project(ctx context.Context, args struct{ ID graphql.ID }) (*projectResolver, error) {
	id, err := parseInt64ID(args.ID)
	if err != nil {
		return nil, err
	}
	return r.projectByID(ctx, id)
}

func (r *Resolver) projectByID(ctx context.Context, id int64) (*projectResolver, error) {
	p, err := r.svc.Projects.FindByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, nil
		}
		return nil, r.fail("project", err)
	}
	return &projectResolver{root: r, p: *p}, nil
}

func (r *Resolver) SearchProjects(ctx context.Context, args struct{ Keyword string }) ([]*projectResolver, error) {
	projects, err := r.svc.Projects.Search(ctx, args.Keyword)
	if err != nil {
		return nil, r.fail("searchProjects", err)
	}
	out := make([]*projectResolver, len(projects))
	for i := range projects {
		out[i] = &projectResolver{root: r, p: projects[i]}
	}
	return out, nil
}

// ---- Test plans -------------------------------------------------------------

func (r *Resolver) TestPlans(ctx context.Context, args struct{ ProjectID *graphql.ID }) ([]*testPlanResolver, error) {
	if args.ProjectID != nil {
		id, err := parseInt64ID(*args.ProjectID)
		if err != nil {
			return nil, err
		}
		return r.testPlansByProject(ctx, id)
	}
	plans, err := r.svc.TestPlans.FindAll(ctx)
	if err != nil {
		return nil, r.fail("testPlans", err)
	}
	return wrapTestPlans(r, plans), nil
}

func (r *Resolver) TestPlan(ctx context.Context, args struct{ ID graphql.ID }) (*testPlanResolver, error) {
	id, err := parseInt64ID(args.ID)
	if err != nil {
		return nil, err
	}
	return r.testPlanByID(ctx, id)
}

func (r *Resolver) testPlanByID(ctx context.Context, id int64) (*testPlanResolver, error) {
	plan, err := r.svc.TestPlans.GetOneTestPlan(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, nil
		}
		return nil, r.fail("testPlan", err)
	}
	return &testPlanResolver{root: r, tp: *plan}, nil
}

func (r *Resolver) testPlansByProject(ctx context.Context, projectID int64) ([]*testPlanResolver, error) {
	plans, err := r.svc.TestPlans.FindAllByProjectID(ctx, projectID)
	if err != nil {
		if isNotFound(err) {
			return []*testPlanResolver{}, nil
		}
		return nil, r.fail("testPlans", err)
	}
	return wrapTestPlans(r, plans), nil
}

// ---- Test cases -------------------------------------------------------------

func (r *Resolver) TestCases(ctx context.Context, args struct{ ProjectID *graphql.ID }) ([]*testCaseResolver, error) {
	if args.ProjectID != nil {
		id, err := parseInt64ID(*args.ProjectID)
		if err != nil {
			return nil, err
		}
		return r.testCasesByProject(ctx, id)
	}
	cases, err := r.svc.TestCases.FindAll(ctx)
	if err != nil {
		return nil, r.fail("testCases", err)
	}
	return wrapTestCases(r, cases), nil
}

func (r *Resolver) TestCase(ctx context.Context, args struct{ ID graphql.ID }) (*testCaseResolver, error) {
	id, err := parseUUID(args.ID)
	if err != nil {
		return nil, err
	}
	return r.testCaseByID(ctx, id)
}

func (r *Resolver) testCaseByID(ctx context.Context, id string) (*testCaseResolver, error) {
	tc, err := r.svc.TestCases.FindByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, nil
		}
		return nil, r.fail("testCase", err)
	}
	return &testCaseResolver{root: r, tc: testCaseFromRow(tc)}, nil
}

func (r *Resolver) testCasesByProject(ctx context.Context, projectID int64) ([]*testCaseResolver, error) {
	cases, err := r.svc.TestCases.FindAllByProjectID(ctx, projectID)
	if err != nil {
		if isNotFound(err) {
			return []*testCaseResolver{}, nil
		}
		return nil, r.fail("testCases", err)
	}
	return wrapTestCases(r, cases), nil
}

// ---- Test runs --------------------------------------------------------------

func (r *Resolver) TestRuns(ctx context.Context, args struct{ ProjectID *graphql.ID }) ([]*testRunResolver, error) {
	if args.ProjectID != nil {
		id, err := parseInt64ID(*args.ProjectID)
		if err != nil {
			return nil, err
		}
		return r.testRunsByProject(ctx, id)
	}
	runs, err := r.svc.TestRuns.FindAll(ctx)
	if err != nil {
		return nil, r.fail("testRuns", err)
	}
	return wrapTestRuns(r, runs), nil
}

func (r *Resolver) TestRun(ctx context.Context, args struct{ ID graphql.ID }) (*testRunResolver, error) {
	id, err := parseUUID(args.ID)
	if err != nil {
		return nil, err
	}
	run, err := r.svc.TestRuns.GetOneTestRun(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, nil
		}
		return nil, r.fail("testRun", err)
	}
	return &testRunResolver{root: r, tr: testRunFromModel(run)}, nil
}

func (r *Resolver) testRunsByProject(ctx context.Context, projectID int64) ([]*testRunResolver, error) {
	runs, err := r.svc.TestRuns.FindAllByProjectID(ctx, projectID)
	if err != nil {
		if isNotFound(err) {
			return []*testRunResolver{}, nil
		}
		return nil, r.fail("testRuns", err)
	}
	return wrapTestRuns(r, runs), nil
}

// ---- Testers ----------------------------------------------------------------

func (r *Resolver) Testers(ctx context.Context, args struct{ ProjectID *graphql.ID }) ([]*testerResolver, error) {
	if args.ProjectID != nil {
		id, err := parseInt64ID(*args.ProjectID)
		if err != nil {
			return nil, err
		}
		return r.testersByProject(ctx, id)
	}
	testers, err := r.svc.Testers.FindAll(ctx)
	if err != nil {
		return nil, r.fail("testers", err)
	}
	return wrapTesters(r, testers), nil
}

func (r *Resolver) Tester(ctx context.Context, args struct{ UserID graphql.ID }) (*testerResolver, error) {
	id, err := parseInt64ID(args.UserID)
	if err != nil {
		return nil, err
	}
	t, err := r.svc.Testers.FindByID(ctx, int32(id))
	if err != nil {
		if isNotFound(err) {
			return nil, nil
		}
		return nil, r.fail("tester", err)
	}
	return &testerResolver{root: r, t: *t}, nil
}

func (r *Resolver) testersByProject(ctx context.Context, projectID int64) ([]*testerResolver, error) {
	testers, err := r.svc.Testers.FindByProjectID(ctx, projectID)
	if err != nil {
		if isNotFound(err) {
			return []*testerResolver{}, nil
		}
		return nil, r.fail("testers", err)
	}
	return wrapTesters(r, testers), nil
}
