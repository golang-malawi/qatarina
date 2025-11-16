package test

import (
	"context"
	"database/sql"
	"fmt"
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

func TestConcurrentBulkCreateByProject(t *testing.T) {
	const concurrency = 10
	projectID := int64(2)

	db := openTestDB()
	conn := dbsqlc.New(db)
	logger := logging.NewForTest()
	svc := services.NewTestCaseService(db, conn, logger)

	// Prepare test cases concurrently
	var mu sync.Mutex
	var testCases []schema.CreateTestCaseRequest
	var wg sync.WaitGroup
	wg.Add(concurrency)

	for i := 0; i < concurrency; i++ {
		go func(i int) {
			defer wg.Done()
			tc := schema.CreateTestCaseRequest{
				ProjectID:       projectID,
				Kind:            "adhoc",
				Code:            "", // trigger auto-generation
				FeatureOrModule: "login",
				Title:           fmt.Sprintf("Concurrent test %d", i),
				Description:     "Testing project-based sequence isolation",
				IsDraft:         false,
				Tags:            []string{"concurrency", "project"},
			}
			mu.Lock()
			testCases = append(testCases, tc)
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// Bulk insert
	bulkReq := &schema.BulkCreateTestCases{
		ProjectID: projectID,
		TestCases: testCases,
	}

	created, err := svc.BulkCreate(context.Background(), bulkReq)
	if err != nil {
		t.Fatalf("BulkCreate failed: %v", err)
	}

	// Validate codes
	seen := map[string]bool{}
	for _, tc := range created {
		code := tc.Code
		if len(code) < 2 {
			t.Errorf("invalid code: %s", code)
			continue
		}
		if seen[code] {
			t.Errorf("duplicate code: %s", code)
		}
		seen[code] = true
	}

	if len(seen) != concurrency {
		t.Errorf("expected %d unique codes, got %d", concurrency, len(seen))
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
