import { defineConfig } from "vite";

// Base is "./" so the built game runs from a file path or a native
// (Capacitor) WebView shell as well as a web server.
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
});
