package cmd

import (
	"fmt"
	"os"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/lucasepe/homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile        string
	qatarinaConfig = &config.Config{}
	psqlPath       string
	logFile        string
)

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/qatarina.toml)")
	rootCmd.PersistentFlags().Bool("vvv", true, "Verbose output")

	newUserCmd.Flags().String("name", "", "Fullname or displayname of the user")
	newUserCmd.Flags().String("email", "", "Email of the user to be used for login")
	newUserCmd.Flags().String("password", "", "Password of the user")
	userCmd.AddCommand(newUserCmd)

	rootCmd.AddCommand(serverCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(adminCmd)
	rootCmd.AddCommand(userCmd)
}

var rootCmd = &cobra.Command{
	Use:   "qatarina",
	Short: "qatarina  by Golang Malawi Community",
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
	// TODO: configure logging to file here..
}
