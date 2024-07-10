// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.26.0

package dbsqlc

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
)

type TestKind string

const (
	TestKindGeneral        TestKind = "general"
	TestKindAdhoc          TestKind = "adhoc"
	TestKindTriage         TestKind = "triage"
	TestKindIntegration    TestKind = "integration"
	TestKindUserAcceptance TestKind = "user_acceptance"
	TestKindRegression     TestKind = "regression"
	TestKindSecurity       TestKind = "security"
	TestKindUserInterface  TestKind = "user_interface"
	TestKindScenario       TestKind = "scenario"
)

func (e *TestKind) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = TestKind(s)
	case string:
		*e = TestKind(s)
	default:
		return fmt.Errorf("unsupported scan type for TestKind: %T", src)
	}
	return nil
}

type NullTestKind struct {
	TestKind TestKind
	Valid    bool // Valid is true if TestKind is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullTestKind) Scan(value interface{}) error {
	if value == nil {
		ns.TestKind, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.TestKind.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullTestKind) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.TestKind), nil
}

type TestRunState string

const (
	TestRunStatePending TestRunState = "pending"
	TestRunStatePassed  TestRunState = "passed"
	TestRunStateFailed  TestRunState = "failed"
)

func (e *TestRunState) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = TestRunState(s)
	case string:
		*e = TestRunState(s)
	default:
		return fmt.Errorf("unsupported scan type for TestRunState: %T", src)
	}
	return nil
}

type NullTestRunState struct {
	TestRunState TestRunState
	Valid        bool // Valid is true if TestRunState is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullTestRunState) Scan(value interface{}) error {
	if value == nil {
		ns.TestRunState, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.TestRunState.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullTestRunState) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.TestRunState), nil
}

type Org struct {
	ID int32
	// Name of the organization
	Name string
	// Address of the org
	Address sql.NullString
	// Country of the org
	Country sql.NullString
	// Optional github url
	GithubUrl sql.NullString
	// Optional website url
	WebsiteUrl sql.NullString
	// User who created the org
	CreatedByID int32
	CreatedAt   time.Time
	UpdatedAt   sql.NullTime
}

type OrgMember struct {
	ID        int32
	OrgID     int32
	UserID    int32
	Role      string
	CreatedAt time.Time
	RemovedAt sql.NullTime
}

type Project struct {
	ID int32
	// Title of the project
	Title string
	// Description of the project
	Description string
	// Version of the project
	Version sql.NullString
	// Whether project is active or not
	IsActive sql.NullBool
	// Whether project is public or not
	IsPublic sql.NullBool
	// URL to the projects website
	WebsiteUrl sql.NullString
	// URL to the GitHub Organization or Project link
	GithubUrl sql.NullString
	// URL to Trello if available
	TrelloUrl sql.NullString
	// URL to JIRA if available
	JiraUrl sql.NullString
	// URL to Monday.com if available
	MondayUrl sql.NullString
	// The ID of the owner or creator of the project
	OwnerUserID int32
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   sql.NullTime
}

type TestCase struct {
	ID uuid.UUID
	// The kind of test this case represents
	Kind TestKind
	// A global or project defined code for this test cases
	Code string
	// Feature or module under test if applicable
	FeatureOrModule sql.NullString
	// The title of the test case, think of as E-mail subject
	Title string
	// Description of the test-case
	Description string
	// If applicable, the parent test-cases
	ParentTestCaseID sql.NullInt32
	// Whether test case is a draft i.e. not complete
	IsDraft sql.NullBool
	// Tags for the test case
	Tags []string
	// User who created the test case
	CreatedByID int32
	CreatedAt   sql.NullTime
	UpdatedAt   sql.NullTime
}

type TestPlan struct {
	ID int64
	// Project which this test plan is under
	ProjectID int32
	// [Optional] User who is assigned to the plan
	AssignedToID int32
	// User who created the plan
	CreatedByID int32
	// User who last updated the plan
	UpdatedByID int32
	// The kind of test the plan targets
	Kind TestKind
	// Description of the test plan
	Description sql.NullString
	// When the test (should) starts
	StartAt sql.NullTime
	// When the test plan was actually closed
	ClosedAt sql.NullTime
	// [Optional] A scheduled end date for the test
	ScheduledEndAt sql.NullTime
	// Number of test cases under this plan, counter cached
	NumTestCases int32
	// Number of failed test cases under this plan, counter cached
	NumFailures int32
	// Whether test plan was completed or not
	IsComplete sql.NullBool
	// Whether test plan is locked or not
	IsLocked sql.NullBool
	// Whether the test plan has a report generated for it
	HasReport sql.NullBool
	CreatedAt sql.NullTime
	UpdatedAt sql.NullTime
}

type TestRun struct {
	ID                    uuid.UUID
	ProjectID             int32
	TestPlanID            int32
	TestCaseID            uuid.UUID
	OwnerID               int32
	TestedByID            int32
	AssignedToID          int32
	AssigneeCanChangeCode sql.NullBool
	Code                  string
	ExternalIssueID       sql.NullString
	ResultState           TestRunState
	IsClosed              sql.NullBool
	Notes                 string
	ActualResult          sql.NullString
	ExpectedResult        sql.NullString
	Reactions             pqtype.NullRawMessage
	TestedOn              time.Time
	CreatedAt             sql.NullTime
	UpdatedAt             sql.NullTime
}

type TestRunsComment struct {
	ID        int64
	TestRunID uuid.UUID
	AuthorID  int32
	Content   string
	MediaUrls pqtype.NullRawMessage
}

type User struct {
	ID int32
	// Firstname of the user
	FirstName string
	// Family name or Surname of the user
	LastName string
	// Preferred display name
	DisplayName sql.NullString
	// E-mail address of the user
	Email string
	// BCrypt encryped Password of the user
	Password string
	// Primary phone number, used for OTP in the future
	Phone string
	// Organization to which this user account belongs to, 0 for system
	OrgID       sql.NullInt32
	CountryIso  string
	City        sql.NullString
	Address     string
	IsActivated sql.NullBool
	IsReviewed  sql.NullBool
	// Whether the user is a system-wide administrator. Not to be confused with admin role
	IsSuperAdmin sql.NullBool
	// Whether user account is verified
	IsVerified sql.NullBool
	// Last login time of the user account
	LastLoginAt sql.NullTime
	// When the user confirmed their account e-mail
	EmailConfirmedAt sql.NullTime
	CreatedAt        sql.NullTime
	UpdatedAt        sql.NullTime
	DeletedAt        sql.NullTime
}