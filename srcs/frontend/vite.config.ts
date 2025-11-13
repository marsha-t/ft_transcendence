import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public",
  publicDir: "../public/assets", // Point to the actual assets folder location
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