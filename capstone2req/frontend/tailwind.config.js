/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        accent: {
          50: '#effcf9',
          100: '#c9f5ea',
          200: '#96e8d4',
          300: '#5fd3bb',
          400: '#2fb89e',
          500: '#149984',
          600: '#0e7a6c',
          700: '#0b6157',
          800: '#0a4d46',
          900: '#083f3a',
        },
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '1px',
        md: '2px',
        lg: '3px',
        xl: '3px',
        '2xl': '4px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
