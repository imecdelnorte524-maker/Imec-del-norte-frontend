// vite.config.ts (VERSIÓN OPTIMIZADA)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3032,
    strictPort: true,
    watch: {
      usePolling: false,
      interval: 100,
    },
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@heroicons/react"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "esbuild",
    target: "es2020",
  },
  base: "/",
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    exclude: [],
  },
});
