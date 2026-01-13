/** @type {import('tailwindcss').Config} */

/** 
 * Tailwind CSS configuration file
 * This file defines:
 *  - Which files Tailwind scans for class usage
 *  - Custom design tokens (fonts, colors, etc.)
 *  - Plugins (if any)
 */

module.exports = {
  //Tells Tailwind *where to look* for class names.
  //Tailwind will scan these files during build.
  content: [
    //Scan all TypeScript / JavaScript files under src/
    "./src/**/*.{ts,tsx,js,jsx}",
    "./public/**/*.html",
  ],
  // Controls the design system of current project
  theme: {
    // extend allows adding custom values without overriding Tailwind defaults
    extend: {
      // Font Families
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },

      // These colors are exposed as Tailwind utility classes (bg-*, text-*, border-*)
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

        heatmap: {
          container: '#21447E',
          empty: '#183B76',
          low: '#1F4D9A',
          medium: '#99B5E5',
          high: '#FFFFFF',
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
  // No Tailwind plugins are used in this project
  plugins: [],

};