package config

import "testing"

func TestGetMaxModuleDepth(t *testing.T) {
	cases := []struct {
		configured int
		want       int
	}{
		{0, DefaultMaxModuleDepth},
		{-3, DefaultMaxModuleDepth},
		{1, 1},
		{6, 6},
		{8, 8},
		{20, LimitMaxModuleDepth},
	}
	for _, c := range cases {
		p := PlatformConfiguration{MaxModuleDepth: c.configured}
		if got := p.GetMaxModuleDepth(); got != c.want {
			t.Errorf("GetMaxModuleDepth() with %d = %d, want %d", c.configured, got, c.want)
		}
	}
}
