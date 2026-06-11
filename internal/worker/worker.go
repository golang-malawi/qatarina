package worker

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/worker/jobs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
)

func StartRiverWorker(cfg *config.Config, queries *dbsqlc.Queries, logger logging.Logger) (*river.Client[pgx.Tx], error) {
	workers := river.NewWorkers()
	// river.AddWorker(workers, jobs.NewBulkMailerWorker(apiServer.DocsMailer()))

	dbPool, err := pgxpool.New(context.Background(), cfg.GetDatabaseURL())
	if err != nil {
		return nil, err
	}

	riverClient, err := river.NewClient(riverpgxv5.New(dbPool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 100},
		},
		Workers: workers,
	})
	if err != nil {
		return nil, err
	}

	// Run the client inline. All executed jobs will inherit from ctx:
	if err := riverClient.Start(context.Background()); err != nil {
		return nil, err
	}

	// Launch digest scheduler loop (every 1 hour)
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				ctx := context.Background()
				if err := jobs.ScheduleDigestNotifications(ctx, riverClient, queries, logger); err != nil {
					logger.Error("failed to schedule digest notifications", "error", err)
				}
			}
		}
	}()

	// Handle graceful shutdown
	sigintOrTerm := make(chan os.Signal, 1)
	signal.Notify(sigintOrTerm, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigintOrTerm

		softStopCtx, softStopCtxCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer softStopCtxCancel()

		err := riverClient.Stop(softStopCtx)
		if err != nil && !errors.Is(err, context.DeadlineExceeded) && !errors.Is(err, context.Canceled) {
			panic(err)
		}

		// Escalate to hard stop if needed
		go func() {
			select {
			case <-sigintOrTerm:
				softStopCtxCancel()
			case <-softStopCtx.Done():
			}
		}()

		hardStopCtx, hardStopCtxCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer hardStopCtxCancel()

		err = riverClient.StopAndCancel(hardStopCtx)
		if err != nil && errors.Is(err, context.DeadlineExceeded) {
			fmt.Printf("Hard stop timeout; ignoring stop procedure and exiting unsafely\n")
			os.Exit(-1)
		} else if err != nil {
			panic(err)
		}

		os.Exit(-1)
	}()

	return riverClient, nil
}
