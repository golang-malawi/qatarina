package test

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/google/uuid"
)

type relationFixture struct {
	svc    services.TestCaseRelationService
	userID int64
	a, b   string // test case IDs
}

// newRelationFixture creates a user and two test cases, removed again when the test ends
func newRelationFixture(t *testing.T, db *sql.DB) relationFixture {
	t.Helper()

	signUp, err := newAuthService(t, db).SignUp(&schema.SignUpRequest{
		FirstName:   "Relation",
		LastName:    "Tester",
		DisplayName: "Relation Tester",
		Email:       uniqueEmail("relations"),
		Password:    "s3cret-pass",
	})
	if err != nil {
		t.Fatalf("SignUp failed: %v", err)
	}

	newTestCase := func(title string) string {
		id, _ := uuid.NewV7()
		_, err := db.Exec(
			`INSERT INTO test_cases (id, kind, code, title, description, created_by_id, created_at, updated_at)
			 VALUES ($1, 'general', $2, $3, 'relation test fixture', $4, NOW(), NOW())`,
			id, "REL-"+id.String()[:8], title, signUp.UserID,
		)
		if err != nil {
			t.Fatalf("failed to insert test case: %v", err)
		}
		return id.String()
	}
	a, b := newTestCase("Login"), newTestCase("Checkout")

	t.Cleanup(func() {
		// relations are removed with the test cases (ON DELETE CASCADE)
		db.Exec(`DELETE FROM test_cases WHERE id = ANY($1::uuid[])`, "{"+a+","+b+"}")
		db.Exec(`DELETE FROM users WHERE id = $1`, signUp.UserID)
	})

	return relationFixture{
		svc:    services.NewTestCaseRelationService(dbsqlc.New(db), logging.NewForTest()),
		userID: int64(signUp.UserID),
		a:      a,
		b:      b,
	}
}

func TestTestCaseRelations_CreateAndListBothSides(t *testing.T) {
	f := newRelationFixture(t, openTestDB())
	ctx := context.Background()

	created, err := f.svc.Create(ctx, f.b, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: f.a,
		RelationKind:      schema.RelationKindDependsOn,
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if created.Direction != schema.RelationDirectionOutgoing || created.OtherTestCase.ID != f.a {
		t.Errorf("unexpected created relation: %+v", created)
	}
	if created.CreatedByID != int32(f.userID) {
		t.Errorf("CreatedByID = %d, want %d", created.CreatedByID, f.userID)
	}

	// "Checkout depends_on Login" is outgoing from Checkout...
	fromB, err := f.svc.FindAllByTestCase(ctx, f.b)
	if err != nil {
		t.Fatalf("FindAllByTestCase(b) failed: %v", err)
	}
	if len(fromB) != 1 || fromB[0].Direction != schema.RelationDirectionOutgoing || fromB[0].OtherTestCase.Title != "Login" {
		t.Errorf("unexpected relations from b: %+v", fromB)
	}

	// ...and incoming to Login
	fromA, err := f.svc.FindAllByTestCase(ctx, f.a)
	if err != nil {
		t.Fatalf("FindAllByTestCase(a) failed: %v", err)
	}
	if len(fromA) != 1 || fromA[0].Direction != schema.RelationDirectionIncoming || fromA[0].OtherTestCase.Title != "Checkout" {
		t.Errorf("unexpected relations from a: %+v", fromA)
	}
}

func TestTestCaseRelations_DuplicateInEitherDirectionIsRejected(t *testing.T) {
	f := newRelationFixture(t, openTestDB())
	ctx := context.Background()

	req := func(related string) *schema.CreateTestCaseRelationRequest {
		return &schema.CreateTestCaseRelationRequest{RelatedTestCaseID: related, RelationKind: schema.RelationKindRelatedTo}
	}
	if _, err := f.svc.Create(ctx, f.a, f.userID, req(f.b)); err != nil {
		t.Fatalf("first Create failed: %v", err)
	}
	if _, err := f.svc.Create(ctx, f.a, f.userID, req(f.b)); !errors.Is(err, services.ErrRelationExists) {
		t.Errorf("same direction: err = %v, want ErrRelationExists", err)
	}
	if _, err := f.svc.Create(ctx, f.b, f.userID, req(f.a)); !errors.Is(err, services.ErrRelationExists) {
		t.Errorf("reverse direction: err = %v, want ErrRelationExists", err)
	}

	// A different kind between the same pair is allowed
	if _, err := f.svc.Create(ctx, f.a, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: f.b,
		RelationKind:      schema.RelationKindDuplicates,
	}); err != nil {
		t.Errorf("different kind: unexpected error %v", err)
	}
}

func TestTestCaseRelations_InvalidInput(t *testing.T) {
	f := newRelationFixture(t, openTestDB())
	ctx := context.Background()

	_, err := f.svc.Create(ctx, f.a, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: f.a,
		RelationKind:      schema.RelationKindRelatedTo,
	})
	if !errors.Is(err, services.ErrRelationToSelf) {
		t.Errorf("self relation: err = %v, want ErrRelationToSelf", err)
	}

	missing := uuid.NewString()
	_, err = f.svc.Create(ctx, f.a, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: missing,
		RelationKind:      schema.RelationKindRelatedTo,
	})
	if !errors.Is(err, services.ErrNotFound) {
		t.Errorf("missing related test case: err = %v, want ErrNotFound", err)
	}

	// The database CHECK constraint is the last line of defence if validation is bypassed
	_, err = f.svc.Create(ctx, f.a, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: f.b,
		RelationKind:      "blocks",
	})
	if !errors.Is(err, services.ErrInvalidRelation) {
		t.Errorf("unknown kind: err = %v, want ErrInvalidRelation", err)
	}

	if _, err := f.svc.FindAllByTestCase(ctx, missing); !errors.Is(err, services.ErrNotFound) {
		t.Errorf("list for missing test case: err = %v, want ErrNotFound", err)
	}
}

func TestTestCaseRelations_DeleteFromEitherSide(t *testing.T) {
	f := newRelationFixture(t, openTestDB())
	ctx := context.Background()

	created, err := f.svc.Create(ctx, f.a, f.userID, &schema.CreateTestCaseRelationRequest{
		RelatedTestCaseID: f.b,
		RelationKind:      schema.RelationKindDependsOn,
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// An unrelated test case cannot delete it
	if err := f.svc.Delete(ctx, uuid.NewString(), created.ID); !errors.Is(err, services.ErrNotFound) {
		t.Errorf("delete via unrelated test case: err = %v, want ErrNotFound", err)
	}

	// The related (incoming) side can
	if err := f.svc.Delete(ctx, f.b, created.ID); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	remaining, err := f.svc.FindAllByTestCase(ctx, f.a)
	if err != nil {
		t.Fatalf("FindAllByTestCase failed: %v", err)
	}
	if len(remaining) != 0 {
		t.Errorf("expected no relations after delete, got %+v", remaining)
	}

	if err := f.svc.Delete(ctx, f.a, created.ID); !errors.Is(err, services.ErrNotFound) {
		t.Errorf("second delete: err = %v, want ErrNotFound", err)
	}
}
