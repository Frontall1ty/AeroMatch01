import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F3F1",
        panel: "#FFFFFF",
        ink: "#0E0E10",
        muted: "#56565C",
        rule: "#DCDCD6",
        // modes: they only ever identify a mode
        air: "#2F4FD0",
        road: "#8A5A00",
        rail: "#237A35",
        sea: "#6D3FD0",
        good: "#15803D",
        bad: "#B91C1C",
        // actions: ink on light surfaces; the signal orange on dark ones (always with ink text on it)
        ion: { DEFAULT: "#0E0E10", bright: "#FF5B1F", dark: "#2A2A2E" },
        // the one accent: marks, featured actions, the stats band. Never as text on a light surface.
        signal: "#FF5B1F",
        // dark surfaces: the site's top and bottom, and the admin console
        console: { DEFAULT: "#0E0E10", raised: "#18181B", rule: "#2C2C30", text: "#F4F4F2", muted: "#A1A1A8" },
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', "DM Sans", "system-ui", "sans-serif"],
        display: ['"Cal Sans"', '"DM Sans Variable"', "system-ui", "sans-serif"],
      },
      fontSize: { xs: "12px", sm: "14px", base: "16px", xl: "20px", "2xl": "28px", "5xl": "56px" },
      borderRadius: { DEFAULT: "4px" },
      boxShadow: { drawer: "-8px 0 24px rgba(17,24,39,0.18)" },
    },
  },
  plugins: [],
};
export default config;
