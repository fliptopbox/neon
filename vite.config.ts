import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  root: "./src/admin",
  envDir: "./src/admin",
  build: {
    outDir: "../../dist/admin",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
