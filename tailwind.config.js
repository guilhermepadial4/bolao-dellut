/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f2",
          100: "#fde8e8",
          500: "#cf1f33",
          600: "#b91c1c",
          700: "#9d1c2a",
        },
      },
    },
  },
  plugins: [],
};
