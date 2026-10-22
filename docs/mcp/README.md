# QATARINA MCP Server
QATARINA ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io)
server, so AI assistants and agents such as Claude Code, Claude Desktop and Cursor
can work with your QATARINA platform directly.

The MCP server is part of the `qatarina` binary and runs as its own subcommand,
`qatarina mcp`. It connects to the same database as `qatarina server` and uses the
same configuration file.

## Available tools

| Tool         | Description                                     | Read only |
|--------------|-------------------------------------------------|-----------|
| `whoami`     | Returns the profile of the authenticated user.  | Yes       |
| `list_users` | Lists all users on the QATARINA platform.       | Yes       |

Every tool call runs as an authenticated QATARINA user. More tools will be added
over time.

## Prerequisites
- A built `qatarina` binary (see [Building and running](../../README.md#building-and-running)).
- A running, migrated database (`qatarina migrate`).
- A QATARINA user account that the MCP client will act as.

## Configuration

Add an `mcp` section to your `qatarina.yaml` (see [qatarina.example.yaml](../../qatarina.example.yaml)):

```yaml
mcp:
  # "http" (default) or "stdio"
  transport: "http"
  host: "localhost"
  port: 4598
  path: "/mcp"
```

| Key         | Default | Description                                        |
|-------------|---------|----------------------------------------------------|
| `transport` | `http`  | `http` (streamable HTTP) or `stdio`.               |
| `host`      | (empty, all interfaces) | Host the HTTP transport listens on. |
| `port`      | `4598`  | Port the HTTP transport listens on.                |
| `path`      | `/mcp`  | HTTP path the MCP endpoint is mounted on.          |

The transport and address can also be set from the command line, which takes
precedence over the config file:

```sh
$ qatarina mcp --transport http --addr localhost:4598
$ qatarina mcp --transport stdio
```

Use `--config /path/to/qatarina.yaml` if the config file is not in the current
directory, your home directory or `/etc/qatarina.d`.

## Choosing a transport

| Transport | Best for                                              | Authentication                      |
|-----------|-------------------------------------------------------|-------------------------------------|
| `http`    | A shared or remote server that several users connect to. | Each request sends the user's JWT. |
| `stdio`   | A local assistant that starts the server itself.      | Signs in once with email and password. |

### HTTP transport

The HTTP transport accepts the same JWTs that the QATARINA REST API issues. Every
request must carry one as an `Authorization: Bearer <token>` header; requests
without a valid, unexpired token are rejected with `401 Unauthorized`.

1. Start the MCP server:

   ```sh
   $ qatarina mcp
   ```

2. Get a token by signing in through the REST API (the `qatarina server` must be running):

   ```sh
   $ curl -s -X POST http://localhost:4597/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email": "you@example.com", "password": "your-password"}'
   ```

   Copy the `token` value from the response. It expires after
   `auth.jwt_expiry_timeout` seconds, after which you need to sign in again.

3. Point your MCP client at `http://localhost:4598/mcp` with the token, for example
   in Claude Code:

   ```sh
   $ claude mcp add --transport http qatarina http://localhost:4598/mcp \
       --header "Authorization: Bearer <token>"
   ```

   Or in a client that reads an `mcpServers` JSON config (e.g. `.mcp.json`):

   ```json
   {
     "mcpServers": {
       "qatarina": {
         "type": "http",
         "url": "http://localhost:4598/mcp",
         "headers": {
           "Authorization": "Bearer <token>"
         }
       }
     }
   }
   ```

### Stdio transport

With stdio the MCP client launches `qatarina mcp` as a child process and talks to it
over stdin/stdout. There are no request headers, so the server signs in once at
startup using the `QATARINA_EMAIL` and `QATARINA_PASSWORD` environment variables
and runs every tool call as that user. The server exits with an error if either
is missing or the sign-in fails.

Logs are written to stderr (and the configured log file) so they don't interfere
with the protocol on stdout.

Since the client may start the process from any directory, pass the config file
explicitly. In Claude Code:

```sh
$ claude mcp add qatarina \
    --env QATARINA_EMAIL=you@example.com \
    --env QATARINA_PASSWORD=your-password \
    -- /path/to/qatarina --config /path/to/qatarina.yaml mcp --transport stdio
```

Or in a client that reads an `mcpServers` JSON config (e.g. Claude Desktop's
`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "/path/to/qatarina",
      "args": ["--config", "/path/to/qatarina.yaml", "mcp", "--transport", "stdio"],
      "env": {
        "QATARINA_EMAIL": "you@example.com",
        "QATARINA_PASSWORD": "your-password"
      }
    }
  }
}
```

On Windows use the full path to `qatarina.exe`, e.g. `"C:\\tools\\qatarina.exe"`.

## Verifying the connection

Once your client is connected, ask the assistant something like *"Who am I on
QATARINA?"*. It should call the `whoami` tool and return your user profile.

You can also inspect the server with the
[MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```sh
$ npx @modelcontextprotocol/inspector
```

## Troubleshooting

- **`401 missing bearer token` / `invalid or expired token`** (HTTP): check the
  `Authorization` header and sign in again for a fresh token. Tokens are signed
  with `auth.jwt_secret_key`, so the MCP server and the REST API must share the
  same config.
- **`email and password are required for the stdio transport`**: set
  `QATARINA_EMAIL` and `QATARINA_PASSWORD` in the client's `env`.
- **`Can't read config`**: pass `--config` with the absolute path to your
  `qatarina.yaml`.
- **Stdio client hangs or reports invalid JSON**: make sure nothing else writes
  to stdout; check the log file configured under `logging.file` for errors.

## Security notes

- Treat tokens and the stdio credentials like passwords; don't commit them to
  shared config files such as a project `.mcp.json`.
- The MCP server has the same access as the user it runs as. Use a dedicated
  account with only the permissions the assistant needs.
- The HTTP transport serves plain HTTP. If you expose it beyond `localhost`, put
  it behind a reverse proxy with TLS.
