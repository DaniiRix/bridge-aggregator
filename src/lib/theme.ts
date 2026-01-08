import { defineConfig } from "@chakra-ui/react";

export const themeConfig = defineConfig({
  globalCss: {
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "var(--chakra-colors-bg-3) transparent",
    },
    "::-webkit-scrollbar": {
      w: "6px",
      h: "6px",
    },
    "html, body": {
      margin: 0,
      padding: 0,
    },
  },
  theme: {
    keyframes: {
      slideX: {
        "0%": { transform: "translate3d(-60px, 0, 0)" },
        "100%": { transform: "translate3d(-540px, 0, 0)" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          1: { value: "#212429" },
          2: { value: "#2C2F36" },
          3: { value: "#40444F" },
          4: { value: "#565A69" },
          5: { value: "#565A69" },
          6: { value: "rgb(20 22 25)" },
          7: { value: "rgba(7,14,15,0.7)" },
          input: { value: "#141619" },
        },
        text: {
          1: { value: "#FAFAFA" },
          2: { value: "#C3C5CB" },
          3: { value: "#6C7284" },
          4: { value: "#565A69" },
          5: { value: "#2C2F36" },
        },
        shadow: {
          1: { value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
          2: {
            value:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          },
          3: {
            value:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
          4: {
            value:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          },
        },
      },
    },
  },
});
