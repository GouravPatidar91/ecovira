import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Nunito"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        agri: ['"Nunito"', '"Inter"', 'ui-sans-serif'],
      },
      colors: {
        // Use friendly, agri-inspired palette: fresh greens, tan, brown, accent orange
        agri: {
          50: '#f6faef',
          100: '#e5f5d6',
          200: '#cbecaf',
          300: '#a5dc7b',
          400: '#73bf41',
          500: '#549d29',
          600: '#39791c',
          700: '#255613',
          800: '#18370e',
          900: '#11240a',
        },
        field: {
          primary: '#e5d6c6',   // wheat/tan
          dark: '#c2b19f',
        },
        accent: {
          DEFAULT: '#feaf3e',
          light: '#ffe1b5',
          dark: '#d98111'
        },
        ...{
          // alias market green to agri for component compatibility
          market: {
            50: "#f6faef",
            100: "#e5f5d6",
            200: "#cbecaf",
            300: "#a5dc7b",
            400: "#73bf41",
            500: "#549d29",
            600: "#39791c",
            700: "#255613",
            800: "#18370e",
            900: "#11240a",
          }
        }
      },
      backgroundImage: {
        'glass-card': 'linear-gradient(135deg, rgba(245,255,235,0.9) 0%, rgba(224,251,208,0.85) 100%)',
        'hero-agri': 'linear-gradient(120deg,#e5f5d6 60%,#cbecaf 100%)',
      },
      boxShadow: {
        glass: '0 4px 32px 0 rgba(100,150,75,0.1)',
        soft: '0 2px 8px rgba(80,120,60,0.06)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
