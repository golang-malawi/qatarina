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

### Dev tools

You will need to have the following developer tools installed:

- [SQLC](https://sqlc.dev)
- [Swag](https://github.com/swaggo/swag)
- [Taskfile](https://taskfile.dev)


## Building and running

In order to build the server you can run

```sh
$ go build

# Copy the configuration and edit with appropriate values
$ cp qatarina.example.yaml qatarina.yaml

# This runs migrations to setup the database
$ ./qatarina migrate

# The command below starts the web server
$ ./qatarina server
```

More documentation about the project is in [./docs/developer.md](./docs/developer.md)

## Contributing

TODO: to describe the contribution process

## LICENSE

MIT LICENSE
