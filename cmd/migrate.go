package cmd

import (
	"context"
	"fmt"
	"log"

	"github.com/golang-malawi/qatarina/db"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pressly/goose/v3"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivermigrate"
	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Migrates the system database",
	Long:  `Migrates the system database`,
	RunE: func(cmd *cobra.Command, args []string) error {
		dbConn := qatarinaConfig.OpenDB()

		dbPool, err := pgxpool.New(context.Background(), qatarinaConfig.GetDatabaseURL())
		if err != nil {
			return fmt.Errorf("%+v migration status", err)
		}

		defer dbConn.Close()
		defer dbPool.Close()

		log.SetFlags(0)
		goose.SetDialect("postgres")
		goose.SetBaseFS(db.MigrationsFS) //

		dbConn.MustExec("SET search_path TO public;")

		if err != nil {
			panic("failed to connect database")
		}
		// TODO: support migrate down too and specifying a migration version
		if err := goose.Up(dbConn.DB, "migrations"); err != nil { //
			panic(err)
		}
		if err := goose.Version(dbConn.DB, "migrations"); err != nil {
			log.Fatal(err)
		}

		riverMigrator := rivermigrate.New(riverpgxv5.New(dbPool), nil)
		_, err = riverMigrator.Migrate(context.Background(), rivermigrate.DirectionUp, &rivermigrate.MigrateOpts{})
		if err != nil {
			return fmt.Errorf("%+v migration status", err)
		}

		return err
	},
}
