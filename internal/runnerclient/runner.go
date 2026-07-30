package runnerclient

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/gorilla/websocket"
)

func StreamRunnerAndCommit(testRunService services.TestRunService, runID string, runReq *schema.TestRunRequest, runnerURL string, userID int64) error {
	// Connect to runner WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(runnerURL, nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	// Notify subscribers that the run has started
	_ = testRunService.PublishLog(runID, schema.RunnerMessage{
		Type:    "status",
		Content: "started",
	})

	// If a script path is provided, read the file contents and send them
	// to the runner over the already-open WebSocket connection. This
	// avoids passing an OS-specific file path to the runner which it may
	// not understand.
	if runReq != nil && strings.TrimSpace(runReq.ScriptPath) != "" {
		data, err := os.ReadFile(runReq.ScriptPath)
		if err != nil {
			return fmt.Errorf("failed to read script at %s: %w", runReq.ScriptPath, err)
		}
		// Prepare a simple JSON payload with the script name and content.
		payload := map[string]string{
			"type":    "script",
			"name":    filepath.Base(runReq.ScriptPath),
			"content": string(data),
		}
		// Include runner hint if available
		if runReq.Runner != "" {
			payload["runner"] = runReq.Runner
		}
		// Indicate that runner should start executing after receiving the script
		payload["action"] = "run"
		if err := conn.WriteJSON(payload); err != nil {
			return fmt.Errorf("failed to send script to runner: %w", err)
		}
	}

	// also send a minimal run command if no script was attached but runner should still start
	if runReq == nil || strings.TrimSpace(runReq.ScriptPath) == "" {
		_ = conn.WriteJSON(map[string]string{"type": "command", "action": "run"})
	}

	var logs []string
	var finalState dbsqlc.TestRunState = dbsqlc.TestRunStatePending

	for {
		var msg schema.RunnerMessage
		if err := conn.ReadJSON(&msg); err != nil {
			break // stream ended
		}
		logs = append(logs, fmt.Sprintf("[%s] %s", msg.Type, msg.Content))

		// Push logs live to frontend
		testRunService.PublishLog(runID, msg)

		if msg.Type == "stderr" {
			finalState = dbsqlc.TestRunStateFailed
		}
	}

	if finalState == dbsqlc.TestRunStatePending {
		finalState = dbsqlc.TestRunStatePassed
	}

	actualResult := strings.Join(logs, "\n")
	if strings.TrimSpace(actualResult) == "" {
		actualResult = fmt.Sprintf("No logs from runner. Final state: %s", finalState)
	}

	commitReq := &schema.CommitTestRunResult{
		TestRunID:      runID,
		Notes:          "Executed via runner stream",
		IsClosed:       true,
		TestedOn:       time.Now(),
		ActualResult:   actualResult,
		ExpectedResult: "Script assertions",
		State:          finalState,
		UserID:         userID,
	}

	_, err = testRunService.Commit(context.Background(), commitReq)
	if err != nil {
		return err
	}

	testRunService.PublishLog(runID, schema.RunnerMessage{
		Type:    "status",
		Content: fmt.Sprintf("Run completed with state: %s", finalState),
	})

	return nil
}
