import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      inspectorPort: 9230,
    }),
  ],
  server: {
    host: true, // Allow access from other devices on the network
  },
});
