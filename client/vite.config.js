import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      stream: "stream-browserify",
      events: "events",
      util: "util",
      buffer: "buffer",
      process: "process/browser",
    },
  },

  define: {
    global: "globalThis",
  },
});