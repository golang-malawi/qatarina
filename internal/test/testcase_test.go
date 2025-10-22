package test

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/golang-malawi/qatarina/internal/config"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/spf13/viper"
)

func TestConcurrentMultiModuleSequence(t *testing.T) {
	const concurrency = 10
	projectID := int64(2)
	modules := []string{"login", "logistics"}

	db := openTestDB()
	conn := dbsqlc.New(db)
	logger := logging.NewForTest()
	svc := services.NewTestCaseService(db, conn, logger)

	// Pre-seed sequence rows for each module
	for _, mod := range modules {
		prefix := strings.ToLower(strings.TrimSpace(mod))
		err := conn.InitTestCaseSequence(context.Background(), dbsqlc.InitTestCaseSequenceParams{
			ProjectID: int32(projectID),
			Prefix:    prefix,
		})
		if err != nil {
			t.Fatalf("failed to seed sequence for module %q: %v", mod, err)
		}
	}

	var wg sync.WaitGroup
	wg.Add(concurrency * len(modules))

	codesCh := make(chan string, concurrency*len(modules))
	errCh := make(chan error, concurrency*len(modules))

	for _, mod := range modules {
		for i := 0; i < concurrency; i++ {
			go func(mod string, i int) {
				defer wg.Done()
				ctx := context.Background()
				req := &schema.CreateTestCaseRequest{
					ProjectID:       projectID,
					Kind:            "adhoc",
					Code:            "", // trigger auto-generation
					FeatureOrModule: mod,
					Title:           fmt.Sprintf("Concurrent test %d (%s)", i, mod),
					Description:     "Testing concurrency and module isolation",
					IsDraft:         false,
					Tags:            []string{"concurrency", mod},
				}

				res, err := svc.Create(ctx, req)
				if err != nil {
					errCh <- fmt.Errorf("module %q: %w", mod, err)
					return
				}
				codesCh <- res.Code
			}(mod, i)
		}
	}

	wg.Wait()
	close(codesCh)
	close(errCh)

	for err := range errCh {
		t.Errorf("create error: %v", err)
	}

	// Validate codes
	seen := map[string]bool{}
	counts := map[string]int{}

	for code := range codesCh {
		if len(code) < 2 {
			t.Errorf("invalid code: %s", code)
			continue
		}
		prefix := code[:2]
		counts[prefix]++

		if seen[code] {
			t.Errorf("duplicate code: %s", code)
		}
		seen[code] = true
	}

}

func openTestDB() *sql.DB {
	viper.SetConfigFile("../../qatarina.yaml")
	viper.SetConfigType("yaml")

	var cfg config.Config
	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("failed to read config: %w", err))
	}
	if err := viper.Unmarshal(&cfg); err != nil {
		panic(fmt.Errorf("failed to unmarshal config: %w", err))
	}

	// small wait to ensure DB is ready in test environments that start DB dynamically
	time.Sleep(50 * time.Millisecond)
	return cfg.OpenDB().DB
}
