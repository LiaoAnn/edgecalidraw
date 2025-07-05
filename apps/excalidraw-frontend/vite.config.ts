import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
