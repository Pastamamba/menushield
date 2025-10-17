import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 5176,
    host: "127.0.0.1",
    hmr: {
      port: 5176,
    },
    // Proxy disabled - using VITE_API_URL from .env instead
    // proxy: {
    //   "/api": {
    //     target:
    //       mode === "production"
    //         ? "http://backend:4000"
    //         : "http://localhost:4000",
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },
  clearScreen: false,
}));
