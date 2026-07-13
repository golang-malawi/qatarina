package cmd

import (
	"os"

	"github.com/golang-malawi/qatarina/internal/api"
	"github.com/spf13/cobra"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the HelpAside server daemon",
	Long:  `Starts the HelpAside server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Run migrations on server startup unless the environment variable is set
		if _, ok := os.LookupEnv("QATARINA_DISABLE_MIGRATIONS_ON_STARTUP"); !ok {
			err := migrateCmd.RunE(cmd, []string{"up"})
			if err != nil {
				return err
			}
		}

		apiServer := api.NewAPI(qatarinaConfig)
		// var err error
		// apiServer.RiverClient, err = worker.StartRiverWorker(qatarinaConfig)
		// if err != nil {
		// 	return fmt.Errorf("failed to start river workers %v", err)
		// }

		return apiServer.Start(qatarinaConfig.ListenAddress())
	},
}
