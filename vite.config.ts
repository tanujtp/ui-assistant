import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "UIAssistant",
      formats: ["es", "cjs", "iife"],
      fileName: (format) =>
        format === "es" ? "ui-assistant.js" : format === "cjs" ? "ui-assistant.cjs" : "ui-assistant.iife.js",
    },
    sourcemap: true,
    target: "es2020",
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
