package cmd

import (
	"context"
	"fmt"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/search"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/spf13/cobra"
)

var searchCmd = &cobra.Command{
	Use:   "search",
	Short: "Full-text search commands",
}

var searchReindexCmd = &cobra.Command{
	Use:   "reindex",
	Short: "Rebuild the search index from the test cases in the database",
	RunE: func(cmd *cobra.Command, args []string) error {
		engine, err := search.NewFromConfig(&qatarinaConfig.Search)
		if err != nil {
			return err
		}
		if !engine.Enabled() {
			return fmt.Errorf("search is disabled, set search.provider in the config to enable it")
		}

		queries := dbsqlc.New(qatarinaConfig.OpenDB())
		count, err := services.ReindexTestCases(context.Background(), queries, engine)
		if err != nil {
			return fmt.Errorf("failed to reindex test cases: %w", err)
		}
		fmt.Printf("Indexed %d test cases using %s\n", count, qatarinaConfig.Search.GetProvider())
		return nil
	},
}
