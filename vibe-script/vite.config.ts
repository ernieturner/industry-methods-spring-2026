import { defineConfig } from "vite";
import path from "path";

const projectRoot = path.resolve(__dirname);

export default defineConfig({
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
