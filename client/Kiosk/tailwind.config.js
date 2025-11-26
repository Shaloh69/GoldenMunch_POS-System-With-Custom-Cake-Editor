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
        // Light Caramel & Cream Color Scheme
        'light-caramel': '#D9B38C',
        'cream-white': '#FFF9F2',
        'soft-sand': '#E8DCC8',
        'warm-beige': '#C9B8A5',
        'muted-clay': '#C67B57',
        // Legacy compatibility
        'golden-orange': '#D9B38C',
        'deep-amber': '#C9B8A5',
        'chocolate-brown': '#C67B57',
        'caramel-beige': '#E8DCC8',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        'mesh-gradient': 'linear-gradient(135deg, rgba(217, 179, 140, 0.15) 0%, rgba(232, 220, 200, 0.15) 50%, rgba(201, 184, 165, 0.15) 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #FFF9F2 0%, #E8DCC8 50%, #D9B38C 100%)',
        'cream-gradient': 'linear-gradient(to bottom, #FFF9F2, #F5EFE6)',
        'warm-gradient': 'radial-gradient(circle at top right, rgba(217, 179, 140, 0.3), transparent 70%)',
      },
      boxShadow: {
        'caramel': '0 4px 20px rgba(217, 179, 140, 0.25)',
        'cream': '0 2px 15px rgba(232, 220, 200, 0.3)',
        'soft': '0 8px 30px rgba(201, 184, 165, 0.2)',
        'glow': '0 0 30px rgba(217, 179, 140, 0.4)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(217, 179, 140, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(217, 179, 140, 0.6), 0 0 40px rgba(198, 123, 87, 0.4)' },
        },
      }
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: '#FFF9F2',
          foreground: '#2D2D2D',
          primary: {
            50: '#FFF9F2',
            100: '#F5EFE6',
            200: '#E8DCC8',
            300: '#D9B38C',
            400: '#C9B8A5',
            500: '#C67B57',
            600: '#B85C3A',
            700: '#A04828',
            800: '#863920',
            900: '#6D2E1A',
            DEFAULT: '#D9B38C',
            foreground: '#FFFFFF',
          },
          secondary: {
            DEFAULT: '#C67B57',
            foreground: '#FFFFFF',
          },
          success: {
            DEFAULT: '#10B981',
            foreground: '#FFFFFF',
          },
          warning: {
            DEFAULT: '#F59E0B',
            foreground: '#FFFFFF',
          },
          danger: {
            DEFAULT: '#EF4444',
            foreground: '#FFFFFF',
          },
        }
      },
      dark: {
        colors: {
          background: '#1A1A1A',
          foreground: '#FFF9F2',
          primary: {
            DEFAULT: '#D9B38C',
            foreground: '#000000',
          }
        }
      }
    }
  })],
}

module.exports = config;
