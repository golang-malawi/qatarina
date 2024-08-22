# QATARINA Developer Docs


## Using `sqlc` for database queries

We use SQLC in the project for generating Go code from SQL for the database layer.
In order to add queries for the database layer, you will need to modify the
[`query.sql`](../query.sql) file which stores all the queries and author an SQLC
compatible query. Read on how to write queries [here](https://docs.sqlc.dev/en/latest/howto/select.html)

After modifying the `query.sql` file, you will need to run the following command
to generate the Go code for that. This will generate code in the `internal/database/dbsqlc` directory

```sh
$ sqlc generate
```

Generally, we recommend using the generated code from a Repository or Service
type rather than using the queries in API handlers and other places directly.

## Components

The system is designed to be deployed as a single binary, but has subcommands that launch different components or run commands.

```sh
# Runs the database migrations
$ qatarina migrate

# Runs the server
$ qatarina server
```