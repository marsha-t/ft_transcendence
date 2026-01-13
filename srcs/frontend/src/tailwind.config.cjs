/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // Font Families
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },

      // Colors
      colors: {
        // Background Colors
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          quaternary: 'var(--color-background-quaternary)',
        },

        // Button Colors
        button: {
          active: 'var(--color-button-active)',
          inactive: 'var(--color-button-inactive)',
          text: 'var(--color-button-text)',
          shadow: 'var(--color-button-shadow)',
        },

        // Text Colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          yellow: 'var(--color-text-yellow)',
        },

        // Border Colors
        border: {
          yellow: 'var(--color-border-yellow)',
          red: 'var(--color-border-red)',
          green: 'var(--color-border-green)',
        },

        // Modal Colors
        modal: {
          background: 'var(--color-modal-background)',
        },

        // Quick Access Colors (for convenience)
        blue: '#143367',
        yellow: '#FFD248',
        green: '#77AB55',
        'blue-inactive': '#1F4D9A',
        red: '#DA483B',
        purple_gray: '#B0B6E6'
      },
    },
  },
  plugins: [],
};