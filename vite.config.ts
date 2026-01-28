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
    proxy: {
      "/api": {
        target: "https://menushield-production.up.railway.app",
        changeOrigin: true,
        secure: true,
        headers: {
          "Access-Control-Allow-Headers":
            "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        },
        configure: (proxy, options) => {
          proxy.on("error", (err) => {
            console.log("🚨 Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(
              "📤 Proxying:",
              req.method,
              req.url || "",
              "→",
              (options.target || "") + (req.url || ""),
            );
            console.log("📤 Headers being sent:", proxyReq.getHeaders());
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "📥 Proxy response:",
              proxyRes.statusCode,
              "for",
              req.url || "",
            );
          });
        },
      },
    },
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
