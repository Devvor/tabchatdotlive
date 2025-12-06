/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0b",
        foreground: "#fafafa",
        primary: "#8b5cf6",
        secondary: "#27272a",
      },
    },
  },
  plugins: [],
};

