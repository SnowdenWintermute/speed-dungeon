import { transform } from "next/dist/build/swc";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        "appear-keyframes": {
          "0%": {
            opacity: "0%",
          },
          "100%": {
            opacity: "100%",
          },
        },
        "spin-full-keyframes": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "slide-left-appear-keyframes": {
          "0%": { transform: "translateX(-1rem)", opacity: "0%" },
          "100%": { transform: "translateX(0rem)", opacity: "100%" },
        },
        "slide-down-appear-keyframes": {
          "0%": { transform: "translateY(-1rem)", opacity: "0%" },
          // "80%": { transform: "translateY(.2rem)", opacity: "80%" },
          "100%": { transform: "translateY(0rem)", opacity: "100%" },
        },
        "slide-down-appear-disappear-keyframes": {
          "0%": { transform: "translateY(-1rem)", opacity: "0%" },
          // "80%": { transform: "translateY(.2rem)", opacity: "80%" },
          "20%": { transform: "translateY(0rem)", opacity: "100%" },
          "100": { transform: "translateY(0rem)", opacity: "0%" },
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
        "appear-fast": "appear-keyframes .1s ease-out",
        "slide-appear-from-left": "slide-left-appear-keyframes .3s ease-out",
        "slide-appear-from-left-fast": "slide-left-appear-keyframes .1s linear",
        "slide-appear-from-top": "slide-down-appear-keyframes 1s ease-in-out",
        "slide-appear-from-top-then-disappear":
          "slide-down-appear-disappear-keyframes 2s ease-in-out",
        "up-and-down": "up-and-down-keyframes 1.5s ease-in-out infinite alternate-reverse",
        "spin-full": "spin-full-keyframes 3s linear forwards infinite",
      },
    },
  },
  plugins: [],
};
export default config;
