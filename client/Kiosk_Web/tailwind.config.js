import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
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
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      animation: {
        "bounce-slow": "bounce 3s infinite",
        "pulse-slow": "pulse 4s infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      // Portrait 21-inch monitor optimizations
      spacing: {
        touch: "16px", // Minimum touch target spacing
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF", // pure-white
            foreground: "#2B2B2B", // charcoal-gray
            primary: {
              50: "#FFFDF0",
              100: "#FFF9E0",
              200: "#FFF3C1",
              300: "#FFED9F",
              400: "#FBCD2F", // sunny-yellow
              500: "#F9C41E",
              600: "#F5A623", // deep-orange-yellow
              700: "#E89113",
              800: "#C77A0D",
              900: "#A66408",
              DEFAULT: "#FBCD2F", // sunny-yellow
            },
            secondary: {
              DEFAULT: "#F5A623", // deep-orange-yellow
            },
            success: {
              DEFAULT: "#A8D5BA", // mint-green (kept)
            },
          },
        },
        dark: {
          colors: {
            background: "#F3F3F3", // soft-warm-gray
            foreground: "#2B2B2B", // charcoal-gray
            primary: {
              DEFAULT: "#FBCD2F", // sunny-yellow
            },
          },
        },
      },
    }),
  ],
};

module.exports = config;
