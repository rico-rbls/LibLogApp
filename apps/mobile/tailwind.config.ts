import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "lib-purple": {
          DEFAULT: "#652D90",
          50: "#F5EDF9",
          100: "#E8D5F3",
          200: "#D4ADE7",
          300: "#B87DD4",
          400: "#9B5BBF",
          500: "#652D90",
          600: "#5A2880",
          700: "#4A2068",
          800: "#3A1850",
          900: "#2A1038",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "#652D90",
          foreground: "#FFFFFF",
        },
        destructive: "#DC2626",
        border: "var(--border)",
        input: "var(--input)",
        ring: "#652D90",
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        xl: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
