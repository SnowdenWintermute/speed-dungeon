// the neutral ramp runs darkest to lightest; the rest name a role rather than a place on it.
// selected and attention hold the same value today but are separate roles, so either can move
export const THEME_TOKEN_NAMES = [
  "recessed",
  "sunken",
  "base",
  "muted",
  "emphasis",
  "hovered",
  "selected",
  "danger",
  "success",
  "attention",
] as const;

export type ThemeTokenName = (typeof THEME_TOKEN_NAMES)[number];

export type ThemePalette = Record<ThemeTokenName, string>;

export function themeCssVariableName(token: ThemeTokenName) {
  return `--theme-${token}`;
}
