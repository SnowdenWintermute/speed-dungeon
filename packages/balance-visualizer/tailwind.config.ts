import type { Config } from "tailwindcss";
import uiPreset from "../ui/src/theme/tailwind-preset";

// ui's source has to be scanned here too, or its components render unstyled
const config: Config = {
  presets: [uiPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  theme: {},
  plugins: [],
};

export default config;
