/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#4F7EFF',
          600: '#3D6AE8',
          700: '#2d55c8',
        },
      },
    },
  },
  plugins: [],
}