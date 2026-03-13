QATARINA
========

This is a work in progress project to build tooling for Software Quality Assurance and User Acceptance Testing. We hope it will become the standard for such processes for teams.
We have some exciting ideas to make it a good tool.

## Tech Stack


We use the following technologies:

- Go 1.25+
  - Fiber
  - pgx and sqlx
  - Riverqueue
- PostgreSQL 15+
- React with
  - TypeScript
  - ChakraUI V3
  - Tanstack Router
  - Tanstack Query
- Docker

### Dev tools

You will need to have the following developer tools installed:

- [SQLC](https://sqlc.dev)
- [Swag](https://github.com/swaggo/swag) Note: use the v2 branch, because the current latest does not support Openapi v3
- [Taskfile](https://taskfile.dev)

## Building and running

Get the code by cloning the repository, and installing dependencies:

```sh
$ git clone https://github.com/golang-malawi/qatarina

$ cd qatarina/ui

$ npm install

$ cd ..

$ go mod tidy
```


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

Contributions are welcome! Here's how to get started:

1. **Fork** the repository and clone your fork locally.
2. **Create a branch** for your change: `git checkout -b feature/my-change`.
3. **Make your changes**, ensuring they follow the existing code style and conventions.
4. **Test** your changes locally (run `go test ./...` for backend, `npm test` in `ui/` for frontend).
5. **Commit** with a clear, descriptive message.
6. **Push** your branch and open a **Pull Request** against `main`.

Please open an **issue** first for larger changes or new features to discuss the approach before investing significant effort.

## LICENSE

MIT LICENSE

![[]](./docs/sponsored-by-nndi.png)
