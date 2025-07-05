import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access from other devices on the network
    proxy: {
      "/api": {
        target: "http://localhost:8787", // Cloudflare Workers dev server
        changeOrigin: true,
      },
    },
  },
});
