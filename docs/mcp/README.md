# Qatarina MCP Server
Qatarina ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io)
server, so AI assistants and agents such as Claude Code, Claude Desktop,
VS Code and Codex can work with your Qatarina platform directly.

The MCP server is part of the `qatarina` binary and runs as its own subcommand,
`qatarina mcp`. It connects to the same database as `qatarina server` and uses the
same configuration file. Every tool call runs as an authenticated Qatarina user.

This guide covers how to run the server and connect your AI agent to it. Instructions
are given first for Linux, macOS and WSL, followed by the equivalent steps for Windows
using PowerShell.

## Prerequisites
- A built `qatarina` binary (see [Building and running](../../README.md#building-and-running)).
- A running, migrated database (`qatarina migrate`).
- A Qatarina user account that the agent will act as.
- An MCP-capable client (any of the ones under [Connecting to AI Agents](#3-connecting-to-ai-agents)).

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

**Linux, macOS and WSL**

```bash
./qatarina mcp --transport http --addr localhost:4598
./qatarina mcp --transport stdio
```

**Windows**

```powershell
.\qatarina.exe mcp --transport http --addr localhost:4598
.\qatarina.exe mcp --transport stdio
```

Use `--config /path/to/qatarina/qatarina.yaml` if the config file is not in the
current directory, your home directory or `/etc/qatarina.d`.

## 2. Choose a transport

| Transport | Best for                                              | Who starts the server | Authentication                      |
|-----------|-------------------------------------------------------|-----------------------|-------------------------------------|
| `http`    | A shared or remote server that several users connect to. | You, with `qatarina mcp` | Each request sends the user's JWT. |
| `stdio`   | A local agent on the same machine as Qatarina.        | The agent, as a child process | Signs in once with email and password. |

If you're not sure, start with **STDIO** for a local setup: it needs no token and
works with every client.

## 3. Connecting to AI Agents

The sections below explain how to connect each AI agent to Qatarina using either transport described in [Choose a transport](#2-choose-a-transport).

### Setting Up the Servers for Local Development

These servers are only required for HTTP transport. With STDIO transport, the AI agent starts the MCP server itself, so you can skip this section.

---

#### Linux, macOS and WSL

1. Open two terminals and navigate to the Qatarina root directory in both.
2. Run `go build` to ensure the executable includes the latest code changes.
3. In the first terminal, start the Qatarina server. This server issues JWT authorization tokens.

   ```bash
   ./qatarina server
   ```

4. In the second terminal, start the Qatarina MCP server.

   ```bash
   ./qatarina mcp
   ```

---

#### Windows

1. Open two PowerShell windows and navigate to the Qatarina root directory in both.
2. Run `go build` to ensure the executable includes the latest code changes.
3. In the first window, start the Qatarina server. This server issues JWT authorization tokens.

   ```powershell
   .\qatarina.exe server
   ```

4. In the second window, start the Qatarina MCP server.

   ```powershell
   .\qatarina.exe mcp
   ```

### Setting Up the Servers for Production

- To be documented.

## 4. Claude Code

For more information on integrating MCP servers with Claude Code, refer to the [official MCP quickstart guide](https://code.claude.com/docs/en/mcp-quickstart).

### Configuration scope

When you register an MCP server, Claude Code stores it in one of three scopes. The scope decides where the server is available:

| Scope | Where Qatarina is available | Stored in |
|-------|-----------------------------|-----------|
| `local` (default) | Only in the directory you ran `claude mcp add` from. Running `claude` in any other directory will not show Qatarina. | `~/.claude.json`, under that directory |
| `user` | In every directory on your machine. | `~/.claude.json` |
| `project` | For everyone working in the repository. | `.mcp.json` in the repository root |

The instructions below use `--scope user`, so that Qatarina is available wherever you start Claude Code. Avoid `--scope project`, because it writes your token or password to `.mcp.json`, which may end up committed to the repository.

To remove a server, pass the same scope it was registered with. `claude mcp get qatarina` shows the scope of an existing server.

### HTTP Transport for Local Development

**Prerequisites**

Before proceeding, ensure that:
- Claude Code is installed on your machine.
- The Qatarina server and MCP server are running locally.
- You have valid Qatarina login credentials.

---

#### Linux, macOS and WSL

**Step 1: Check the existing MCP configuration**

Open a terminal. You can run these commands from any directory.

First, list the configured MCP servers:

```bash
claude mcp list
```

To inspect the configuration and scope of an existing Qatarina MCP server, run:

```bash
claude mcp get qatarina
```

If the server is already configured but its settings need updating, remove the existing configuration before proceeding to the next step. Use the scope shown by `claude mcp get qatarina`, for example:

```bash
claude mcp remove qatarina --scope user
```

**Step 2: Obtain an authorization token**

The Qatarina server issues JWT authorization tokens that Claude Code uses to authenticate requests to the MCP server. These tokens expire, so you may need to obtain a new token when the current one expires. A more robust authentication solution is under development.

Run the following command, replacing the email and password with your Qatarina login credentials:

```bash
TOKEN=$(curl -s -X POST http://localhost:4597/v1/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"your-password"}' | jq -r .token)
```

This command authenticates with the local Qatarina server and stores the returned JWT in the `TOKEN` variable. It requires [`jq`](https://jqlang.org/download/). Without `jq`, run the `curl` command on its own and copy the `token` value from the response.

**Step 3: Register the MCP server**

Register the Qatarina MCP server with Claude Code using HTTP transport:

```bash
claude mcp add --scope user --transport http qatarina http://localhost:4598/mcp --header "Authorization: Bearer $TOKEN"
```

This registers the local MCP server for all directories and supplies the JWT as an HTTP authorization header.

**Step 4: Verify the configuration**

Run the following command to check the registered MCP servers:

```bash
claude mcp list
```

Confirm that `qatarina` appears in the list and that its connection status is `Connected`.

**Step 5: Start Claude Code**

Launch Claude Code from any directory:

```bash
claude
```

If Claude Code requests permission to use the Qatarina MCP server or its tools, review and approve the request as appropriate.

You can then interact with Qatarina through Claude Code. For example, try asking:

> What can I do on Qatarina?

---

#### Windows

**Step 1: Check the existing MCP configuration**

Open a PowerShell window. You can run these commands from any directory.

First, list the configured MCP servers:

```powershell
claude mcp list
```

To inspect the configuration and scope of an existing Qatarina MCP server, run:

```powershell
claude mcp get qatarina
```

If the server is already configured but its settings need updating, remove the existing configuration before proceeding to the next step. Use the scope shown by `claude mcp get qatarina`, for example:

```powershell
claude mcp remove qatarina --scope user
```

**Step 2: Obtain an authorization token**

The Qatarina server issues JWT authorization tokens that Claude Code uses to authenticate requests to the MCP server. These tokens expire, so you may need to obtain a new token when the current one expires. A more robust authentication solution is under development.

Run the following command in PowerShell, replacing the email and password with your Qatarina login credentials:

```powershell
$AuthorizationToken = (Invoke-RestMethod -Method Post -Uri "http://localhost:4597/v1/auth/login" -ContentType "application/json" -Body '{"email":"you@example.com","password":"your-password"}').token
```

This command authenticates with the local Qatarina server and stores the returned JWT in the `$AuthorizationToken` variable.

**Step 3: Register the MCP server**

Register the Qatarina MCP server with Claude Code using HTTP transport:

```powershell
claude mcp add --scope user --transport http qatarina http://localhost:4598/mcp --header "Authorization: Bearer $AuthorizationToken"
```

This registers the local MCP server for all directories and supplies the JWT as an HTTP authorization header.

**Step 4: Verify the configuration**

Run the following command to check the registered MCP servers:

```powershell
claude mcp list
```

Confirm that `qatarina` appears in the list and that its connection status is `Connected`.

**Step 5: Start Claude Code**

Launch Claude Code from any directory:

```powershell
claude
```

If Claude Code requests permission to use the Qatarina MCP server or its tools, review and approve the request as appropriate.

You can then interact with Qatarina through Claude Code. For example, try asking:

> What can I do on Qatarina?

### STDIO Transport for Local Development

With STDIO transport, Claude Code starts the Qatarina MCP server itself and talks to it directly, so you don't need to run `qatarina server` or `qatarina mcp` yourself, and no authorization token is required. Instead, the MCP server signs in once at startup using your Qatarina email and password.

**Prerequisites**

Before proceeding, ensure that:
- Claude Code is installed on your machine.
- Qatarina's database is running and migrated.
- You have valid Qatarina login credentials.

---

#### Linux, macOS and WSL

**Step 1: Build the executable**

Open a terminal, navigate to the Qatarina root directory and run:

```bash
go build
```

This produces the `qatarina` executable in the Qatarina root directory.

**Step 2: Find the absolute paths**

Claude Code starts the MCP server from whichever directory you run `claude` in, so the configuration must use absolute paths for both the executable and the `qatarina.yaml` configuration file.

From the Qatarina root directory, run the following command to print both paths:

```bash
echo "$PWD/qatarina"; echo "$PWD/qatarina.yaml"
```

Copy the two paths for use in the next steps.

**Step 3: Set an absolute log file path**

For the same reason, the log file configured in `qatarina.yaml` must also use an absolute path. If it is a relative path such as `qatarina.log`, the MCP server creates the log file in whichever directory you run `claude` in, and exits with `failed to setup logfile ... permission denied` if it is not allowed to write there.

Open `qatarina.yaml` and set `logging.file` to an absolute path inside the Qatarina root directory:

```yaml
logging:
  file: "/path/to/qatarina/qatarina.log"
```

**Step 4: Check the existing MCP configuration**

You can run these commands from any directory.

First, list the configured MCP servers:

```bash
claude mcp list
```

To inspect the configuration and scope of an existing Qatarina MCP server, run:

```bash
claude mcp get qatarina
```

If the server is already configured, for example using HTTP transport, remove the existing configuration before proceeding to the next step. Use the scope shown by `claude mcp get qatarina`, for example:

```bash
claude mcp remove qatarina --scope user
```

**Step 5: Register the MCP server**

Register the Qatarina MCP server with Claude Code using STDIO transport. Replace the paths with the ones obtained in Step 2, and the email and password with your Qatarina login credentials:

```bash
claude mcp add --scope user qatarina --env QATARINA_EMAIL=you@example.com --env QATARINA_PASSWORD=your-password -- /path/to/qatarina/qatarina --config /path/to/qatarina/qatarina.yaml mcp --transport stdio
```

Everything after `--` is the command Claude Code runs to start the MCP server. The path must point to the `qatarina` executable itself, not the Qatarina root directory.

**Step 6: Verify the configuration**

Run the following command to check the registered MCP servers:

```bash
claude mcp list
```

Confirm that `qatarina` appears in the list and that its connection status is `Connected`. With STDIO transport, this command starts the MCP server to check it, so a `Connected` status confirms that the paths and credentials are correct.

**Step 7: Start Claude Code**

Launch Claude Code from any directory:

```bash
claude
```

If Claude Code requests permission to use the Qatarina MCP server or its tools, review and approve the request as appropriate.

You can then interact with Qatarina through Claude Code. For example, try asking:

> Who am I on Qatarina?

---

#### Windows

**Step 1: Build the executable**

Open a PowerShell window, navigate to the Qatarina root directory and run:

```powershell
go build
```

This produces `qatarina.exe` in the Qatarina root directory.

**Step 2: Find the absolute paths**

Claude Code starts the MCP server from whichever directory you run `claude` in, so the configuration must use absolute paths for both the executable and the `qatarina.yaml` configuration file.

From the Qatarina root directory, run the following command in PowerShell to print both paths:

```powershell
(Resolve-Path .\qatarina.exe).Path; (Resolve-Path .\qatarina.yaml).Path
```

Copy the two paths for use in the next steps.

**Step 3: Set an absolute log file path**

For the same reason, the log file configured in `qatarina.yaml` must also use an absolute path. If it is a relative path such as `qatarina.log`, the MCP server creates the log file in whichever directory you run `claude` in, and exits with `failed to setup logfile ... Access is denied` if it is not allowed to write there.

Open `qatarina.yaml` and set `logging.file` to an absolute path inside the Qatarina root directory. Use forward slashes (`/`), which work on Windows and need no escaping in YAML:

```yaml
logging:
  file: "C:/path/to/qatarina/qatarina.log"
```

**Step 4: Check the existing MCP configuration**

You can run these commands from any directory.

First, list the configured MCP servers:

```powershell
claude mcp list
```

To inspect the configuration and scope of an existing Qatarina MCP server, run:

```powershell
claude mcp get qatarina
```

If the server is already configured, for example using HTTP transport, remove the existing configuration before proceeding to the next step. Use the scope shown by `claude mcp get qatarina`, for example:

```powershell
claude mcp remove qatarina --scope user
```

**Step 5: Register the MCP server**

Register the Qatarina MCP server with Claude Code using STDIO transport. Replace the paths with the ones obtained in Step 2, and the email and password with your Qatarina login credentials:

```powershell
claude mcp add --scope user qatarina --env QATARINA_EMAIL=you@example.com --env QATARINA_PASSWORD=your-password -- "C:\path\to\qatarina\qatarina.exe" --config "C:\path\to\qatarina\qatarina.yaml" mcp --transport stdio
```

Everything after `--` is the command Claude Code runs to start the MCP server. The path must point to the `qatarina.exe` file itself, not the Qatarina root directory. Unlike the JSON configuration for Claude Desktop, backslashes do not need to be escaped here.

**Step 6: Verify the configuration**

Run the following command to check the registered MCP servers:

```powershell
claude mcp list
```

Confirm that `qatarina` appears in the list and that its connection status is `Connected`. With STDIO transport, this command starts the MCP server to check it, so a `Connected` status confirms that the paths and credentials are correct.

**Step 7: Start Claude Code**

Launch Claude Code from any directory:

```powershell
claude
```

If Claude Code requests permission to use the Qatarina MCP server or its tools, review and approve the request as appropriate.

You can then interact with Qatarina through Claude Code. For example, try asking:

> Who am I on Qatarina?

### Production Environment

- To be documented.

## 5. Claude Desktop

To configure Qatarina in Claude Desktop, open **Settings → Developer → Edit Config** or edit the `claude_desktop_config.json` file directly. Claude Desktop applies its configuration everywhere, so there is no scope to choose.

Claude Desktop is available for macOS and Windows. If you use WSL, follow the Windows instructions and build Qatarina on Windows, since Claude Desktop runs on the Windows side.

### HTTP Transport for Local Development

Claude Desktop requires a local command to launch an MCP server through its configuration. To connect to Qatarina's HTTP endpoint, we'll use [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), which requires Node.js.

**Prerequisites**

Before proceeding, ensure that:
- Claude Desktop and Node.js are installed on your machine.
- The Qatarina server and MCP server are running locally.
- You have valid Qatarina login credentials.

---

#### macOS

**Step 1: Obtain an authorization token**

You can obtain the authorization token from your browser's developer tools after successfully logging in to Qatarina, or retrieve it directly from a terminal.

To retrieve it from a terminal, replace the email and password with your Qatarina login credentials:

```bash
curl -s -X POST http://localhost:4597/v1/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"your-password"}' | jq -r .token
```

This requires [`jq`](https://jqlang.org/download/). Without `jq`, run the `curl` command on its own and copy the `token` value from the response.

Copy the returned token for use in the next step.

**Step 2: Configure the MCP server**

Add the following configuration to `claude_desktop_config.json`, which is located at `~/Library/Application Support/Claude/claude_desktop_config.json`. Replace `<token>` with the authorization token obtained in the previous step.

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:4598/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer <token>"
      }
    }
  }
}
```

**Step 3: Restart Claude Desktop**

Save the configuration and fully quit Claude Desktop (choose **Claude → Quit Claude** from the menu bar, or press `Cmd+Q`; closing the window is not enough), then reopen it for the changes to take effect.

Once Claude Desktop restarts, look for Qatarina in the tools or connectors menu in the chat input. If the connection succeeds, you should be able to interact with Qatarina through Claude Desktop.

---

#### Windows

**Step 1: Obtain an authorization token**

You can obtain the authorization token from your browser's developer tools after successfully logging in to Qatarina, or retrieve it directly using PowerShell.

To retrieve it using PowerShell, replace the email and password with your Qatarina login credentials:

```powershell
(Invoke-RestMethod -Method Post -Uri "http://localhost:4597/v1/auth/login" -ContentType "application/json" -Body '{"email":"you@example.com","password":"your-password"}').token
```

Copy the returned token for use in the next step.

**Step 2: Configure the MCP server**

Add the following configuration to `claude_desktop_config.json`. Replace `<token>` with the authorization token obtained in the previous step.

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:4598/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer <token>"
      }
    }
  }
}
```

**Step 3: Restart Claude Desktop**

Save the configuration and fully quit Claude Desktop (right-click its icon in the system tray and choose **Quit**; closing the window is not enough), then reopen it for the changes to take effect.

Once Claude Desktop restarts, look for Qatarina in the tools or connectors menu in the chat input. If the connection succeeds, you should be able to interact with Qatarina through Claude Desktop.

### STDIO Transport for Local Development

With STDIO transport, Claude Desktop starts the Qatarina MCP server itself and talks to it directly, so you don't need to run `qatarina server` or `qatarina mcp` yourself, and no authorization token is required. Instead, the MCP server signs in once at startup using your Qatarina email and password.

**Prerequisites**

Before proceeding, ensure that:
- Claude Desktop is installed on your machine.
- Qatarina's database is running and migrated.
- You have valid Qatarina login credentials.

---

#### macOS

**Step 1: Build the executable**

Open a terminal, navigate to the Qatarina root directory and run:

```bash
go build
```

This produces the `qatarina` executable in the Qatarina root directory.

**Step 2: Find the absolute paths**

Claude Desktop may start the MCP server from any directory, so the configuration must use absolute paths for both the executable and the `qatarina.yaml` configuration file.

From the Qatarina root directory, run the following command to print both paths:

```bash
echo "$PWD/qatarina"; echo "$PWD/qatarina.yaml"
```

Copy the two paths for use in the next steps.

**Step 3: Set an absolute log file path**

For the same reason, the log file configured in `qatarina.yaml` must also use an absolute path. If it is a relative path such as `qatarina.log`, the MCP server tries to create the log file in Claude Desktop's own working directory, which it is not allowed to write to, and exits immediately with `failed to setup logfile`.

Open `qatarina.yaml` and set `logging.file` to an absolute path inside the Qatarina root directory:

```yaml
logging:
  file: "/path/to/qatarina/qatarina.log"
```

**Step 4: Configure the MCP server**

Add the following configuration to `claude_desktop_config.json`, which is located at `~/Library/Application Support/Claude/claude_desktop_config.json`. Replace the paths with the ones obtained in Step 2, and the email and password with your Qatarina login credentials.

The `command` must point to the `qatarina` executable itself, not the Qatarina root directory.

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "/path/to/qatarina/qatarina",
      "args": [
        "--config",
        "/path/to/qatarina/qatarina.yaml",
        "mcp",
        "--transport",
        "stdio"
      ],
      "env": {
        "QATARINA_EMAIL": "you@example.com",
        "QATARINA_PASSWORD": "your-password"
      }
    }
  }
}
```

If you previously configured Qatarina using HTTP transport, replace the existing `qatarina` entry instead of adding a second one.

**Step 5: Restart Claude Desktop**

Save the configuration and fully quit Claude Desktop (choose **Claude → Quit Claude** from the menu bar, or press `Cmd+Q`; closing the window is not enough), then reopen it for the changes to take effect.

Once Claude Desktop restarts, look for Qatarina in the tools or connectors menu in the chat input. If the connection succeeds, you should be able to interact with Qatarina through Claude Desktop. For example, try asking:

> Who am I on Qatarina?

---

#### Windows

**Step 1: Build the executable**

Open a PowerShell window, navigate to the Qatarina root directory and run:

```powershell
go build
```

This produces `qatarina.exe` in the Qatarina root directory.

**Step 2: Find the absolute paths**

Claude Desktop may start the MCP server from any directory, so the configuration must use absolute paths for both the executable and the `qatarina.yaml` configuration file.

From the Qatarina root directory, run the following command in PowerShell to print both paths:

```powershell
(Resolve-Path .\qatarina.exe).Path; (Resolve-Path .\qatarina.yaml).Path
```

Copy the two paths for use in the next steps.

**Step 3: Set an absolute log file path**

For the same reason, the log file configured in `qatarina.yaml` must also use an absolute path. If it is a relative path such as `qatarina.log`, the MCP server tries to create the log file in Claude Desktop's own directory, which it is not allowed to write to, and exits immediately with `failed to setup logfile ... Access is denied`.

Open `qatarina.yaml` and set `logging.file` to an absolute path inside the Qatarina root directory. Use forward slashes (`/`), which work on Windows and need no escaping in YAML:

```yaml
logging:
  file: "C:/path/to/qatarina/qatarina.log"
```

**Step 4: Configure the MCP server**

Add the following configuration to `claude_desktop_config.json`. Replace the paths with the ones obtained in Step 2, and the email and password with your Qatarina login credentials.

The `command` must point to the `qatarina.exe` file itself, not the Qatarina root directory. Otherwise Claude Desktop fails with `'C:\path\to\qatarina' is not recognized as an internal or external command`.

In JSON, every backslash in a Windows path must be escaped as a double backslash (`\\`). For example, `C:\opensource\qatarina\qatarina.exe` becomes `C:\\opensource\\qatarina\\qatarina.exe`.

```json
{
  "mcpServers": {
    "qatarina": {
      "command": "C:\\path\\to\\qatarina\\qatarina.exe",
      "args": [
        "--config",
        "C:\\path\\to\\qatarina\\qatarina.yaml",
        "mcp",
        "--transport",
        "stdio"
      ],
      "env": {
        "QATARINA_EMAIL": "you@example.com",
        "QATARINA_PASSWORD": "your-password"
      }
    }
  }
}
```

If you previously configured Qatarina using HTTP transport, replace the existing `qatarina` entry instead of adding a second one.

**Step 5: Restart Claude Desktop**

Save the configuration and fully quit Claude Desktop (right-click its icon in the system tray and choose **Quit**; closing the window is not enough), then reopen it for the changes to take effect.

Once Claude Desktop restarts, look for Qatarina in the tools or connectors menu in the chat input. If the connection succeeds, you should be able to interact with Qatarina through Claude Desktop. For example, try asking:

> Who am I on Qatarina?

### Production Environment

- To be documented.

## 6. VS Code MCP Copilot Extension

- To be documented.

## 7. Codex

- To be documented.

## Available tools

| Tool | What it does |
| --- | --- |
| `whoami` | Returns the profile of the user the server runs as. |
| `list_users` | Lists all users on the platform. |
| `list_projects` | Lists all projects. |
| `list_project_test_cases` | Lists a project's test cases one page at a time, with optional search. |
| `add_test_cases` | Adds up to 100 test cases to a project in one batch. |

### Adding test cases

`add_test_cases` takes a `project_id` and a list of test cases. Each test case
needs a `title`, a `description` (the steps and expected result) and a
`feature_or_module`. You can also set `kind` (defaults to `general`), `priority`
(defaults to `medium`), `preconditions`, `tags`, `is_draft` and `code`.

When you ask the agent to add test cases for a feature, it designs a set that
covers the feature and adds them all in one call. The set includes the main
success path, validation and error handling, edge cases and permissions. For
example:

> Add test cases for password reset to the Sunga project on Qatarina.

- Test cases are recorded as created by the user the MCP server runs as.
- Codes such as `SNG012` are generated when `code` is left empty. A test case
  whose code already exists in the project is skipped and counted in `skipped`.
- The batch is all or nothing. If one test case is invalid, none of them are
  added and the error names the one at fault.

## Security notes

- Treat tokens and the STDIO credentials like passwords; don't commit them to
  shared config files such as a project `.mcp.json`, `.cursor/mcp.json` or
  `.vscode/mcp.json`.
- The MCP server has the same access as the user it runs as. Use a dedicated
  account with only the permissions the agent needs.
- The HTTP transport serves plain HTTP. If you expose it beyond `localhost`, put
  it behind a reverse proxy with TLS.
