import type { Config } from "tailwindcss";
import { THEME_TOKEN_NAMES, ThemeTokenName, themeCssVariableName } from "./tokens";

const themeColors = Object.fromEntries(
  THEME_TOKEN_NAMES.map((token) => [token, `var(${themeCssVariableName(token)})`])
) as Record<ThemeTokenName, string>;

const preset: Partial<Config> = {
  theme: { extend: { colors: { theme: themeColors } } },
};

export default preset;
