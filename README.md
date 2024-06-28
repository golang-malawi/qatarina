QATARINA
========

This is an experimental project to build tooling for Software Quality Assurance and User Acceptance Testing.
We hope it will become the standard for such processes for teams.
We have some exciting ideas to make it a good tool.

So in the next 6 months we will be working on this as an experiment and trying to validate its existence.

> NOTE: Highly experimental, in-development and definitely not ready for production use yet.

## Tech Stack

The initial tech stack is as follows, we may eventually swap out parts of this stack as the project grows.

- Go 1.22+
  - Fiber
  - pgx and sqlx
  - Riverqueue
- PostgreSQL 15+
- VueJS with TypeScript
- Docker
- TestContainers
- WASM
- Taskfile

## Integrations

We want to have the following integrations:

- Google APIs: for access to Auth via Google, Google Sheets, Google Docs
- GitHub APIs: for access to Auth via GitHub, GitHub Issues, Commit History, GitHub Actions
- APIs for Task / Project Management platforms
    - Trello
    - JIRA
    - Monday
    - Asana

## Contributing

TODO: to describe the contribution process

## LICENSE

MIT LICENSE
