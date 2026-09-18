/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif JP"', '"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans JP"', '"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        oshiruco: {
          50: '#fefcf7',
          100: '#f8edd9',
          200: '#f0d9b5',
          300: '#e8c590',
          400: '#d9a865',
          500: '#c8893e',
          600: '#b0702e',
          700: '#8f5524',
          800: '#6f421d',
          900: '#4f3015',
        },
      },
    },
  },
  plugins: [],
};
