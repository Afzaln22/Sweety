/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#5B50E6',
          600: '#4F46E5',
          700: '#4338CA',
        },
        navy: {
          800: '#1A2238',
          900: '#141A2E',
          card: '#222B45',
        },
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E8ECF2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

