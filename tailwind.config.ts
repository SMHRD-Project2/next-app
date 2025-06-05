import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#1F2A3A", // 기본 배경
        foreground: "#E2E8F0", // 기본 텍스트
        primary: {
          DEFAULT: "#3EE6C1", // 포인트 1 (민트)
          foreground: "#1F2A3A",
        },
        secondary: {
          DEFAULT: "#2A3649", // 서브 배경
          foreground: "#E2E8F0",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#2A3649", // 서브 배경
          foreground: "#A0AEC0", // 보조 텍스트
        },
        accent: {
          DEFAULT: "#5AC8FA", // 액센트/버튼 hover
          foreground: "#1F2A3A",
        },
        popover: {
          DEFAULT: "#2A3649",
          foreground: "#E2E8F0",
        },
        card: {
          DEFAULT: "#2A3649",
          foreground: "#E2E8F0",
        },
        // ON AIR 커스텀 색상
        onair: {
          bg: "#1F2A3A",
          "bg-sub": "#2A3649",
          mint: "#3EE6C1",
          orange: "#FFB74D",
          blue: "#5AC8FA",
          text: "#E2E8F0",
          "text-sub": "#A0AEC0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        wave: {
          "0%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.5)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        wave: "wave 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
