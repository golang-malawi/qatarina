package common

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
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

func NewNullUUID(id string) uuid.NullUUID {
	if id == "" {
		return uuid.NullUUID{Valid: false}
	}
	parsed, err := uuid.Parse(id)
	if err != nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{UUID: parsed, Valid: true}
}

// func ParseDate(dateStr string) sql.NullTime {
// 	t, err := time.Parse("2006-01-02", dateStr)
// 	if err != nil {
// 		return sql.NullTime{Valid: false}
// 	}
// 	return sql.NullTime{Valid: true, Time: t}
// }
