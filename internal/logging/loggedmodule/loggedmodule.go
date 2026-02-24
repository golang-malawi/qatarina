package loggedmodule

type Name string

const (
	// API modules
	ApiAuth         Name = "apiv1:auth"
	ApiUsers        Name = "apiv1:users"
	ApiTests        Name = "apiv1:tests"
	ApiTestCases    Name = "apiv1:test-cases"
	ApiTestRuns     Name = "apiv1:test-runs"
	ApiTesters      Name = "apiv1:testers"
	ApiTestPlans    Name = "apiv1:test-plans"
	ApiProjects     Name = "apiv1:projects"
	ApiSettings     Name = "apiv1:settings"
	ApiPages        Name = "apiv1:pages"
	ApiModules      Name = "apiv1:modules"
	ApiDashboard    Name = "apiv1:dashboard"
	ApiOrgs         Name = "apiv1:orgs"
	ApiEnvironments Name = "apiv1:environments"
)
