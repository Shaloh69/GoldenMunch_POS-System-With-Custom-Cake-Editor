import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        // Light Caramel & Cream Color Scheme
        'light-caramel': '#D9B38C',
        'cream-white': '#FFF9F2',
        'soft-sand': '#E8DCC8',
        'warm-beige': '#C9B8A5',
        'muted-clay': '#C67B57',
        // Legacy colors for compatibility
        'golden-orange': '#D9B38C',
        'deep-amber': '#C9B8A5',
        'chocolate-brown': '#C67B57',
      },
      backgroundImage: {
        'mesh-gradient': 'linear-gradient(135deg, rgba(217, 179, 140, 0.15) 0%, rgba(232, 220, 200, 0.15) 50%, rgba(201, 184, 165, 0.15) 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #FFF9F2 0%, #E8DCC8 50%, #D9B38C 100%)',
        'cream-gradient': 'linear-gradient(to bottom, #FFF9F2, #F5EFE6)',
        'warm-gradient': 'radial-gradient(circle at top right, rgba(217, 179, 140, 0.3), transparent 70%)',
      },
      boxShadow: {
        'xl-golden': '0 20px 25px -5px rgba(217, 179, 140, 0.3), 0 10px 10px -5px rgba(198, 123, 87, 0.2)',
        'caramel': '0 4px 20px rgba(217, 179, 140, 0.25)',
        'cream': '0 2px 15px rgba(232, 220, 200, 0.3)',
        'soft': '0 8px 30px rgba(201, 184, 165, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-soft': 'glowSoft 3s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'wave': 'wave 4s ease-in-out infinite',
        'drift': 'drift 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(217, 179, 140, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(217, 179, 140, 0.8), 0 0 30px rgba(198, 123, 87, 0.6)' },
        },
        glowSoft: {
          '0%': { boxShadow: '0 0 10px rgba(217, 179, 140, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(217, 179, 140, 0.5), 0 0 40px rgba(232, 220, 200, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(5px) translateY(-5px)' },
          '50%': { transform: 'translateX(0) translateY(-10px)' },
          '75%': { transform: 'translateX(-5px) translateY(-5px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(10px, -10px) rotate(2deg)' },
          '66%': { transform: 'translate(-10px, 10px) rotate(-2deg)' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#D9B38C",
            foreground: "#000000",
          },
          secondary: {
            DEFAULT: "#C67B57",
            foreground: "#FFFFFF",
          },
          background: "#FFF9F2",
          foreground: "#2D2D2D",
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#D9B38C",
            foreground: "#000000",
          },
          secondary: {
            DEFAULT: "#C67B57",
            foreground: "#FFFFFF",
          },
          background: "#E8DCC8",
          foreground: "#1A1A1A",
        },
      },
    },
  })],
}

module.exports = config;
