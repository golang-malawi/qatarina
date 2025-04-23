import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          value: "#3483FF",
          a10: {
            value: "rgba(52,131,255,0.1)",
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
