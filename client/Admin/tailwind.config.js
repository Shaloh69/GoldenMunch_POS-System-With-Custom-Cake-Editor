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
      colors: {
        // Golden Munch Brand Colors
        'golden-orange': '#F9A03F',
        'deep-amber': '#D97706',
        'cream-white': '#FFF8F0',
        'chocolate-brown': '#4B2E2E',
        'caramel-beige': '#E6C89C',
        'mint-green': '#A8D5BA',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: '#FFF8F0', // cream-white
          foreground: '#4B2E2E', // chocolate-brown
          primary: {
            50: '#FEF7ED',
            100: '#FDEDD3',
            200: '#FBD7A5',
            300: '#F9C06D',
            400: '#F9A03F', // golden-orange
            500: '#F59E0B',
            600: '#D97706', // deep-amber
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            DEFAULT: '#F9A03F',
          },
          secondary: {
            DEFAULT: '#E6C89C', // caramel-beige
          },
          success: {
            DEFAULT: '#A8D5BA', // mint-green
          }
        }
      },
      dark: {
        colors: {
          background: '#1a1a1a',
          foreground: '#FFF8F0', // cream-white
          primary: {
            DEFAULT: '#F9A03F', // golden-orange
          }
        }
      }
    }
  })],
}

module.exports = config;
