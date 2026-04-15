package cmd

import (
	"context"
	"fmt"
	"os"

	awscfg "github.com/aws/aws-sdk-go-v2/config"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/s3"
	"github.com/golang-malawi/qatarina/internal/storage"
	"github.com/golang-malawi/qatarina/internal/version"
	"github.com/lucasepe/homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile        string
	qatarinaConfig = &config.Config{}
	psqlPath       string
	logFile        string
	storageClient  storage.Storage
)

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/qatarina.toml)")
	rootCmd.PersistentFlags().Bool("vvv", true, "Verbose output")

	newUserCmd.Flags().String("name", "", "Fullname or displayname of the user")
	newUserCmd.Flags().String("email", "", "Email of the user to be used for login")
	newUserCmd.Flags().String("password", "", "Password of the user")
	userCmd.AddCommand(newUserCmd)

	createTestCaseCmd.Flags().String("title", "", "Title of the test case")
	createTestCaseCmd.Flags().String("description", "", "Description of the test case")
	createTestCaseCmd.Flags().String("kind", "", "Kind of the test case")
	createTestCaseCmd.Flags().String("code", "", "Code identifier for the test case")
	createTestCaseCmd.Flags().Int64("project", 0, "Project ID")
	createTestCaseCmd.Flags().String("module", "", "Feature or module name")
	createTestCaseCmd.Flags().Bool("draft", false, "Is this a draft")
	createTestCaseCmd.Flags().StringSlice("tags", []string{}, "Comma-separated tags")

	testCaseImporterCmd.Flags().String("repo", "", "Repository directory path")
	testCaseCmd.AddCommand(testCaseImporterCmd)
	testCaseCmd.AddCommand(createTestCaseCmd)

	rootCmd.AddCommand(serverCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(adminCmd)
	rootCmd.AddCommand(userCmd)
	rootCmd.AddCommand(testCaseCmd)
}

var rootCmd = &cobra.Command{
	Use:     "qatarina",
	Short:   "qatarina  by Golang Malawi Community",
	Version: version.Version,
	Run: func(cmd *cobra.Command, args []string) {
		os.Exit(1)
	},
}

func Execute() error {
	return rootCmd.Execute()
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := homedir.Dir()
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		viper.SetConfigName("qatarina")
		cwd, _ := os.Getwd()
		viper.AddConfigPath(cwd)
		viper.AddConfigPath(home)
		viper.AddConfigPath("/etc/qatarina.d")
	}

	if err := viper.ReadInConfig(); err != nil {
		fmt.Println("Can't read config:", err)
		os.Exit(1)
	}

	if err := viper.Unmarshal(qatarinaConfig); err != nil {
		fmt.Println("Can't read config:", err)
		os.Exit(1)
	}

	// Choose storage driver based on configuration
	switch qatarinaConfig.Storage.Driver {
	case "s3":
		ctx := context.Background()
		awsCfg, err := awscfg.LoadDefaultConfig(ctx, awscfg.WithRegion(qatarinaConfig.Storage.S3Region))
		if err != nil {
			fmt.Println("Unable to load AWS config:", err)
			os.Exit(1)
		}
		awsS3Client := awss3.NewFromConfig(awsCfg)
		storageClient = s3.NewClient(qatarinaConfig.Storage.S3Bucket, qatarinaConfig.Storage.S3Region, awsS3Client)

	case "local":
		storageClient = storage.NewLocalClient(qatarinaConfig.Storage.LocalPath)

	default:
		fmt.Println("Invalid storage driver specified in config")
		os.Exit(1)
	}
	// TODO: configure logging to file here..
}
