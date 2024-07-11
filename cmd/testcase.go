package cmd

import (
	"context"
	"database/sql"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/google/uuid"
	"github.com/spf13/cobra"
)

var testCaseCmd = &cobra.Command{
	Use:   "test-case",
	Short: "Test Case commands",
	Run: func(cmd *cobra.Command, args []string) {

	},
}

var testCaseImporterCmd = &cobra.Command{
	Use:   "import",
	Short: "Import Test Cases from Commit history",
	RunE: func(cmd *cobra.Command, args []string) error {
		gitCommand := exec.Command("git", "log", "--oneline")
		gitCommand.Dir = cmd.Flag("repo").Value.String()

		logData, err := gitCommand.Output()
		if err != nil {
			return fmt.Errorf("failed to run gitlog on repo got %v", err)
		}

		queries := dbsqlc.New(qatarinaConfig.OpenDB())
		lines := strings.Split(string(logData), "\n")
		for _, commitEntry := range lines {
			uuidVal, _ := uuid.NewV7()
			queries.CreateTestCase(context.Background(), dbsqlc.CreateTestCaseParams{
				ID:              uuidVal,
				Kind:            dbsqlc.TestKindAdhoc,
				Code:            "None",
				FeatureOrModule: sql.NullString{},
				Title:           commitEntry,
				Description:     commitEntry,
				IsDraft:         sql.NullBool{Bool: true, Valid: true},
				Tags:            []string{"imported"},
				CreatedByID:     2,
				CreatedAt:       sql.NullTime{Time: time.Now(), Valid: true},
				UpdatedAt:       sql.NullTime{Time: time.Now(), Valid: true},
			})
		}
		return nil
	},
}
