package common

import "database/sql"

func NullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}

func TrueNullBool() sql.NullBool {
	return sql.NullBool{Bool: true, Valid: true}
}
