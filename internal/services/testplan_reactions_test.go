package services

import "testing"

func TestIsEmoji(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"👍", true},
		{"❤️", true},
		{"👍🏽", true},
		{"1️⃣", true},
		{"🇲🇼", true},
		{"👩‍👩‍👧‍👦", true},
		{"🏳️‍🌈", true},
		{"", false},
		{"ok", false},
		{"lol 😂", false},
		{"😂\n", false},
		{"<b>", false},
		{"👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍", false},
	}
	for _, c := range cases {
		if got := isEmoji(c.in); got != c.want {
			t.Errorf("isEmoji(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}
