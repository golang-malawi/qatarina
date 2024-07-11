package cmd

import "github.com/spf13/cobra"

var adminCmd = &cobra.Command{
	Use:   "admin",
	Short: "Command-line administrative tools for qatarina",
	Run: func(cmd *cobra.Command, args []string) {

	},
}
