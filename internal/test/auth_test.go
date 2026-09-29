package test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
)

// openTestDB is defined in the existing test file in this package.

const authTestJWTSecret = "integration-test-secret"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func newAuthService(t *testing.T, db *sql.DB) services.AuthService {
	t.Helper()
	return services.NewAuthService(
		&config.AuthConfiguration{JwtSecretKey: authTestJWTSecret},
		dbsqlc.New(db),
		logging.NewForTest(),
	)
}

// uniqueEmail keeps tests independent of each other and of leftover data.
func uniqueEmail(prefix string) string {
	return fmt.Sprintf("%s-%d@example.com", prefix, time.Now().UnixNano())
}

// createTestUser registers a user through SignUp (so we don't depend on the
// column layout of the users table) and deletes it when the test ends.
func createTestUser(t *testing.T, db *sql.DB, svc services.AuthService, password string) (email string, userID int64) {
	t.Helper()

	email = uniqueEmail("auth-test")
	res, err := svc.SignUp(&schema.SignUpRequest{
		FirstName:   "Test",
		LastName:    "User",
		DisplayName: "Test User",
		Email:       email,
		Password:    password,
	})
	if err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	t.Cleanup(func() {
		// ASSUMPTION: table is named "users". Adjust if yours differs.
		if _, err := db.Exec(`DELETE FROM users WHERE id = $1`, res.UserID); err != nil {
			t.Logf("cleanup: failed to delete user %d: %v", res.UserID, err)
		}
	})

	return email, res.UserID
}

func parseAuthToken(t *testing.T, tokenStr string) jwt.MapClaims {
	t.Helper()
	token, err := jwt.Parse(tokenStr, func(tok *jwt.Token) (interface{}, error) {
		if _, ok := tok.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", tok.Header["alg"])
		}
		return []byte(authTestJWTSecret), nil
	})
	if err != nil {
		t.Fatalf("token did not parse/validate: %v", err)
	}
	return token.Claims.(jwt.MapClaims)
}

// ---------------------------------------------------------------------------
// SignUp
// ---------------------------------------------------------------------------

