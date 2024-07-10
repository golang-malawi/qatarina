package cmd

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
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

		nameparts := strings.SplitN(name.Value.String(), " ", 2)

		user := dbsqlc.CreateUserParams{
			FirstName:    nameparts[0],
			LastName:     nameparts[1],
			DisplayName:  sql.NullString{String: name.Value.String(), Valid: true},
			Email:        email.Value.String(),
			Password:     common.MustHashPassword(password.Value.String()),
			IsActivated:  sql.NullBool{Bool: true, Valid: true},
			IsReviewed:   sql.NullBool{Bool: true, Valid: true},
			IsSuperAdmin: sql.NullBool{Bool: true, Valid: true},
			IsVerified:   sql.NullBool{Bool: true, Valid: true},
			CreatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
			UpdatedAt:    sql.NullTime{Time: time.Now(), Valid: true},
		}

		queries := dbsqlc.New(qatarinaConfig.OpenDB())

		_, err := queries.CreateUser(context.Background(), user)
		if err != nil {
			return fmt.Errorf("failed to create user got %v", err)
		}
		fmt.Println("created user with email", user.Email)
		return nil
	},
}
