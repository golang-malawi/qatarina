package cmd

import (
	"context"
	"database/sql"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/common"
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

var createTestCaseCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new test case manually",
	RunE: func(cmd *cobra.Command, args []string) error {
		title, _ := cmd.Flags().GetString("title")
		description, _ := cmd.Flags().GetString("description")
		kind, _ := cmd.Flags().GetString("kind")
		code, _ := cmd.Flags().GetString("code")
		projectID, _ := cmd.Flags().GetInt64("project")
		module, _ := cmd.Flags().GetString("module")
		isDraft, _ := cmd.Flags().GetBool("draft")
		tags, _ := cmd.Flags().GetStringSlice("tags")

		if title == "" || kind == "" || projectID == 0 {
			return fmt.Errorf("title, kind, and project ID are required")
		}

		queries := dbsqlc.New(qatarinaConfig.OpenDB())
		uuidVal, _ := uuid.NewV7()

		params := dbsqlc.CreateTestCaseParams{
			ID:              uuidVal,
			ProjectID:       common.NewNullInt32(int32(projectID)),
			Kind:            dbsqlc.TestKind(kind),
			Code:            code,
			FeatureOrModule: common.NullString(module),
			Title:           title,
			Description:     description,
			IsDraft:         common.NewNullBool(isDraft),
			Tags:            tags,
			CreatedByID:     1,
			CreatedAt:       common.NullTime(time.Now()),
			UpdatedAt:       common.NewNullTime(time.Now()),
		}

		_, err := queries.CreateTestCase(context.Background(), params)
		if err != nil {
			return fmt.Errorf("failed to create test case: %w", err)
		}

		fmt.Printf("Test case created!\nID: %s\nTitle: %s\n", uuidVal.String(), title)
		return nil
	},
}
