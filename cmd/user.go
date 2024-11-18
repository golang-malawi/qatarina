package cmd

import (
	"context"
	"fmt"
	"strings"

	"github.com/golang-malawi/qatarina/internal/common"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/golang-malawi/qatarina/internal/validation"
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
		user := &schema.NewUserRequest{
			OrgID:       0,
			FirstName:   nameparts[0],
			LastName:    nameparts[1],
			DisplayName: name.Value.String(),
			Email:       email.Value.String(),
			Password:    common.MustHashPassword(password.Value.String()),
		}

		validationErrors := validation.ValidateStruct(user)
		if validationErrors != nil {
			return fmt.Errorf("failed to create user got %v", validationErrors)
		}

		service := services.NewUserService(dbsqlc.New(qatarinaConfig.OpenDB()), logging.NewFromConfig(&qatarinaConfig.Logging))
		_, err := service.Create(context.Background(), user)
		if err != nil {
			return fmt.Errorf("failed to create user got %v", err)
		}
		fmt.Println("created user with email", user.Email)
		return nil
	},
}
