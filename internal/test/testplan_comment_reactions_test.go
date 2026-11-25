package test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

// Reactions work like WhatsApp: one per person per comment, reacting again replaces it
func TestCommentReactions(t *testing.T) {
	db := openTestDB()
	ctx := context.Background()
	svc := services.NewTestPlanService(dbsqlc.New(db), logging.NewForTest(), t.TempDir())

	var userIDs, planIDs []int64
	var projectID int64
	// Comments and their reactions go with the test plans (ON DELETE CASCADE)
	t.Cleanup(func() {
		db.Exec(`DELETE FROM test_plans WHERE id = ANY($1::int[])`, pqIntArray(planIDs...))
		db.Exec(`DELETE FROM projects WHERE id = $1`, projectID)
		db.Exec(`DELETE FROM users WHERE id = ANY($1::int[])`, pqIntArray(userIDs...))
	})

	newUser := func(name string) int64 {
		res, err := newAuthService(t, db).SignUp(&schema.SignUpRequest{
			FirstName:   name,
			LastName:    "Reactor",
			DisplayName: name,
			Email:       uniqueEmail("reactions"),
			Password:    "s3cret-pass",
		})
		if err != nil {
			t.Fatalf("SignUp failed: %v", err)
		}
		userIDs = append(userIDs, int64(res.UserID))
		return int64(res.UserID)
	}
	alice, bob := newUser("Alice"), newUser("Bob")

	if err := db.QueryRow(
		`INSERT INTO projects (title, description, owner_user_id, created_at, updated_at)
		 VALUES ($1, 'reactions fixture', $2, NOW(), NOW()) RETURNING id`,
		"Reactions "+uniqueEmail("p"), alice,
	).Scan(&projectID); err != nil {
		t.Fatalf("creating project failed: %v", err)
	}

	newPlan := func() int64 {
		plan, err := svc.Create(ctx, &schema.CreateTestPlan{
			ProjectID:      projectID,
			Kind:           "general",
			Description:    "reactions",
			StartAt:        time.Now(),
			ScheduledEndAt: time.Now().Add(24 * time.Hour),
			AssignedToID:   alice,
			CreatedByID:    alice,
			UpdatedByID:    alice,
		})
		if err != nil {
			t.Fatalf("creating test plan failed: %v", err)
		}
		planIDs = append(planIDs, plan.ID)
		return plan.ID
	}
	planID, otherPlanID := newPlan(), newPlan()

	comment, err := svc.CreateComment(ctx, &schema.CreateComment{TestPlanID: planID, UserID: alice, Content: "Looks good"})
	if err != nil {
		t.Fatalf("CreateComment failed: %v", err)
	}

	byUser := func(reactions []schema.CommentReaction) map[int64]string {
		m := map[int64]string{}
		for _, r := range reactions {
			m[r.UserID] = r.Emoji
		}
		return m
	}

	reactions, err := svc.SetCommentReaction(ctx, planID, comment.ID, alice, "👍")
	if err != nil {
		t.Fatalf("SetCommentReaction failed: %v", err)
	}
	if got := byUser(reactions); len(got) != 1 || got[alice] != "👍" {
		t.Fatalf("after first reaction got %v", reactions)
	}

	// Reacting again replaces the earlier reaction instead of adding another
	reactions, err = svc.SetCommentReaction(ctx, planID, comment.ID, alice, "❤️")
	if err != nil {
		t.Fatalf("SetCommentReaction (replace) failed: %v", err)
	}
	if got := byUser(reactions); len(got) != 1 || got[alice] != "❤️" {
		t.Fatalf("after replacing got %v", reactions)
	}

	if _, err := svc.SetCommentReaction(ctx, planID, comment.ID, bob, "👍"); err != nil {
		t.Fatalf("SetCommentReaction (bob) failed: %v", err)
	}

	comments, _, err := svc.ListComments(ctx, planID, 10, 0)
	if err != nil {
		t.Fatalf("ListComments failed: %v", err)
	}
	if len(comments) != 1 {
		t.Fatalf("expected 1 comment, got %d", len(comments))
	}
	if got := byUser(comments[0].Reactions); len(got) != 2 || got[alice] != "❤️" || got[bob] != "👍" {
		t.Fatalf("listed reactions = %v", comments[0].Reactions)
	}
	if comments[0].Reactions[0].UserName == "" {
		t.Errorf("reactions should carry the user's name, got %+v", comments[0].Reactions[0])
	}

	if _, err := svc.SetCommentReaction(ctx, otherPlanID, comment.ID, bob, "😂"); !errors.Is(err, services.ErrNotFound) {
		t.Errorf("reacting through another test plan: got %v, want ErrNotFound", err)
	}
	if _, err := svc.SetCommentReaction(ctx, planID, comment.ID, bob, "nice"); !errors.Is(err, services.ErrInvalidReaction) {
		t.Errorf("reacting with text: got %v, want ErrInvalidReaction", err)
	}

	reactions, err = svc.RemoveCommentReaction(ctx, planID, comment.ID, alice)
	if err != nil {
		t.Fatalf("RemoveCommentReaction failed: %v", err)
	}
	if got := byUser(reactions); len(got) != 1 || got[bob] != "👍" {
		t.Fatalf("after removing got %v", reactions)
	}
}
