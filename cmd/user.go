package cmd

import (
	"fmt"

	"github.com/golang-malawi/qatarina/internal/models"
	"github.com/spf13/cobra"
)

var userCmd = &cobra.Command{
	Use:   "user",
	Short: "User subcommands",
	Run: func(cmd *cobra.Command, args []string) {

	},
}

var newUserCmd = &cobra.Command{
	Use:   "new",
	Short: "Creates a new user account",
	RunE: func(cmd *cobra.Command, args []string) error {
		name := cmd.Flag("name")
		email := cmd.Flag("email")
		password := cmd.Flag("password")
		if name == nil || email == nil || password == nil {
			return fmt.Errorf("name, email and password cannot be nil or empty")
		}

		user := models.User{
			ID:          0,
			DisplayName: name.Value.String(),
			Username:    email.Value.String(),
			Password:    password.Value.String(),
		}

		fmt.Println("creating user ", user)
		return nil
	},
}
