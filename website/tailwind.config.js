/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./**/*.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0a0a0a"
        }
      }
    },
  },
  plugins: [],
}

