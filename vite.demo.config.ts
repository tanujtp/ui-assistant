import { defineConfig } from "vite";

export default defineConfig({
  root: "examples/demo",
  base: "./",
  build: { outDir: "../../demo-dist", emptyOutDir: true },
  server: { port: 5173, strictPort: true },
});
