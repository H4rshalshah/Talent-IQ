import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Sourcemaps for debugging production issues
    sourcemap: false,
  },
  // Disable HMR payloads in production to prevent Chrome extension interference
  server: {
    hmr: process.env.NODE_ENV !== "production",
  },
});
