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
        background:    "#08080a",
        "surface-0":   "#08080a",
        "surface-1":   "#0f0f12",
        "surface-2":   "#151518",
        "surface-3":   "#1a1a1f",
        "surface-4":   "#222228",
        "dopa-green":  "#4ade80",
        "dopa-cyan":   "#22d3ee",
        "dopa-violet": "#a78bfa",
        "dopa-red":    "#fb7185",
        "dopa-xp":     "#fbbf24",
        "dopa-blue":   "#60a5fa",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":      "fadeIn 0.3s ease-out",
        "slide-up":     "slideUp 0.4s ease-out",
        "pulse-slow":   "pulse 3s ease-in-out infinite",
        "float":        "float 3s ease-in-out infinite",
        "shimmer":      "shimmer 3s ease-in-out infinite",
        "gradient":     "gradient-shift 4s ease infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        "card":       "0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
        "card-hover": "0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)",
        "elevated":   "0 4px 16px rgba(0,0,0,0.5), 0 12px 48px rgba(0,0,0,0.3)",
        "glow-green":  "0 0 20px rgba(74,222,128,0.15), 0 0 60px rgba(74,222,128,0.05)",
        "glow-violet": "0 0 20px rgba(167,139,250,0.15), 0 0 60px rgba(167,139,250,0.05)",
        "glow-cyan":   "0 0 20px rgba(34,211,238,0.15), 0 0 60px rgba(34,211,238,0.05)",
        "glow-amber":  "0 0 20px rgba(251,191,36,0.15), 0 0 60px rgba(251,191,36,0.05)",
        "inner-light": "inset 0 1px 0 rgba(255,255,255,0.05)",
        "3d":          "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
