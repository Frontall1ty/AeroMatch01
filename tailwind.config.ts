import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1F1F1",
        panel: "#FFFFFF",
        ink: "#0A0A0A",
        muted: "#525252",
        rule: "#D9D9D9",
        // modes: they only ever identify a mode
        air: "#2F4FD0",
        road: "#C2410C",
        rail: "#237A35",
        sea: "#6D3FD0",
        good: "#15803D",
        bad: "#B91C1C",
        // the action color: black on light surfaces, white on dark ones (the template is monochrome)
        ion: { DEFAULT: "#0A0A0A", bright: "#FFFFFF", dark: "#262626" },
        // dark surfaces: the site's top and bottom, and the admin console
        console: { DEFAULT: "#0A0A0A", raised: "#161616", rule: "#2E2E2E", text: "#F2F2F2", muted: "#A3A3A3" },
      },
      fontFamily: { sans: ['"DM Sans Variable"', "DM Sans", "system-ui", "sans-serif"], numeric: ['"Archivo Variable"', "Archivo", "system-ui", "sans-serif"] },
      fontSize: { xs: "12px", sm: "14px", base: "16px", xl: "20px", "2xl": "28px", "5xl": "56px" },
      borderRadius: { DEFAULT: "4px" },
      boxShadow: { drawer: "-8px 0 24px rgba(17,24,39,0.18)" },
    },
  },
  plugins: [],
};
export default config;
