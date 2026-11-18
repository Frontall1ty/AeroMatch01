import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F9",
        panel: "#FFFFFF",
        ink: "#111827",
        muted: "#4B5563",
        rule: "#D3D9E2",
        air: "#1D4ED8",
        road: "#B45309",
        rail: "#0F766E",
        sea: "#6D28D9",
        good: "#15803D",
        bad: "#B91C1C",
      },
      fontFamily: { sans: ['"Archivo Variable"', "Archivo", "system-ui", "sans-serif"] },
      fontSize: { xs: "12px", sm: "14px", base: "16px", xl: "20px", "2xl": "28px", "5xl": "56px" },
      borderRadius: { DEFAULT: "6px" },
      boxShadow: { drawer: "-8px 0 24px rgba(17,24,39,0.18)" },
    },
  },
  plugins: [],
};
export default config;
