package cmd

import (
	"fmt"
	"net"
	"os"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/mcpserver"
	"github.com/spf13/cobra"
)

var mcpCmd = &cobra.Command{
	Use:   "mcp",
	Short: "Starts the QATARINA MCP server",
	Long: `Starts the QATARINA MCP server.

The http transport (default) expects every request to carry a QATARINA JWT
as "Authorization: Bearer <token>". The stdio transport signs in once using
QATARINA_EMAIL and QATARINA_PASSWORD and runs every tool call as that user.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		mcpConfig := qatarinaConfig.MCP
		if transport, _ := cmd.Flags().GetString("transport"); transport != "" {
			mcpConfig.Transport = transport
		}
		if addr, _ := cmd.Flags().GetString("addr"); addr != "" {
			host, port, err := net.SplitHostPort(addr)
			if err != nil {
				return fmt.Errorf("invalid --addr %q: %w", addr, err)
			}
			mcpConfig.Host = host
			if _, err := fmt.Sscan(port, &mcpConfig.Port); err != nil {
				return fmt.Errorf("invalid --addr %q: %w", addr, err)
			}
		}
		if mcpConfig.Transport == "" {
			mcpConfig.Transport = config.DefaultConfig.MCP.Transport
		}
		if mcpConfig.Port == 0 {
			mcpConfig.Port = config.DefaultConfig.MCP.Port
		}
		if mcpConfig.Path == "" {
			mcpConfig.Path = config.DefaultConfig.MCP.Path
		}

		switch mcpConfig.Transport {
		case config.MCPTransportHTTP:
			server := mcpserver.New(qatarinaConfig, logging.NewFromConfig(&qatarinaConfig.Logging))
			return server.ServeHTTP(net.JoinHostPort(mcpConfig.Host, fmt.Sprint(mcpConfig.Port)), mcpConfig.Path)
		case config.MCPTransportStdio:
			// stdout is the MCP channel, so logs must go to stderr
			server := mcpserver.New(qatarinaConfig, logging.NewFromConfigWithOutput(&qatarinaConfig.Logging, os.Stderr))
			return server.ServeStdio(os.Getenv("QATARINA_EMAIL"), os.Getenv("QATARINA_PASSWORD"))
		default:
			return fmt.Errorf("unsupported MCP transport %q, expected %q or %q", mcpConfig.Transport, config.MCPTransportHTTP, config.MCPTransportStdio)
		}
	},
}
