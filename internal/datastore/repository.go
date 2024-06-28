package datastore

import (
	"context"

	"github.com/golang-malawi/qatarina/internal/models"
)

type UserRepository interface {
	FindAll(context.Context) ([]models.User, error)
	FindAllPaginated(ctx context.Context, limit, offset int) ([]models.User, error)
	FindOneByUsername(context.Context, string) (*models.User, error)
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
