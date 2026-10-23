package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/golang-malawi/qatarina/internal/api"
	"github.com/golang-malawi/qatarina/internal/storage"
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

		storageConfig := qatarinaConfig.Storage
		if storageConfig.Driver == storage.DriverS3 && storageConfig.S3Bucket == "" {
			fmt.Println("Storage driver is s3 but no s3_bucket is configured, falling back to local storage")
		}
		fs, err := storage.New(context.Background(), storageConfig)
		if err != nil {
			return fmt.Errorf("failed to initialise storage: %w", err)
		}
		fmt.Println("Using", storage.ResolveDriver(storageConfig), "storage for uploaded files")

		apiServer := api.NewAPI(qatarinaConfig, fs)
		// var err error
		// apiServer.RiverClient, err = worker.StartRiverWorker(qatarinaConfig)
		// if err != nil {
		// 	return fmt.Errorf("failed to start river workers %v", err)
		// }

		return apiServer.Start(qatarinaConfig.ListenAddress())
	},
}
