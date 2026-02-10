import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineSemanticTokens,
  defineTokens,
} from "@chakra-ui/react";

const tokens = defineTokens({
  fonts: {
    heading: {
      value:
        '"Space Grotesk", "Manrope", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    body: {
      value:
        '"Manrope", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    mono: {
      value:
        '"JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },
  sizes: {
    sidebar: { value: "16rem" },
    sidebarMobile: { value: "18rem" },
    sidebarIcon: { value: "3.25rem" },
    pageMax: { value: "80rem" },
  },
});

const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      DEFAULT: {
        value: {
          _light: "#F8F5F1",
          _dark: "#0B111A",
          _dusk: "#1B0F14",
        },
      },
      canvas: {
        value: {
          _light: "#F8F5F1",
          _dark: "#0B111A",
          _dusk: "#1B0F14",
        },
      },
      surface: {
        value: {
          _light: "#FFFFFF",
          _dark: "#121A26",
          _dusk: "#24171B",
        },
      },
      subtle: {
        value: {
          _light: "#F1ECE4",
          _dark: "#151E2B",
          _dusk: "#2A1C21",
        },
      },
      muted: {
        value: {
          _light: "#E8E1D6",
          _dark: "#1C2636",
          _dusk: "#332328",
        },
      },
      emphasized: {
        value: {
          _light: "#DED5C8",
          _dark: "#2A374B",
          _dusk: "#3B2A30",
        },
      },
      panel: {
        value: {
          _light: "#FFFFFF",
          _dark: "#0F1622",
          _dusk: "#24171B",
        },
      },
      elevated: {
        value: {
          _light: "#FFFFFF",
          _dark: "#182132",
          _dusk: "#2B1C22",
        },
      },
      inverted: {
        value: {
          _light: "#111827",
          _dark: "#F8FAFC",
          _dusk: "#F8F2E9",
        },
      },
      error: {
        value: {
          _light: "#FFF1F2",
          _dark: "#3B0A12",
          _dusk: "#3B0F12",
        },
      },
      warning: {
        value: {
          _light: "#FFF6E5",
          _dark: "#3A2A05",
          _dusk: "#3C2506",
        },
      },
      success: {
        value: {
          _light: "#ECFDF5",
          _dark: "#052B1A",
          _dusk: "#0B2B1E",
        },
      },
      info: {
        value: {
          _light: "#EEF6FF",
          _dark: "#0B1E33",
          _dusk: "#0C1C30",
        },
      },
    },
    fg: {
      DEFAULT: {
        value: {
          _light: "#1E2430",
          _dark: "#E8EEF7",
          _dusk: "#F8F2E9",
        },
      },
      heading: {
        value: {
          _light: "#111827",
          _dark: "#F1F5F9",
          _dusk: "#FFF5E8",
        },
      },
      muted: {
        value: {
          _light: "#5E6677",
          _dark: "#A6B0C3",
          _dusk: "#C7B8A2",
        },
      },
      subtle: {
        value: {
          _light: "#7A8394",
          _dark: "#8E9AAE",
          _dusk: "#AD9C86",
        },
      },
      inverted: {
        value: {
          _light: "#F8FAFC",
          _dark: "#0B111A",
          _dusk: "#1B0F14",
        },
      },
      accent: {
        value: {
          _light: "#1B6FFF",
          _dark: "#7CC4FF",
          _dusk: "#F2B84B",
        },
      },
      error: {
        value: {
          _light: "#B91C3C",
          _dark: "#FF9AB0",
          _dusk: "#FF9A9A",
        },
      },
      warning: {
        value: {
          _light: "#B45309",
          _dark: "#F5C35B",
          _dusk: "#F5C66D",
        },
      },
      success: {
        value: {
          _light: "#15803D",
          _dark: "#5FE7AC",
          _dusk: "#6BE3A3",
        },
      },
      info: {
        value: {
          _light: "#0369A1",
          _dark: "#83DDFF",
          _dusk: "#8AC4FF",
        },
      },
    },
    border: {
      DEFAULT: {
        value: {
          _light: "#E2D8CA",
          _dark: "#243044",
          _dusk: "#3A2A2F",
        },
      },
      muted: {
        value: {
          _light: "#D8CDBE",
          _dark: "#2E3C52",
          _dusk: "#4A343B",
        },
      },
      subtle: {
        value: {
          _light: "#ECE4D8",
          _dark: "#1B2432",
          _dusk: "#2E2025",
        },
      },
      emphasized: {
        value: {
          _light: "#CABCA8",
          _dark: "#3B4A64",
          _dusk: "#5A4048",
        },
      },
      inverted: {
        value: {
          _light: "#111827",
          _dark: "#E5E7EB",
          _dusk: "#F8EDE0",
        },
      },
      error: {
        value: {
          _light: "#E11D48",
          _dark: "#FF6B86",
          _dusk: "#FF6B6B",
        },
      },
      warning: {
        value: {
          _light: "#F59E0B",
          _dark: "#F5C35B",
          _dusk: "#F2B84B",
        },
      },
      success: {
        value: {
          _light: "#17B169",
          _dark: "#3DDC97",
          _dusk: "#4AD189",
        },
      },
      info: {
        value: {
          _light: "#0EA5E9",
          _dark: "#5BD1FF",
          _dusk: "#6CB4FF",
        },
      },
    },
    brand: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#0B111A", _dusk: "#2A1A1F" },
      },
      fg: {
        value: { _light: "#1B4FD1", _dark: "#7CC4FF", _dusk: "#F6C86A" },
      },
      subtle: {
        value: { _light: "#E8F1FF", _dark: "#0E2A44", _dusk: "#3C2A12" },
      },
      muted: {
        value: { _light: "#CFE2FF", _dark: "#133754", _dusk: "#4B3313" },
      },
      emphasized: {
        value: { _light: "#B7D3FF", _dark: "#1B4D70", _dusk: "#624016" },
      },
      solid: {
        value: { _light: "#1B6FFF", _dark: "#5BB5FF", _dusk: "#F2B84B" },
      },
      focusRing: {
        value: { _light: "#5A9BFF", _dark: "#5BB5FF", _dusk: "#F2B84B" },
      },
    },
    success: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#0A1610", _dusk: "#121E16" },
      },
      fg: {
        value: { _light: "#15803D", _dark: "#5FE7AC", _dusk: "#6BE3A3" },
      },
      subtle: {
        value: { _light: "#E8F8F0", _dark: "#0F2B1F", _dusk: "#12271C" },
      },
      muted: {
        value: { _light: "#CFF1DF", _dark: "#153A2A", _dusk: "#173223" },
      },
      emphasized: {
        value: { _light: "#B5E8CF", _dark: "#1C4C38", _dusk: "#1F4030" },
      },
      solid: {
        value: { _light: "#17B169", _dark: "#3DDC97", _dusk: "#4AD189" },
      },
      focusRing: {
        value: { _light: "#24C47A", _dark: "#3DDC97", _dusk: "#4AD189" },
      },
    },
    warning: {
      contrast: {
        value: { _light: "#221207", _dark: "#1A1207", _dusk: "#2A1A08" },
      },
      fg: {
        value: { _light: "#B45309", _dark: "#F3C46F", _dusk: "#F5C66D" },
      },
      subtle: {
        value: { _light: "#FFF3D6", _dark: "#2F1D0A", _dusk: "#35210B" },
      },
      muted: {
        value: { _light: "#FFE2AD", _dark: "#3D260C", _dusk: "#45290D" },
      },
      emphasized: {
        value: { _light: "#FFD68A", _dark: "#4F3010", _dusk: "#563311" },
      },
      solid: {
        value: { _light: "#F59E0B", _dark: "#F5C35B", _dusk: "#F2B84B" },
      },
      focusRing: {
        value: { _light: "#F59E0B", _dark: "#F5C35B", _dusk: "#F2B84B" },
      },
    },
    danger: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#1C0A0F", _dusk: "#2B0E0E" },
      },
      fg: {
        value: { _light: "#B91C3C", _dark: "#FF8EA3", _dusk: "#FF9A9A" },
      },
      subtle: {
        value: { _light: "#FFE4E9", _dark: "#3B111C", _dusk: "#3B1111" },
      },
      muted: {
        value: { _light: "#FFC3D1", _dark: "#4C1625", _dusk: "#4C1616" },
      },
      emphasized: {
        value: { _light: "#FFA3BB", _dark: "#5E1E31", _dusk: "#5F1E1E" },
      },
      solid: {
        value: { _light: "#E11D48", _dark: "#FF6B86", _dusk: "#FF6B6B" },
      },
      focusRing: {
        value: { _light: "#E11D48", _dark: "#FF6B86", _dusk: "#FF6B6B" },
      },
    },
    info: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#03131C", _dusk: "#0B1A2B" },
      },
      fg: {
        value: { _light: "#0369A1", _dark: "#83DDFF", _dusk: "#8AC4FF" },
      },
      subtle: {
        value: { _light: "#E6F6FF", _dark: "#0B2838", _dusk: "#11243A" },
      },
      muted: {
        value: { _light: "#C6ECFF", _dark: "#0F3447", _dusk: "#162F48" },
      },
      emphasized: {
        value: { _light: "#A6E2FF", _dark: "#164659", _dusk: "#1C3B59" },
      },
      solid: {
        value: { _light: "#0EA5E9", _dark: "#5BD1FF", _dusk: "#6CB4FF" },
      },
      focusRing: {
        value: { _light: "#0EA5E9", _dark: "#5BD1FF", _dusk: "#6CB4FF" },
      },
    },
  },
  shadows: {
    card: {
      value: {
        _light:
          "0px 18px 40px rgba(16, 24, 40, 0.08), 0px 0px 1px rgba(16, 24, 40, 0.12)",
        _dark:
          "0px 18px 40px rgba(0, 0, 0, 0.55), 0px 0px 1px rgba(255, 255, 255, 0.08)",
        _dusk:
          "0px 18px 40px rgba(0, 0, 0, 0.45), 0px 0px 1px rgba(255, 235, 205, 0.12)",
      },
    },
    outline: {
      value: {
        _light: "0 0 0 1px rgba(27, 111, 255, 0.4)",
        _dark: "0 0 0 1px rgba(91, 181, 255, 0.55)",
        _dusk: "0 0 0 1px rgba(242, 184, 75, 0.55)",
      },
    },
  },
});

const config = defineConfig({
  conditions: {
    dusk: ".dusk &, .dusk .chakra-theme:not(.light) &",
  },
  globalCss: {
    body: {
      backgroundColor: "bg.canvas",
      color: "fg",
      minHeight: "100dvh",
      backgroundImage:
        "radial-gradient(80rem 40rem at 10% -10%, var(--chakra-colors-brand-subtle) 0%, transparent 60%), radial-gradient(70rem 30rem at 90% 0%, var(--chakra-colors-info-subtle) 0%, transparent 55%)",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat",
    },
  },
  theme: {
    tokens,
    semanticTokens,
  },
});

export const system = createSystem(defaultConfig, config);
