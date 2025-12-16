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
        // Sunny Yellow Color Scheme
        'sunny-yellow': '#FBCD2F',      // Primary - Warm and bright
        'pure-white': '#FFFFFF',        // Primary - Crisp contrast
        'charcoal-gray': '#2B2B2B',     // Text - Deep neutral
        'soft-warm-gray': '#F3F3F3',    // Background Alt - Soft spacing
        'deep-orange-yellow': '#F5A623', // Accent - Secondary contrast
        // Legacy colors for backward compatibility
        'light-caramel': '#FBCD2F',     // Maps to sunny-yellow
        'cream-white': '#FFFFFF',       // Maps to pure-white
        'soft-sand': '#F3F3F3',         // Maps to soft-warm-gray
        'warm-beige': '#F5A623',        // Maps to deep-orange-yellow
        'muted-clay': '#F5A623',        // Maps to deep-orange-yellow
        // Additional Kiosk colors
        "golden-orange": "#FBCD2F",
        "deep-amber": "#F5A623",
        "chocolate-brown": "#2B2B2B",
        "caramel-beige": "#F3F3F3",
        "mint-green": "#A8D5BA",
      },
      backgroundImage: {
        'mesh-gradient': 'linear-gradient(135deg, rgba(251, 205, 47, 0.15) 0%, rgba(245, 166, 35, 0.15) 50%, rgba(243, 243, 243, 0.15) 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F3F3F3 50%, #FBCD2F 100%)',
        'cream-gradient': 'linear-gradient(to bottom, #FFFFFF, #F3F3F3)',
        'warm-gradient': 'radial-gradient(circle at top right, rgba(251, 205, 47, 0.3), transparent 70%)',
        'yellow-glow': 'radial-gradient(circle at center, rgba(251, 205, 47, 0.4), transparent 60%)',
      },
      boxShadow: {
        'xl-golden': '0 20px 25px -5px rgba(251, 205, 47, 0.3), 0 10px 10px -5px rgba(245, 166, 35, 0.2)',
        'caramel': '0 4px 20px rgba(251, 205, 47, 0.25)',
        'cream': '0 2px 15px rgba(243, 243, 243, 0.3)',
        'soft': '0 8px 30px rgba(245, 166, 35, 0.2)',
        'yellow': '0 4px 20px rgba(251, 205, 47, 0.4)',
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
        'bounce-in': 'bounceIn 0.6s ease-out',
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
          '0%': { boxShadow: '0 0 5px rgba(251, 205, 47, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(251, 205, 47, 0.8), 0 0 30px rgba(245, 166, 35, 0.6)' },
        },
        glowSoft: {
          '0%': { boxShadow: '0 0 10px rgba(251, 205, 47, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(251, 205, 47, 0.5), 0 0 40px rgba(245, 166, 35, 0.4)' },
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
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Portrait 21-inch monitor optimizations
      spacing: {
        touch: "16px", // Minimum touch target spacing
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#FBCD2F",  // Sunny Yellow
            foreground: "#2B2B2B",  // Charcoal Gray
          },
          secondary: {
            DEFAULT: "#F5A623",  // Deep Orange Yellow
            foreground: "#FFFFFF",
          },
          background: "#FFFFFF",  // Pure White
          foreground: "#2B2B2B",  // Charcoal Gray
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#FBCD2F",  // Sunny Yellow
            foreground: "#2B2B2B",  // Charcoal Gray
          },
          secondary: {
            DEFAULT: "#F5A623",  // Deep Orange Yellow
            foreground: "#FFFFFF",
          },
          background: "#F3F3F3",  // Soft Warm Gray
          foreground: "#2B2B2B",  // Charcoal Gray
        },
      },
    },
  })],
}

module.exports = config;
