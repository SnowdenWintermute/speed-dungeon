import type { Config } from "tailwindcss";
import uiPreset from "../ui/src/theme/tailwind-preset";

const config: Config = {
  presets: [uiPreset],
  // any file holding a class name string has to be scanned, not just the components. class names
  // also live in lookup tables outside src/app, and in client-application's event log
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../ui/src/**/*.{ts,tsx}",
    "../common/src/**/*.ts",
    "../client-application/src/**/*.{ts,tsx}",
  ],
  theme: {
    screens: {
      phone: "480px",
      tablet: "640px",
      laptop: "1024px",
      desktop: "1280px",
    },
    extend: {
      colors: {
        beigepaper: "#988962",
        firered: "#ad252f",
        iceblue: "#2b9799",
        windgreen: "#2faa36",
        earthyellow: "#afa915",
        lightningpurple: "#703c91",
        waterblue: "#332e92",
        darknessblack: "#2e2514",
        lightwhite: "#a7a08d",
        ffxipink: "#ff9b9b",
      },
      keyframes: {
        "crit-text-keyframes": {
          "0%": {
            transform: "scale(2.5)",
          },
          "100%": {
            transform: "scale(1.25)",
          },
        },
        "up-and-down-keyframes": {
          "0%": {
            transform: "translate(-50%,-.35rem)",
          },
          "100%": {
            transform: "translate(-50%, 0rem)",
          },
        },
      },
      animation: {
        "crit-text": "crit-text-keyframes .3s ease-out",
        "up-and-down": "up-and-down-keyframes 1.5s ease-in-out infinite alternate-reverse",
      },
    },
  },
  plugins: [],
};
export default config;
