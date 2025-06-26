package common

import "database/sql"

func NullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value == ""}
}

func TrueNullBool() sql.NullBool {
	return sql.NullBool{Bool: true, Valid: true}
}

func NewNullInt32(i int32) sql.NullInt32 {
	return sql.NullInt32{Int32: i, Valid: true}
}
