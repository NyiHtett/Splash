import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

function copyExtensionFiles() {
  return {
    name: "copy-extension-files",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      // Copy manifest.json (rewritten for new paths)
      copyFileSync(resolve(__dirname, "manifest.extension.json"), resolve(dist, "manifest.json"));
      // Copy background service worker
      copyFileSync(resolve(__dirname, "src/background.js"), resolve(dist, "background.js"));
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  base: "",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        notes: resolve(__dirname, "src/notes/index.html"),
      },
    },
  },
});
