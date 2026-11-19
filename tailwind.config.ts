import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F5F8",
        panel: "#FFFFFF",
        ink: "#0F1B2D",
        muted: "#475569",
        rule: "#D6DEE8",
        // modes: they only ever identify a mode
        air: "#2F4FD0",
        road: "#C2410C",
        rail: "#2B8A3E",
        sea: "#6D3FD0",
        good: "#15803D",
        bad: "#B91C1C",
        // the signal color: links, primary actions, focus, the route line
        ion: { DEFAULT: "#0B7A9B", bright: "#5AD1EE", dark: "#096683" },
        // dark surfaces: the site's top and bottom, and the admin console
        console: { DEFAULT: "#0B1626", raised: "#12233A", rule: "#25405E", text: "#E6EDF5", muted: "#9FB0C4" },
      },
      fontFamily: { sans: ['"Archivo Variable"', "Archivo", "system-ui", "sans-serif"] },
      fontSize: { xs: "12px", sm: "14px", base: "16px", xl: "20px", "2xl": "28px", "5xl": "56px" },
      borderRadius: { DEFAULT: "4px" },
      boxShadow: { drawer: "-8px 0 24px rgba(17,24,39,0.18)" },
    },
  },
  plugins: [],
};
export default config;
