package common

import (
	"database/sql"
	"time"
)

func NullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}

func TrueNullBool() sql.NullBool {
	return sql.NullBool{Bool: true, Valid: true}
}

func FalseNullBool() sql.NullBool {
	return sql.NullBool{Bool: false, Valid: true}
}

func NewNullBool(b bool) sql.NullBool {
	return sql.NullBool{Bool: b, Valid: true}
}

func NewNullInt32(i int32) sql.NullInt32 {
	return sql.NullInt32{Int32: i, Valid: true}
}

func NewNullTime(t time.Time) sql.NullTime {
	return sql.NullTime{Time: t, Valid: true}
}

func NullTime(t time.Time) sql.NullTime {
	return sql.NullTime{
		Time:  t,
		Valid: !t.IsZero(),
	}
}

// FormatSqlDateTime converts time.Time or sql.NullTime into RFC3339 string
func FormatSqlDateTime(t interface{}) string {
	switch v := t.(type) {
	case time.Time:
		return v.Format(time.RFC3339)
	case sql.NullTime:
		if v.Valid {
			return v.Time.Format(time.RFC3339)
		}
	case *time.Time:
		if v != nil {
			return v.Format(time.RFC3339)
		}
	}
	return ""
}

// func ParseDate(dateStr string) sql.NullTime {
// 	t, err := time.Parse("2006-01-02", dateStr)
// 	if err != nil {
// 		return sql.NullTime{Valid: false}
// 	}
// 	return sql.NullTime{Valid: true, Time: t}
// }
