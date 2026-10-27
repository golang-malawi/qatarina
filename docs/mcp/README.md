# QATARINA MCP Server
QATARINA ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io)
server, so AI assistants and agents such as Claude Code, Claude Desktop, Cursor and
VS Code can work with your QATARINA platform directly.

The MCP server is part of the `qatarina` binary and runs as its own subcommand,
`qatarina mcp`. It connects to the same database as `qatarina server` and uses the
same configuration file. Every tool call runs as an authenticated QATARINA user.

This guide covers how to run the server and connect your AI agent to it.

## Prerequisites
- A built `qatarina` binary (see [Building and running](../../README.md#building-and-running)).
- A running, migrated database (`qatarina migrate`).
- A QATARINA user account that the agent will act as.
- An MCP-capable client (any of the ones under [Connecting your AI agent](#connecting-your-ai-agent)).

## 1. Configure the server

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

## 2. Choose a transport

| Transport | Best for                                              | Who starts the server | Authentication                      |
|-----------|-------------------------------------------------------|-----------------------|-------------------------------------|
| `http`    | A shared or remote server that several users connect to. | You, with `qatarina mcp` | Each request sends the user's JWT. |
| `stdio`   | A local agent on the same machine as QATARINA.        | The agent, as a child process | Signs in once with email and password. |

If you're not sure, start with **stdio** for a local setup: it needs no token and
works with every client.

## 3. Get your credentials

### For HTTP: a JWT

The HTTP transport accepts the same JWTs that the QATARINA REST API issues. Every
request must carry one as an `Authorization: Bearer <token>` header; requests
without a valid, unexpired token are rejected with `401 Unauthorized`.

1. Start the MCP server (and `qatarina server`, which issues the token):

   ```sh
   $ qatarina server
   $ qatarina mcp
   ```

2. Sign in through the REST API:

   ```sh
   $ curl -s -X POST http://localhost:4597/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email": "you@example.com", "password": "your-password"}'
   ```

3. Copy the `token` value from the response. It expires after
   `auth.jwt_expiry_timeout` seconds, after which you need to sign in again and
   update the token in your client.

### For stdio: email and password

With stdio the agent launches `qatarina mcp` as a child process and talks to it
over stdin/stdout. There are no request headers, so the server signs in once at
startup using the `QATARINA_EMAIL` and `QATARINA_PASSWORD` environment variables
and runs every tool call as that user. The server exits with an error if either
is missing or the sign-in fails.

You don't start the server yourself; the client does. Because the client may start
it from any directory, always pass `--config` with an absolute path. Logs are
written to stderr (and the configured log file) so they don't interfere with the
protocol on stdout.

## Connecting your AI agent

In the examples below, replace:

- `/path/to/qatarina` with the absolute path to the binary. On Windows use the
  full path to `qatarina.exe` and escape backslashes in JSON, e.g.
  `"C:\\tools\\qatarina.exe"`.
- `/path/to/qatarina.yaml` with the absolute path to your config file.
- `<token>` with the JWT from [step 3](#for-http-a-jwt).

After changing a client's config, restart the client (or reload its MCP servers)
so it picks up the new server.

### Claude Code

**stdio**

```sh
$ claude mcp add qatarina \
    --env QATARINA_EMAIL=you@example.com \
    --env QATARINA_PASSWORD=your-password \
    -- /path/to/qatarina --config /path/to/qatarina.yaml mcp --transport stdio
```

**HTTP**

```sh
$ claude mcp add --transport http qatarina http://localhost:4598/mcp \
    --header "Authorization: Bearer <token>"
```

By default the server is only added for the current project. Add `--scope user`
to make it available in every project, or `--scope project` to write it to a
`.mcp.json` file in the repository (don't commit credentials in it).

Run `claude mcp list`, or `/mcp` inside a session, to check that `qatarina` shows
as connected.

### Claude Desktop

Open **Settings → Developer → Edit Config**, or edit `claude_desktop_config.json`
directly:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**stdio** (recommended for Claude Desktop)

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

**HTTP**: Claude Desktop's config file only launches local commands, so use
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) (requires Node.js) to
connect to the HTTP endpoint:

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "http://localhost:4598/mcp",
        "--header", "Authorization: Bearer <token>"
      ]
    }
  }
}
```

Fully quit and reopen Claude Desktop after saving. The server appears under the
tools/connectors menu in the chat input.

### Cursor

Edit `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` in the project, or
go to **Cursor Settings → MCP → Add new MCP server**.

**stdio**

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

**HTTP**

```json
{
  "mcpServers": {
    "qatarina": {
      "url": "http://localhost:4598/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Check **Cursor Settings → MCP**; `qatarina` should show a green status. Use the
agent mode in chat to call its tools.

### VS Code (GitHub Copilot)

Create `.vscode/mcp.json` in your workspace (or run **MCP: Add Server** from the
command palette). Note that VS Code uses a `servers` key, not `mcpServers`. The
`inputs` section makes VS Code prompt for secrets instead of storing them in the
file.

**stdio**

```json
{
  "inputs": [
    { "type": "promptString", "id": "qatarina-password", "description": "QATARINA password", "password": true }
  ],
  "servers": {
    "qatarina": {
      "type": "stdio",
      "command": "/path/to/qatarina",
      "args": ["--config", "/path/to/qatarina.yaml", "mcp", "--transport", "stdio"],
      "env": {
        "QATARINA_EMAIL": "you@example.com",
        "QATARINA_PASSWORD": "${input:qatarina-password}"
      }
    }
  }
}
```

**HTTP**

```json
{
  "inputs": [
    { "type": "promptString", "id": "qatarina-token", "description": "QATARINA JWT", "password": true }
  ],
  "servers": {
    "qatarina": {
      "type": "http",
      "url": "http://localhost:4598/mcp",
      "headers": {
        "Authorization": "Bearer ${input:qatarina-token}"
      }
    }
  }
}
```

Click **Start** above the server entry in `mcp.json`, then open Copilot Chat in
**Agent** mode; the QATARINA tools are listed under the tools button.

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json` (or **Windsurf Settings → Cascade →
MCP Servers → View raw config**).

**stdio**: same `mcpServers` block as [Cursor](#cursor).

**HTTP**: Windsurf uses `serverUrl` instead of `url`:

```json
{
  "mcpServers": {
    "qatarina": {
      "serverUrl": "http://localhost:4598/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

### Other clients

Any MCP client works if it supports one of:

- **stdio**: command `/path/to/qatarina`, arguments
  `--config /path/to/qatarina.yaml mcp --transport stdio`, and the environment
  variables `QATARINA_EMAIL` and `QATARINA_PASSWORD`.
- **Streamable HTTP**: URL `http://<host>:4598/mcp` with the header
  `Authorization: Bearer <token>`. If the client can't send custom headers, wrap
  the endpoint with `mcp-remote` as shown for [Claude Desktop](#claude-desktop).

## Verifying the connection

Once your client is connected, ask the agent something like *"Who am I on
QATARINA?"*. It should call the `whoami` tool and return your user profile.

You can also test the server without an agent using the
[MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```sh
$ npx @modelcontextprotocol/inspector
```

In the Inspector, pick **STDIO** with the command and arguments above (and the two
environment variables), or **Streamable HTTP** with the URL and an `Authorization`
header, then click **Connect** and **List Tools**.

## Troubleshooting

- **`401 missing bearer token` / `invalid or expired token`** (HTTP): check the
  `Authorization` header and sign in again for a fresh token. Tokens are signed
  with `auth.jwt_secret_key`, so the MCP server and the REST API must share the
  same config.
- **`email and password are required for the stdio transport`**: set
  `QATARINA_EMAIL` and `QATARINA_PASSWORD` in the client's `env`.
- **`Can't read config`**: pass `--config` with the absolute path to your
  `qatarina.yaml`.
- **Client shows the server as failed / disconnected** (stdio): run the exact
  command from your client config in a terminal to see the error, and check that
  the binary and config paths are absolute.
- **Stdio client hangs or reports invalid JSON**: make sure nothing else writes
  to stdout; check the log file configured under `logging.file` for errors.

## Security notes

- Treat tokens and the stdio credentials like passwords; don't commit them to
  shared config files such as a project `.mcp.json`, `.cursor/mcp.json` or
  `.vscode/mcp.json`.
- The MCP server has the same access as the user it runs as. Use a dedicated
  account with only the permissions the agent needs.
- The HTTP transport serves plain HTTP. If you expose it beyond `localhost`, put
  it behind a reverse proxy with TLS.
