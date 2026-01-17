import type { Config } from 'tailwindcss'

/** 
 * Tailwind CSS Configuration File
 * 
 * This file defines:
 *  - Which files Tailwind scans for class usage (content)
 *  - Custom design tokens: fonts, colors, spacing, etc. (theme)
 *  - Additional Tailwind plugins (plugins)
 * 
 *  1. During build, Tailwind scans files in 'content' array
 *  2. Finds all utility classes (bg-blue-500, text-primary, etc.)
 *  3. Generates only the CSS needed for those classes
 *  4. Applies custom theme values defined below
 */

const config: Config = {
  /**
   * Content Sources
   * 
   * Tells Tailwind WHERE to look for class names.
   * Tailwind scans these files during build and generates CSS only for classes found.
   */
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  /**
   * Theme Configuration
   * 
   * Controls the design system of the project.
   * Using 'extend' keeps Tailwind's default values and adds custom ones.
   * (Using 'theme' directly would replace all defaults)
   */
  theme: {
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
}

export default config