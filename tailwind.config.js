/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        court: {
          green: '#2D6A2D',
          light: '#4A9E4A',
          bg: '#F0FAF0',
        },
      },
    },
  },
  plugins: [],
};
