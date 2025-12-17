const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        "sunny-yellow": "#FBCD2F",
        "pure-white": "#FFFFFF",
        "charcoal-gray": "#2B2B2B",
        "soft-warm-gray": "#F3F3F3",
        "deep-orange-yellow": "#F5A623",
        "light-caramel": "#FBCD2F",
        "cream-white": "#FFFFFF",
        "soft-sand": "#F3F3F3",
        "warm-beige": "#F5A623",
        "muted-clay": "#F5A623",
        "golden-orange": "#FBCD2F",
        "deep-amber": "#F5A623",
        "chocolate-brown": "#2B2B2B",
        "caramel-beige": "#F3F3F3",
        "mint-green": "#A8D5BA",
      },
      backgroundImage: {
        "mesh-gradient":
          "linear-gradient(135deg, rgba(251, 205, 47, 0.15) 0%, rgba(245, 166, 35, 0.15) 50%, rgba(243, 243, 243, 0.15) 100%)",
        "caramel-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #F3F3F3 50%, #FBCD2F 100%)",
        "cream-gradient":
          "linear-gradient(to bottom, #FFFFFF, #F3F3F3)",
        "warm-gradient":
          "radial-gradient(circle at top right, rgba(251, 205, 47, 0.3), transparent 70%)",
        "yellow-glow":
          "radial-gradient(circle at center, rgba(251, 205, 47, 0.4), transparent 60%)",
      },
      boxShadow: {
        "xl-golden":
          "0 20px 25px -5px rgba(251, 205, 47, 0.3), 0 10px 10px -5px rgba(245, 166, 35, 0.2)",
        caramel: "0 4px 20px rgba(251, 205, 47, 0.25)",
        cream: "0 2px 15px rgba(243, 243, 243, 0.3)",
        soft: "0 8px 30px rgba(245, 166, 35, 0.2)",
        yellow: "0 4px 20px rgba(251, 205, 47, 0.4)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
        "scale-in": "scaleIn 0.3s ease-out",
        "slide-right": "slideRight 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "pulse-slow":
          "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "glow-soft":
          "glowSoft 3s ease-in-out infinite alternate",
        shimmer: "shimmer 2s ease-in-out infinite",
        wave: "wave 4s ease-in-out infinite",
        drift: "drift 8s ease-in-out infinite",
        "bounce-in": "bounceIn 0.6s ease-out",
      },
      spacing: {
        touch: "16px",
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#FBCD2F",
              foreground: "#2B2B2B",
            },
            secondary: {
              DEFAULT: "#F5A623",
              foreground: "#FFFFFF",
            },
            background: "#FFFFFF",
            foreground: "#2B2B2B",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#FBCD2F",
              foreground: "#2B2B2B",
            },
            secondary: {
              DEFAULT: "#F5A623",
              foreground: "#FFFFFF",
            },
            background: "#F3F3F3",
            foreground: "#2B2B2B",
          },
        },
      },
    }),
  ],
};
