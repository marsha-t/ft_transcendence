/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{ts,tsx,js,jsx}",
      "./public/**/*.html",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['DM Sans', 'sans-serif'],     // default text font
          pixel: ['Silkscreen', 'cursive'],    // retro pixel style
          press: ['"Press Start 2P"', 'cursive'], // 8-bit arcade style
          mono: ['VT323', 'monospace'],        // terminal style
        },
      },
    },
    plugins: [],
  };
  