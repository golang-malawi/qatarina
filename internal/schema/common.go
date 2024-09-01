package schema

import (
	"database/sql"
	"time"
)

func formatDate(t time.Time) string {
	return t.Format(time.DateOnly)
}

func formatDateTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

func formatSqlDateTime(t sql.NullTime) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(time.RFC3339)
}
