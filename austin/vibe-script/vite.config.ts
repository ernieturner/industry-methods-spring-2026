import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const projectRoot = path.resolve(__dirname);

export default defineConfig({
  plugins: [react()],
  root: projectRoot,

  server: {
    fs: {
      strict: true,
      allow: [projectRoot]
    }
  },

  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src")
    }
  }
});
