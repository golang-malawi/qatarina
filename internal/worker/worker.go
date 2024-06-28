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
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
)

func StartRiverWorker(config *config.Config) (*river.Client[pgx.Tx], error) {
	workers := river.NewWorkers()
	//river.AddWorker(workers, jobs.NewBulkMailerWorker(apiServer.DocsMailer()))

	dbPool, err := pgxpool.New(context.Background(), config.GetDatabaseURL())
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

	sigintOrTerm := make(chan os.Signal, 1)
	signal.Notify(sigintOrTerm, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigintOrTerm
		// fmt.Printf("Received SIGINT/SIGTERM; initiating soft stop (try to wait for jobs to finish)\n")

		softStopCtx, softStopCtxCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer softStopCtxCancel()

		err := riverClient.Stop(softStopCtx)
		if err != nil && !errors.Is(err, context.DeadlineExceeded) && !errors.Is(err, context.Canceled) {
			panic(err)
		}

		if err == nil {
			os.Exit(-1)
			return
		}

		go func() {
			select {
			case <-sigintOrTerm:
				// fmt.Printf("Received SIGINT/SIGTERM again; initiating hard stop (cancel everything)\n")
				softStopCtxCancel()
			case <-softStopCtx.Done():
				// fmt.Printf("Soft stop timeout; initiating hard stop (cancel everything)\n")
			}
		}()

		hardStopCtx, hardStopCtxCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer hardStopCtxCancel()

		// As long as all jobs respect context cancellation, StopAndCancel will
		// always work. However, in the case of a bug where a job blocks despite
		// being cancelled, it may be necessary to either ignore River's stop
		// result (what's shown here) or have a supervisor kill the process.
		err = riverClient.StopAndCancel(hardStopCtx)
		if err != nil && errors.Is(err, context.DeadlineExceeded) {
			fmt.Printf("Hard stop timeout; ignoring stop procedure and exiting unsafely\n")
			os.Exit(-1)
		} else if err != nil {
			panic(err)
		}

		if err == nil {
			os.Exit(-1)
			return
		}
	}()

	return riverClient, nil
}
