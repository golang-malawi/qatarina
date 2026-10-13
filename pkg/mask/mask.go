package mask

import (
	"log/slog"
	"strings"
	"unicode/utf8"
)

// DefaultMaskChar is the character used to hide masked runes.
const DefaultMaskChar = '*'

// MaskString keeps the first `visible` runes of s and replaces the rest with maskChar.
// It works on runes (not bytes), so multi-byte characters are handled correctly.
// If s has `visible` runes or fewer, the whole string is masked so short values
// are never fully exposed.
func MaskString(s string, visible int, maskChar rune) string {
	if visible < 0 {
		visible = 0
	}
	if utf8.RuneCountInString(s) <= visible {
		visible = 0
	}

	var b strings.Builder
	b.Grow(len(s))
	i := 0
	for _, r := range s {
		if i < visible {
			b.WriteRune(r)
		} else {
			b.WriteRune(maskChar)
		}
		i++
	}
	return b.String()
}

// MaskEmail masks the local part of an email (before the last '@') and keeps
// the domain, e.g. MaskEmail("johndoe@example.com", 2) => "jo*****@example.com".
// Values without a valid '@' are masked as plain strings.
func MaskEmail(email string, visible int) string {
	at := strings.LastIndex(email, "@")
	if at <= 0 {
		return MaskString(email, visible, DefaultMaskChar)
	}
	return MaskString(email[:at], visible, DefaultMaskChar) + email[at:]
}

// Email is a string type that masks itself automatically when logged with
// log/slog or printed with fmt, so raw addresses don't leak into logs.
type Email string

// VisibleChars controls how many leading characters of an Email stay visible.
var VisibleChars = 2

// LogValue implements slog.LogValuer.
func (e Email) LogValue() slog.Value {
	return slog.StringValue(MaskEmail(string(e), VisibleChars))
}

// String implements fmt.Stringer.
func (e Email) String() string {
	return MaskEmail(string(e), VisibleChars)
}
