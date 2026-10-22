package common

import "testing"

func TestEscapeLikePattern(t *testing.T) {
	cases := map[string]string{
		"login":    "login",
		"100%":     `100\%`,
		"snake_id": `snake\_id`,
		`a\b`:      `a\\b`,
	}
	for in, want := range cases {
		if got := EscapeLikePattern(in); got != want {
			t.Errorf("EscapeLikePattern(%q) = %q, want %q", in, got, want)
		}
	}
}
