import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic theme colors (auto-switch via CSS variables)
        background:   "var(--background)",
        surface:      "var(--surface-1)",
        "surface-0":  "var(--surface-0)",
        "surface-2":  "var(--surface-2)",
        "surface-3":  "var(--surface-3)",
        "surface-4":  "var(--surface-4)",
        foreground:   "var(--foreground)",

        // Text
        "t-primary":   "var(--text-primary)",
        "t-secondary": "var(--text-secondary)",
        "t-tertiary":  "var(--text-tertiary)",
        "t-ghost":     "var(--text-ghost)",

        // Borders
        "b-primary":   "var(--border-primary)",
        "b-secondary": "var(--border-secondary)",
        "b-hover":     "var(--border-hover)",

        // Accents
        "accent-blue":       "var(--accent-blue)",
        "accent-blue-light": "var(--accent-blue-light)",
        "accent-green":      "var(--accent-green)",
        "accent-green-light":"var(--accent-green-light)",
        "accent-red":        "var(--accent-red)",
        "accent-red-light":  "var(--accent-red-light)",
        "accent-orange":     "var(--accent-orange)",
        "accent-orange-light":"var(--accent-orange-light)",
        "accent-purple":     "var(--accent-purple)",
        "accent-purple-light":"var(--accent-purple-light)",

        // Sidebar
        "sidebar-bg":         "var(--sidebar-bg)",
        "sidebar-active-bg":  "var(--sidebar-active-bg)",
        "sidebar-active-text":"var(--sidebar-active-text)",
        "sidebar-inactive":   "var(--sidebar-inactive-text)",

        // Card
        "card-bg":     "var(--card-bg)",
        "card-border": "var(--card-border)",

        // Input
        "input-bg":     "var(--input-bg)",
        "input-border": "var(--input-border)",

        // Badge
        "badge-bg":   "var(--badge-bg)",
        "badge-text": "var(--badge-text)",

        // Checkbox
        "checkbox-border":  "var(--checkbox-border)",
        "checkbox-checked": "var(--checkbox-checked-bg)",

        // Empty
        "empty-bg": "var(--empty-bg)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "checkmark":  "checkmark 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        checkmark: {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
