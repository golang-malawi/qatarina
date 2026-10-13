package mask

import "testing"

func TestMaskString(t *testing.T) {
	tests := []struct {
		in      string
		visible int
		want    string
	}{
		{"secretvalue", 3, "sec********"},
		{"abc", 3, "***"},     // too short: fully masked
		{"ab", 5, "**"},       // too short: fully masked
		{"héllo", 2, "hé***"}, // multi-byte runes
		{"", 2, ""},
		{"abc", -1, "***"},
	}
	for _, tt := range tests {
		if got := MaskString(tt.in, tt.visible, '*'); got != tt.want {
			t.Errorf("MaskString(%q, %d) = %q, want %q", tt.in, tt.visible, got, tt.want)
		}
	}
}

func TestMaskEmail(t *testing.T) {
	tests := []struct {
		in      string
		visible int
		want    string
	}{
		{"johndoe@example.com", 2, "jo*****@example.com"},
		{"a@example.com", 2, "*@example.com"},
		{"not-an-email", 3, "not*********"},
		{"@example.com", 2, "@e**********"}, // no local part: masked as plain string
	}
	for _, tt := range tests {
		if got := MaskEmail(tt.in, tt.visible); got != tt.want {
			t.Errorf("MaskEmail(%q, %d) = %q, want %q", tt.in, tt.visible, got, tt.want)
		}
	}
}

func TestEmailStringer(t *testing.T) {
	if got := Email("jane@corp.io").String(); got != "ja**@corp.io" {
		t.Errorf("got %q", got)
	}
}