func TestAuthService_SignUp_Success(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email := uniqueEmail("signup")
	res, err := svc.SignUp(&schema.SignUpRequest{
		FirstName:   "Hope",
		LastName:    "Sain",
		DisplayName: "Hope S",
		Email:       email,
		Password:    "s3cret-pass",
	})
	if err != nil {
		t.Fatalf("SignUp failed: %v", err)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM users WHERE id = $1`, res.UserID) })

	if res.UserID == 0 {
		t.Error("expected a non-zero user ID")
	}
	if res.Email != email || res.DisplayName != "Hope S" {
		t.Errorf("unexpected response: %+v", res)
	}

	claims := parseAuthToken(t, res.Token)
	if claims["Email"] != email {
		t.Errorf("token Email claim = %v, want %s", claims["Email"], email)
	}
	if claims["UserID"] != float64(res.UserID) {
		t.Errorf("token UserID claim = %v, want %d", claims["UserID"], res.UserID)
	}
}

func TestAuthService_SignUp_DuplicateEmail(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email, _ := createTestUser(t, db, svc, "s3cret-pass")

	res, err := svc.SignUp(&schema.SignUpRequest{
		FirstName:   "Other",
		LastName:    "Person",
		DisplayName: "Other",
		Email:       email,
		Password:    "another-pass",
	})
	if !errors.Is(err, services.ErrUserAlreadyExists) {
		t.Fatalf("expected ErrUserAlreadyExists, got %v", err)
	}
	if res != nil {
		t.Errorf("expected nil response, got %+v", res)
	}
}

// EXPECTED TO FAIL against the current code: SignUp treats any error other
// than sql.ErrNoRows as "user already exists", so a database outage tells a
// brand-new user their email is taken.
func TestAuthService_SignUp_DatabaseDown_IsNotReportedAsDuplicate(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)
	db.Close() // every query now fails with "sql: database is closed"

	_, err := svc.SignUp(&schema.SignUpRequest{
		FirstName: "A", LastName: "B", DisplayName: "AB",
		Email: uniqueEmail("dbdown"), Password: "pw",
	})
	if err == nil {
		t.Fatal("expected an error")
	}
	if errors.Is(err, services.ErrUserAlreadyExists) {
		t.Error("database failure was reported as ErrUserAlreadyExists")
	}
}

// ---------------------------------------------------------------------------
// SignIn
// ---------------------------------------------------------------------------

func TestAuthService_SignIn_Success(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email, userID := createTestUser(t, db, svc, "correct-password")

	res, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "correct-password"})
	if err != nil {
		t.Fatalf("SignIn failed: %v", err)
	}
	if res.UserID != userID || res.Email != email {
		t.Errorf("unexpected response: %+v", res)
	}

	claims := parseAuthToken(t, res.Token)
	if claims["Email"] != email {
		t.Errorf("token Email claim = %v, want %s", claims["Email"], email)
	}
}

func TestAuthService_SignIn_WrongPassword(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email, _ := createTestUser(t, db, svc, "correct-password")

	res, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "wrong-password"})
	if !errors.Is(err, services.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
	if res != nil {
		t.Errorf("expected nil response, got %+v", res)
	}
}

func TestAuthService_SignIn_UnknownEmail(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	res, err := svc.SignIn(&schema.LoginRequest{Email: uniqueEmail("ghost"), Password: "whatever"})
	if !errors.Is(err, services.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
	if res != nil {
		t.Errorf("expected nil response, got %+v", res)
	}
}

// A database outage must NOT look like bad credentials, or clients tell users
// their password is wrong when the problem is on our side.
func TestAuthService_SignIn_DatabaseDown(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)
	db.Close()

	_, err := svc.SignIn(&schema.LoginRequest{Email: uniqueEmail("dbdown"), Password: "pw"})
	if err == nil {
		t.Fatal("expected an error")
	}
	if errors.Is(err, services.ErrInvalidCredentials) {
		t.Error("database failure was reported as invalid credentials")
	}
}

// ---------------------------------------------------------------------------
// ChangePassword
// ---------------------------------------------------------------------------

func TestAuthService_ChangePassword_Success(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)
	ctx := context.Background()

	email, userID := createTestUser(t, db, svc, "old-pass")

	err := svc.ChangePassword(ctx, &schema.ChangePasswordRequest{
		UserID:          userID,
		OldPassword:     "old-pass",
		NewPassword:     "new-pass",
		ConfirmPassword: "new-pass",
	})
	if err != nil {
		t.Fatalf("ChangePassword failed: %v", err)
	}

	// The real proof: the new password works and the old one is dead.
	if _, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "new-pass"}); err != nil {
		t.Errorf("sign in with new password failed: %v", err)
	}
	if _, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "old-pass"}); !errors.Is(err, services.ErrInvalidCredentials) {
		t.Errorf("old password should be rejected, got %v", err)
	}
}

func TestAuthService_ChangePassword_WrongOldPassword(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email, userID := createTestUser(t, db, svc, "old-pass")

	err := svc.ChangePassword(context.Background(), &schema.ChangePasswordRequest{
		UserID:          userID,
		OldPassword:     "not-the-old-pass",
		NewPassword:     "new-pass",
		ConfirmPassword: "new-pass",
	})
	if !errors.Is(err, services.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}

	// Password must be unchanged.
	if _, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "old-pass"}); err != nil {
		t.Errorf("original password should still work: %v", err)
	}
}

func TestAuthService_ChangePassword_ConfirmationMismatch(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	email, userID := createTestUser(t, db, svc, "old-pass")

	err := svc.ChangePassword(context.Background(), &schema.ChangePasswordRequest{
		UserID:          userID,
		OldPassword:     "old-pass",
		NewPassword:     "new-pass",
		ConfirmPassword: "different",
	})
	if err == nil {
		t.Fatal("expected an error for mismatched confirmation")
	}
	if errors.Is(err, services.ErrInvalidCredentials) {
		t.Error("mismatch should not be reported as invalid credentials")
	}

	// Password must be unchanged.
	if _, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "old-pass"}); err != nil {
		t.Errorf("original password should still work: %v", err)
	}
	if _, err := svc.SignIn(&schema.LoginRequest{Email: email, Password: "new-pass"}); err == nil {
		t.Error("new password must not have been applied")
	}
}

func TestAuthService_ChangePassword_UnknownUser(t *testing.T) {
	db := openTestDB()
	svc := newAuthService(t, db)

	err := svc.ChangePassword(context.Background(), &schema.ChangePasswordRequest{
		UserID:          2_000_000_000, // fits in int32, will not exist
		OldPassword:     "x",
		NewPassword:     "y",
		ConfirmPassword: "y",
	})
	if !errors.Is(err, services.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}
