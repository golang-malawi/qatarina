# QATARINA DESIGN


## Data Model

See [domainmodel.md](./domainmodel.md)

## Use Cases

![[]](./diagrams/UserActions.png)

![[]](./diagrams/UserAdminTasks.png)

![[]](./diagrams/ProjectUseCases.png)

![[]](./diagrams/TestCaseUseCases.png)

![[]](./diagrams/TesterUsesCases.png)

## Creating Test Cases

We want to have several ways in which test cases can be created

- Creation via the API endpoint to create one test case
- Creation via API to create multiple test-cases at once
- Import via GitHub issues
- Import via Git repository commit history
- Creation via service integrations (JIRA, Asana, Monday)

## Events

- **projects:created** - Project created
- **projects:updated** - Project updated
- **projects:deleted** - Project deleted/removed
- **projects:archived** - Project archived
- **projects:imported** - Project imported from a source

- **test-cases:created** - Test Case created
- **test-cases:updated** - Test Case updated
- **test-cases:deleted** - Test Case deleted/removed
- **test-cases:archived** - Test Case archived
- **test-cases:imported** - Test Cases imported from a source

- **test-run:created** - Test Run created
- **test-run:passed** - Test Run Passed
- **test-run:failed** - Test Run Failed
- **test-run:updated** - Test Run updated
- **test-run:deleted** - Test Run deleted/removed

## Configuration


## Integrations

We want to have the following integrations:

- Google APIs: for access to Auth via Google, Google Sheets, Google Docs
- GitHub APIs: for access to Auth via GitHub, GitHub Issues, Commit History, GitHub Actions
- APIs for Task / Project Management platforms
    - Trello
    - JIRA
    - Monday
    - Asana
- SAML/OIDC integration
- Integration with Slack for a /qatarina bot command
- Integration with PagerDuty?
- Integration with ReviewDog
 
