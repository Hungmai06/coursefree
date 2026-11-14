import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#F8FAFC",
          secondary: "#FFFFFF",
          sidebar: "#FFFFFF",
          card: "#FFFFFF",
          hover: "#F1F5F9",
        },
        foreground: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          muted: "#64748B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
          hover: "#CBD5E1",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "rgba(37, 99, 235, 0.08)",
        },
        status: {
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Geist", "Manrope", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        input: "8px",
        modal: "14px",
      },
      transitionDuration: {
        sidebar: "180ms",
        accordion: "200ms",
        card: "180ms",
        btn: "120ms",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        glow: "0 4px 20px -2px rgba(37, 99, 235, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
