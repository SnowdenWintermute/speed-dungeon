import { CSSProperties } from "react";
import { THEME_TOKEN_NAMES, ThemePalette, themeCssVariableName } from "./tokens";

export const THEMES = {
  slate: {
    recessed: "#020617",
    sunken: "#1e293b",
    base: "#334155",
    muted: "#94a3b8",
    emphasis: "#d4d4d8",
    hovered: "#ffffff",
    selected: "#facc15",
    danger: "#f87171",
    success: "#16a34a",
    attention: "#facc15",
  },
} satisfies Record<string, ThemePalette>;

export type ThemeName = keyof typeof THEMES;

// css variables inherit down the dom tree, not the react tree, so these have to go on an element
// that contains the portals too — anything rendered into document.body would otherwise miss them
export function themeCssVariables(theme: ThemeName): CSSProperties {
  const palette = THEMES[theme];
  return Object.fromEntries(
    THEME_TOKEN_NAMES.map((token) => [themeCssVariableName(token), palette[token]])
  ) as CSSProperties;
}
