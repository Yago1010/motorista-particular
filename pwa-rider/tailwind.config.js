/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28a745',
          dark: '#1e7e34',
          light: '#3dd65c',
        },
        success: {
          DEFAULT: '#28a745',
          dark: '#1e7e34',
        },
        danger: {
          DEFAULT: '#dc3545',
          dark: '#c82333',
        },
        warning: '#ffc107',
        info: '#17a2b8',
        background: '#f8f9fa',
        foreground: '#212529',
        card: '#ffffff',
        border: '#dee2e6',
        muted: {
          DEFAULT: '#f8f9fa',
          foreground: '#6c757d',
        },
      },
    },
  },
  plugins: [],
}
