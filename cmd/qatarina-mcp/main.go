// Command qatarina-mcp is a minimal MCP server for QATARINA.
//
// It talks to a running QATARINA server over its REST API and exposes:
//   - whoami:     log in and show the authenticated user
//   - list_users: list all users on the platform
//
// Configuration (environment variables):
//
//	QATARINA_URL       base URL of the QATARINA server (default http://localhost:4597)
//	QATARINA_EMAIL     login email
//	QATARINA_PASSWORD  login password
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	baseURL := getenv("QATARINA_URL", "http://localhost:4597")
	email := os.Getenv("QATARINA_EMAIL")
	password := os.Getenv("QATARINA_PASSWORD")
	if email == "" || password == "" {
		// stdout is the MCP channel, so errors must go to stderr.
		log.Fatal("QATARINA_EMAIL and QATARINA_PASSWORD must be set")
	}

	client := NewClient(baseURL, email, password)

	s := server.NewMCPServer(
		"qatarina",
		"0.1.0",
		server.WithToolCapabilities(false),
		server.WithInstructions("Tools for the QATARINA test management platform."),
	)

	s.AddTool(
		mcp.NewTool("whoami",
			mcp.WithDescription("Log in to QATARINA and return the authenticated user's id, name and email."),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			login, err := client.Login(ctx)
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(fmt.Sprintf(
				"Logged in as %s <%s> (user id %d)", login.DisplayName, login.Email, login.UserID,
			)), nil
		},
	)

	s.AddTool(
		mcp.NewTool("list_users",
			mcp.WithDescription("List all users on the QATARINA platform."),
			mcp.WithReadOnlyHintAnnotation(true),
			mcp.WithDestructiveHintAnnotation(false),
		),
		func(ctx context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			users, err := client.Get(ctx, "/v1/users")
			if err != nil {
				return mcp.NewToolResultError(err.Error()), nil
			}
			return mcp.NewToolResultText(string(users)), nil
		},
	)

	if err := server.ServeStdio(s); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
