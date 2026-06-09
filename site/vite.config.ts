import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// API/static endpoints are served by the Worker (wrangler dev on :8787).
// The vite dev server proxies them so the SPA can use same-origin paths.
const workerProxy = {
  target: "http://127.0.0.1:8787",
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react()],
  root: "site",
  build: {
    outDir: "../dist/site",
    emptyOutDir: true,
    // gf.css is harvested from the live fonts.google.com app; minifiers
    // reject some of its legacy hacks, and fidelity matters more than bytes.
    cssMinify: false,
  },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/css": workerProxy,
      "/css2": workerProxy,
      "/metadata": workerProxy,
      "/webfonts": workerProxy,
      "/s/": workerProxy,
      "/gstatic": workerProxy,
    },
  },
});
