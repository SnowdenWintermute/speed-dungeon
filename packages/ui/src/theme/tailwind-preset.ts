import type { Config } from "tailwindcss";
import { THEME_TOKEN_NAMES, ThemeTokenName, themeCssVariableName } from "./tokens";

const themeColors = Object.fromEntries(
  THEME_TOKEN_NAMES.map((token) => [token, `var(${themeCssVariableName(token)})`])
) as Record<ThemeTokenName, string>;

// generic motion belongs with the components that use it. game feedback like crit-text and
// up-and-down stays in the consuming app
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: { theme: themeColors },
      keyframes: {
        "appear-keyframes": {
          "0%": { opacity: "0%" },
          "100%": { opacity: "100%" },
        },
        "spin-full-keyframes": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "slide-left-appear-keyframes": {
          "0%": { transform: "translateX(-1rem)", opacity: "0%" },
          "100%": { transform: "translateX(0rem)", opacity: "100%" },
        },
        "slide-down-appear-keyframes": {
          "0%": { transform: "translateY(-1rem)", opacity: "0%" },
          "100%": { transform: "translateY(0rem)", opacity: "100%" },
        },
        "slide-down-appear-disappear-keyframes": {
          "0%": { transform: "translateY(-1rem)", opacity: "0%" },
          "20%": { transform: "translateY(0rem)", opacity: "100%" },
          "100": { transform: "translateY(0rem)", opacity: "0%" },
        },
      },
      animation: {
        "appear-fast": "appear-keyframes .1s ease-out",
        "spin-full": "spin-full-keyframes 3s linear forwards infinite",
        "slide-appear-from-left": "slide-left-appear-keyframes .3s ease-out",
        "slide-appear-from-left-fast": "slide-left-appear-keyframes .1s linear",
        "slide-appear-from-top": "slide-down-appear-keyframes 1s ease-in-out",
        "slide-appear-from-top-then-disappear":
          "slide-down-appear-disappear-keyframes 2s ease-in-out",
      },
    },
  },
};

export default preset;
