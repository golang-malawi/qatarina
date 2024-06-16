package main

import (
	"log/slog"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()
	logger := slog.Default()

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		e.Router.GET("/*", apis.StaticDirectoryHandler(os.DirFS("./ui/dist"), false))
		// e.Router.GET("/*", apis.StaticDirectoryHandler(os.DirFS("./pb_public"), false))
		// e.Router.POST("/create-project/github/{user}/{repository}", nil)
		// e.Router.POST("/auto-testcases/github/{user}/{repository}", nil)
		return nil
	})

	if err := app.Start(); err != nil {
		logger.Error("failed to run server", "error", err)
	}
}
