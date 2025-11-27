/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{ts,tsx,js,jsx}",
      "./public/**/*.html",
    ],
    theme: {
      extend: {
        
        fontFamily: {
          pixel: ['Silkscreen', 'cursive'],    // retro pixel style
          press: ['"Press Start 2P"', 'cursive'], // 8-bit arcade style
          mono: ['VT323', 'monospace'],        // terminal style
        },

        colors: {
          background: 'var(--color-background)',
          'background-yellow': 'var(--color-background-secondary)',
          color_button: 'var(--color-button)',
          color_white: 'var(--color-text-white)',
          'color-secondary': 'var(--color-text-secondary)',
          'color-yellow': 'var(--color-text-yellow)',
          'color-green': 'var(--color-text-green)',
          'color-green-secodary': 'var(--color-button-second)',
          color_border: 'var(--color-border-red)',
          'border-green': 'var(--color-border-green)'
        }
      },
    },
    plugins: [],
  };
  