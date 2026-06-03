package runnerclient

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/schema"
	"github.com/golang-malawi/qatarina/internal/services"
	"github.com/gorilla/websocket"
)

func StreamRunnerAndCommit(testRunService services.TestRunService, runID string, runReq *schema.TestRunRequest, runnerURL string, userID int64) error {
	// Connect to runner WebSocket
	fmt.Println("Runner ScriptPath:", runReq.ScriptPath) // TODO DELETE DEBUG LOG

	conn, _, err := websocket.DefaultDialer.Dial(runnerURL+"?file="+runReq.ScriptPath, nil)
	if err != nil {
		return err
	}
	defer conn.Close()

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

	commitReq := &schema.CommitTestRunResult{
		TestRunID:      runID,
		Notes:          "Executed via runner stream",
		IsClosed:       true,
		TestedOn:       time.Now(),
		ActualResult:   strings.Join(logs, "\n"),
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
