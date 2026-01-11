// Export a configuration object for PostCSS using CommonJS syntax
module.exports = {
   // Define the list of PostCSS plugins to apply to the input CSS
    plugins: {
      // Tailwind CSS PostCSS plugin:
      // - Expands @tailwind directives in input.css
      // - Reads tailwind.config.cjs
      // - Generates utility classes based on scanned source files
      tailwindcss: {},
      // Autoprefixer plugin:
      // - Adds vendor prefixes (e.g. -webkit-, -ms-)
      // - Ensures CSS compatibility across browsers
      autoprefixer: {},
    }
  }