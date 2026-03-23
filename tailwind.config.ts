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
        "bg-base":   "#1c1c21",
        "bg-card":   "#242429",
        "bg-raised": "#2a2a31",
        "bg-hover":  "#303038",
        "bg-active": "#36363f",
        "dopa-green":  "#4ade80",
        "dopa-cyan":   "#22d3ee",
        "dopa-violet": "#a78bfa",
        "dopa-red":    "#fb7185",
        "dopa-xp":     "#fbbf24",
        "dopa-blue":   "#60a5fa",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        "3d-sm":     "0 1px 2px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        "3d":        "0 2px 4px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)",
        "3d-lg":     "0 4px 8px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
        "3d-xl":     "0 8px 16px rgba(0,0,0,0.35), 0 24px 64px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        "inner":     "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.15)",
        "glow-green":  "0 0 15px rgba(74,222,128,0.2), 0 0 40px rgba(74,222,128,0.08)",
        "glow-violet": "0 0 15px rgba(167,139,250,0.2), 0 0 40px rgba(167,139,250,0.08)",
        "glow-cyan":   "0 0 15px rgba(34,211,238,0.2), 0 0 40px rgba(34,211,238,0.08)",
        "glow-amber":  "0 0 15px rgba(251,191,36,0.2), 0 0 40px rgba(251,191,36,0.08)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float":      "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
