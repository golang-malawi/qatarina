package test

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	apiv1 "github.com/golang-malawi/qatarina/internal/api/v1"
	"github.com/golang-malawi/qatarina/internal/database/dbsqlc"
	"github.com/golang-malawi/qatarina/internal/logging"
	"github.com/golang-malawi/qatarina/internal/services"
)

func TestBulkTestCaseSelectionHandlers(t *testing.T) {
	db := openTestDB()
	f := newSelectAllFixture(t, db)
	logger := logging.NewForTest()
	svc := services.NewTestCaseService(db, dbsqlc.New(db), logger)

	app := fiber.New()
	app.Post("/export-file", apiv1.ExportFileFromTestCases(svc, logger))
	app.Post("/bulk-delete", apiv1.BulkDeleteTestCases(svc, logger))

	post := func(path, body string) (int, string) {
		t.Helper()
		req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		res, err := app.Test(req, -1)
		if err != nil {
			t.Fatalf("request to %s failed: %v", path, err)
		}
		defer res.Body.Close()
		data, _ := io.ReadAll(res.Body)
		return res.StatusCode, string(data)
	}

	// Nothing selected
	if status, body := post("/bulk-delete", fmt.Sprintf(`{"selection":{"project_id":%d}}`, f.projectID)); status != http.StatusBadRequest {
		t.Errorf("empty selection: expected 400, got %d: %s", status, body)
	}
	// Invalid id
	if status, body := post("/bulk-delete", fmt.Sprintf(`{"selection":{"project_id":%d,"test_case_ids":["nope"]}}`, f.projectID)); status != http.StatusBadRequest {
		t.Errorf("invalid id: expected 400, got %d: %s", status, body)
	}

	// Export everything the list shows for the project, except checkout
	status, body := post("/export-file", fmt.Sprintf(
		`{"filename":"all","fileformat":"JSON","selection":{"project_id":%d,"select_all":true,"excluded_test_case_ids":["%s"]}}`,
		f.projectID, f.checkout))
	if status != http.StatusOK {
		t.Fatalf("export: expected 200, got %d: %s", status, body)
	}
	for _, title := range []string{"Login", "Search products"} {
		if !strings.Contains(body, title) {
			t.Errorf("export: expected %q in %s", title, body)
		}
	}
	for _, title := range []string{"Checkout", "Suggested case", "Other project case"} {
		if strings.Contains(body, title) {
			t.Errorf("export: did not expect %q in %s", title, body)
		}
	}

	// Exporting without test cases or a selection is rejected
	if status, body := post("/export-file", `{"filename":"none","fileformat":"CSV"}`); status != http.StatusBadRequest {
		t.Errorf("empty export: expected 400, got %d: %s", status, body)
	}

	status, body = post("/bulk-delete", fmt.Sprintf(`{"selection":{"project_id":%d,"select_all":true,"search":"login"}}`, f.projectID))
	if status != http.StatusOK || !strings.Contains(body, `"deleted":1`) {
		t.Errorf("bulk delete: expected 200 with 1 deleted, got %d: %s", status, body)
	}
}
