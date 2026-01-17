
/**
 * PostCSS Configuration File
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * It runs during the build process (via Vite) to process your CSS files.
 * 
 * How it works:
 * 1. Vite reads this config when processing CSS imports
 * 2. Runs each plugin in order on your CSS
 * 3. Outputs the transformed CSS to the browser/build
 */

import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: {
    /**
     * Tailwind CSS Plugin
     * - Scans your HTML/JSX files for Tailwind classes (bg-blue-500, flex, etc.)
     * - Generates only the CSS for classes you actually use
     * - Reads configuration from tailwind.config.ts
     * 
     * Example: If you use "bg-blue-500" in your JSX, this plugin generates:
     *   .bg-blue-500 { background-color: #3b82f6; }
     */
    tailwindcss: {},
    /**
     * Autoprefixer Plugin
     * - Adds vendor prefixes to CSS for browser compatibility
     * - Uses data from "Can I Use" to determine which prefixes are needed
     * - Runs AFTER Tailwind generates the CSS
     * 
     * Example transformation:
     *   Input:  .box { display: flex; }
     *   Output: .box { display: -webkit-box; display: flex; }
     * 
     * This ensures project's CSS works across all browsers.
     */
    autoprefixer: {},
  },
}