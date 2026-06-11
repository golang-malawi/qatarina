package cmd

import (
	"fmt"
	"github.com/golang-malawi/qatarina/internal/api"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/worker"
	"github.com/spf13/cobra"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the HelpAside server daemon",
	Long:  `Starts the HelpAside server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		apiServer := api.NewAPI(qatarinaConfig)
		rawDB := qatarinaConfig.OpenDB()
		queries := dbsqlc.New(rawDB)
		riverClient, err := worker.StartRiverWorker(qatarinaConfig, queries, apiServer.NotificationService)
		if err != nil {
			return fmt.Errorf("failed to start river workers %v", err)
		}
		apiServer.RiverClient = riverClient
		return apiServer.Start(qatarinaConfig.ListenAddress())
	},
}
