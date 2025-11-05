import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public",
  publicDir: "assets", // Only assets folder is treated as static
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "public/index.html"),
    },
  },
  resolve: {
    alias: {
      // Optional: only needed if you have custom paths
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
  },
});