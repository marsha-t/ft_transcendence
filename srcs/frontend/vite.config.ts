// ============================================
// IMPORT VITE CONFIGURATION HELPER
// ============================================

// defineConfig: Provides TypeScript autocomplete for Vite config
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // "root": The directory Vite serves files from during development
  // "public" = Vite will serve files from the public/ folder
  root: "public",
  publicDir: "../public/assets", // Point to the actual assets folder location
  // "outDir": Where Vite puts bundled files after build
  // "../dist" = Go up from public/, create dist/ folder
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
  },
});