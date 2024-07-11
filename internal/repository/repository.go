package repository

import (
	"context"

	"github.com/golang-malawi/qatarina/internal/schema"
)

type UserRepository interface {
	FindAll(context.Context) ([]schema.UserCompact, error)
	FindAllPaginated(ctx context.Context, limit, offset int) ([]schema.UserCompact, error)
	FindOneByUsername(context.Context, string) (*schema.UserCompact, error)
}

type OrgRepository interface{}

type ProjectRepository interface{}

type TesterRepository interface{}

type TestSessionRepository interface{}

type TestScenarioRepository interface{}

type TestResultRepository interface{}

type ProjectTesterRepository interface{}

type ProjectTestCaseRepository interface{}

type NoteRepository interface{}

type SessionDataRepository interface{}
