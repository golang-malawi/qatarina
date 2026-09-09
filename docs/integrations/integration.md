# Platform Integration Guideline and Architecture
- This document serves as a guideline and background for integrating Qatarina with other platforms (e.g. Jira, GitHub), and records the architectural decisions made along the way.
- Our approach is that a project owner or manager sets up a shared credential for their project. For example, a username like QA@project.com. Failed test cases and test runs are accepted under that user, and project participants or other authorized users can then send issues anonymously through it.

## Key Requirements
- Connect other platforms to Qatarina.
- Retrieve projects from connected platforms.
- Link a Qatarina project to a project on another platform.
- Send issues from Qatarina to connected platforms.
- Sending is single-issue only for now (no batch sending).
- Scope is intentionally outbound-only: Qatarina sends issues to connected platforms; it does not read back, sync, or display issue status or content from those platforms as part of this feature.

### Preferred Architecture
- Hexagonal (Ports and Adapters) Architecture. This style is chosen to reduce tight coupling between Qatarina's core service and its integrations with other platforms. Qatarina defines an interface for sending issues and adapters implement that particular interface.

## Steps
### Connect other platforms to Qatarina.
- The project owner creates authentication credentials on the external platform and adds them to Qatarina.
- These credentials typically include: username, access token, domain, and platform.
- The access or authentication token is encrypted at rest.

### Get and Link Projects
- The saved credentials are used to retrieve all available projects from the external platform.
- The user selects a project from the external platform and links it to the corresponding project in Qatarina.
- This link between the two projects is stored as a join record associated with the credentials used.

### Send Issues from Qatarina to other projects.
- Qatarina's core service defines an interface with a single method for sending an issue, accepting the following top-level arguments: issueTitle, issueDescription, Project.
- `Project` refers to a project reference. The implementing adapter is responsible for using this reference to look up the credentials associated with that project and perform the send.
- There is intentionally no shared interface for credential retrieval across platforms, since credential shape and lookup vary by platform. Each adapter is responsible for fetching and using its own credentials internally. This coupling is accepted at the adapter level and is not considered a concern worth solving at this stage.
- Each external adapter implements this interface: it accepts these parameters, performs the issue-sending operation, and returns a result message and an error.

## Constraints
- A Qatarina project can be linked to a given external platform only once, but it can be linked across multiple platforms.