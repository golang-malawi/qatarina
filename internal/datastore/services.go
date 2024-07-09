package datastore

type TestCaseService interface {
	FindAll() ([]any, error)
}

type TestPlanService interface {
	FindAll() ([]any, error)
}

type TestRunService interface {
	FindAll() ([]any, error)
}

type TesterService interface {
	FindAll() ([]any, error)
	Invite(any) (any, error)
}
