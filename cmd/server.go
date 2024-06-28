package cmd

import (
	"github.com/golang-malawi/qatarina/internal/api"
	"github.com/spf13/cobra"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the HelpAside server daemon",
	Long:  `Starts the HelpAside server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		apiServer := api.NewAPI(qatarinaConfig)
		// var err error
		// apiServer.RiverClient, err = worker.StartRiverWorker(qatarinaConfig)
		// if err != nil {
		// 	return fmt.Errorf("failed to start river workers %v", err)
		// }

		return apiServer.Start(qatarinaConfig.ListenAddress())
	},
}
