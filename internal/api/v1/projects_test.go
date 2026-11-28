package v1_test

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
)

type stubProjectService struct {
	services.ProjectService
	err error
}

func (s stubProjectService) FindByID(context.Context, int64) (*dbsqlc.Project, error) {
	return nil, s.err
}

func TestGetOneProjectErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want int
	}{
		{"missing project returns 404", sql.ErrNoRows, http.StatusNotFound},
		{"wrapped no rows returns 404", errors.Join(errors.New("ctx"), sql.ErrNoRows), http.StatusNotFound},
		{"other errors return 500", errors.New("boom"), http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()
			app.Get("/projects/:projectID", apiv1.GetOneProject(stubProjectService{err: tt.err}, logging.NewForTest()))
			res, err := app.Test(httptest.NewRequest(http.MethodGet, "/projects/999", nil), -1)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != tt.want {
				t.Errorf("expected %d, got %d", tt.want, res.StatusCode)
			}
		})
	}
}
