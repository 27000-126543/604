/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#e8eef5',
          100: '#c5d3e4',
          200: '#9db5ce',
          300: '#7597b8',
          400: '#5880a7',
          500: '#3b6996',
          600: '#2f5478',
          700: '#1e3a5f',
          800: '#162a44',
          900: '#0e1a2d',
        },
        accent: {
          DEFAULT: '#ff6b35',
          50: '#fff1eb',
          100: '#ffdcc9',
          200: '#ffc4a3',
          300: '#ffac7d',
          400: '#ff995f',
          500: '#ff8641',
          600: '#ff6b35',
          700: '#e55a2e',
          800: '#cc4a27',
          900: '#99381d',
        },
        'indigo-dark': '#1e3a5f',
        'indigo-mid': '#4a6fa5',
        'orange-vibrant': '#ff6b35',
        'gray-light': '#f5f7fa',
        'red-alert': '#e63946',
        'danger': '#e63946',
        'success': '#2a9d8f',
        'warning': '#e9c46a',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideDown: 'slideDown 0.3s ease-out',
        'pulse-error': 'pulseError 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseError: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(230, 57, 70, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(230, 57, 70, 0)' },
        },
      },
    },
  },
  plugins: [],
};
