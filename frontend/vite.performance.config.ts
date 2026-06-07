import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          ui: [
            "src/components/Button.tsx",
            "src/components/Card.tsx",
            "src/components/Modal.tsx",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  server: {
    middlewareMode: true,
  },
});
