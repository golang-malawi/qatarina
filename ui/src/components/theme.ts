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
        '"Geist", "Satoshi", "Space Grotesk", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    body: {
      value:
        '"Geist", "Satoshi", "Manrope", "Segoe UI", system-ui, -apple-system, sans-serif',
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
          _light: "#F7F8FA",
          _dark: "#0B0D12",
        },
      },
      canvas: {
        value: {
          _light: "#F7F8FA",
          _dark: "#0B0D12",
        },
      },
      surface: {
        value: {
          _light: "#FFFFFF",
          _dark: "#11131A",
        },
      },
      subtle: {
        value: {
          _light: "#F2F3F5",
          _dark: "#171A22",
        },
      },
      muted: {
        value: {
          _light: "#E9EBF0",
          _dark: "#1D212B",
        },
      },
      emphasized: {
        value: {
          _light: "#DDE1E9",
          _dark: "#262B37",
        },
      },
      panel: {
        value: {
          _light: "#FFFFFF",
          _dark: "#0F1117",
        },
      },
      elevated: {
        value: {
          _light: "#FFFFFF",
          _dark: "#151923",
        },
      },
      inverted: {
        value: {
          _light: "#0B0D12",
          _dark: "#F7F8FA",
        },
      },
      error: {
        value: {
          _light: "#FFF1F2",
          _dark: "#2B1114",
        },
      },
      warning: {
        value: {
          _light: "#FFF7ED",
          _dark: "#2B1E12",
        },
      },
      success: {
        value: {
          _light: "#ECFDF3",
          _dark: "#0F1F18",
        },
      },
      info: {
        value: {
          _light: "#EFF6FF",
          _dark: "#0F1A2B",
        },
      },
    },
    fg: {
      DEFAULT: {
        value: {
          _light: "#0B0D12",
          _dark: "#E4E8F0",
        },
      },
      heading: {
        value: {
          _light: "#0B0D12",
          _dark: "#F7F8FB",
        },
      },
      muted: {
        value: {
          _light: "#6B7280",
          _dark: "#A7B0C0",
        },
      },
      subtle: {
        value: {
          _light: "#8B93A7",
          _dark: "#8B95A7",
        },
      },
      inverted: {
        value: {
          _light: "#F7F8FA",
          _dark: "#0B0D12",
        },
      },
      accent: {
        value: {
          _light: "#5E6AD2",
          _dark: "#8DA2FF",
        },
      },
      error: {
        value: {
          _light: "#B42318",
          _dark: "#FF8389",
        },
      },
      warning: {
        value: {
          _light: "#B54708",
          _dark: "#F4B66A",
        },
      },
      success: {
        value: {
          _light: "#027A48",
          _dark: "#6EE7B7",
        },
      },
      info: {
        value: {
          _light: "#1D4ED8",
          _dark: "#93C5FD",
        },
      },
    },
    border: {
      DEFAULT: {
        value: {
          _light: "#E2E6EE",
          _dark: "#2A303B",
        },
      },
      muted: {
        value: {
          _light: "#D5DBE7",
          _dark: "#343B47",
        },
      },
      subtle: {
        value: {
          _light: "#EEF1F6",
          _dark: "#20262F",
        },
      },
      emphasized: {
        value: {
          _light: "#C5CEDB",
          _dark: "#3E4656",
        },
      },
      inverted: {
        value: {
          _light: "#0B0D12",
          _dark: "#E6E9F0",
        },
      },
      error: {
        value: {
          _light: "#F04438",
          _dark: "#FF6B6B",
        },
      },
      warning: {
        value: {
          _light: "#F79009",
          _dark: "#F5C057",
        },
      },
      success: {
        value: {
          _light: "#12B76A",
          _dark: "#4ADE80",
        },
      },
      info: {
        value: {
          _light: "#2E90FA",
          _dark: "#5BA5FF",
        },
      },
    },
    brand: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#0B0D12" },
      },
      fg: {
        value: { _light: "#4F5BD8", _dark: "#A6B0FF" },
      },
      subtle: {
        value: { _light: "#EEF0FF", _dark: "#1A1E2D" },
      },
      muted: {
        value: { _light: "#E1E5FF", _dark: "#22293A" },
      },
      emphasized: {
        value: { _light: "#C9D1FF", _dark: "#2D3450" },
      },
      solid: {
        value: { _light: "#5E6AD2", _dark: "#7E8CFF" },
      },
      focusRing: {
        value: { _light: "#7B85F0", _dark: "#8FA0FF" },
      },
    },
    success: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#0A1610" },
      },
      fg: {
        value: { _light: "#027A48", _dark: "#6EE7B7" },
      },
      subtle: {
        value: { _light: "#E9F7EF", _dark: "#0F2B1F" },
      },
      muted: {
        value: { _light: "#CFF1DF", _dark: "#153A2A" },
      },
      emphasized: {
        value: { _light: "#B5E8CF", _dark: "#1C4C38" },
      },
      solid: {
        value: { _light: "#12B76A", _dark: "#3DDC97" },
      },
      focusRing: {
        value: { _light: "#24C47A", _dark: "#3DDC97" },
      },
    },
    warning: {
      contrast: {
        value: { _light: "#221207", _dark: "#1A1207" },
      },
      fg: {
        value: { _light: "#B54708", _dark: "#F4B66A" },
      },
      subtle: {
        value: { _light: "#FFF3D6", _dark: "#2F1D0A" },
      },
      muted: {
        value: { _light: "#FFE2AD", _dark: "#3D260C" },
      },
      emphasized: {
        value: { _light: "#FFD68A", _dark: "#4F3010" },
      },
      solid: {
        value: { _light: "#F79009", _dark: "#F5C35B" },
      },
      focusRing: {
        value: { _light: "#F59E0B", _dark: "#F5C35B" },
      },
    },
    danger: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#1C0A0F" },
      },
      fg: {
        value: { _light: "#B42318", _dark: "#FF8389" },
      },
      subtle: {
        value: { _light: "#FFE4E9", _dark: "#3B111C" },
      },
      muted: {
        value: { _light: "#FFC3D1", _dark: "#4C1625" },
      },
      emphasized: {
        value: { _light: "#FFA3BB", _dark: "#5E1E31" },
      },
      solid: {
        value: { _light: "#F04438", _dark: "#FF6B6B" },
      },
      focusRing: {
        value: { _light: "#F04438", _dark: "#FF6B6B" },
      },
    },
    info: {
      contrast: {
        value: { _light: "#FFFFFF", _dark: "#03131C" },
      },
      fg: {
        value: { _light: "#1D4ED8", _dark: "#93C5FD" },
      },
      subtle: {
        value: { _light: "#E6F0FF", _dark: "#0B2838" },
      },
      muted: {
        value: { _light: "#CFE0FF", _dark: "#0F3447" },
      },
      emphasized: {
        value: { _light: "#BBD2FF", _dark: "#164659" },
      },
      solid: {
        value: { _light: "#2E90FA", _dark: "#5BA5FF" },
      },
      focusRing: {
        value: { _light: "#2E90FA", _dark: "#5BA5FF" },
      },
    },
  },
  shadows: {
    card: {
      value: {
        _light:
          "0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 0 rgba(15, 23, 42, 0.06)",
        _dark:
          "0 12px 40px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
    },
    outline: {
      value: {
        _light: "0 0 0 1px rgba(94, 106, 210, 0.4)",
        _dark: "0 0 0 1px rgba(126, 140, 255, 0.45)",
      },
    },
  },
});

const config = defineConfig({
  globalCss: {
    body: {
      backgroundColor: "bg.canvas",
      color: "fg",
      minHeight: "100dvh",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      backgroundImage:
        "radial-gradient(90rem 45rem at 10% -20%, var(--chakra-colors-brand-subtle) 0%, transparent 60%), radial-gradient(70rem 35rem at 90% -10%, var(--chakra-colors-info-subtle) 0%, transparent 55%)",
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
