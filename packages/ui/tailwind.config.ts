import type { Config } from "tailwindcss";
import uiPreset from "./src/theme/tailwind-preset";

// nothing builds with this config; the consuming apps scan ui's source with their own. it exists so
// the tailwind language server has a project here, since it claims files by the directory its
// config sits in and would otherwise leave the atoms with no completions. holding only the preset
// also means the atoms are offered exactly the tokens they are allowed to use, never frontend's
// game colors
const config: Config = {
  presets: [uiPreset],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {},
  plugins: [],
};

export default config;
