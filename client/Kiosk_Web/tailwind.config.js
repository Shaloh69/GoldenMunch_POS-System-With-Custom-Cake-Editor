/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sunny Yellow Color Scheme
        "sunny-yellow": "#FBCD2F", // Primary - Warm and bright
        "pure-white": "#FFFFFF", // Primary - Crisp contrast
        "charcoal-gray": "#2B2B2B", // Text - Deep neutral
        "soft-warm-gray": "#F3F3F3", // Background Alt - Soft spacing
        "deep-orange-yellow": "#F5A623", // Accent - Secondary contrast
        // Legacy colors for backward compatibility
        "golden-orange": "#FBCD2F",
        "deep-amber": "#F5A623",
        "cream-white": "#FFFFFF",
        "chocolate-brown": "#2B2B2B",
        "caramel-beige": "#F3F3F3",
        "mint-green": "#A8D5BA",

        // Shadcn/ui semantic colors (Tailwind v4 compatible)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      animation: {
        "bounce-slow": "bounce 3s infinite",
        "pulse-slow": "pulse 4s infinite",
        float: "float 6s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      // Portrait 21-inch monitor optimizations
      spacing: {
        touch: "16px", // Minimum touch target spacing
      },
    },
  },
  darkMode: "class",
  plugins: [require("tailwindcss-animate")],
};

module.exports = config;
