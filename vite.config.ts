import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
// https://vite.dev/config/
export default defineConfig(() => ({
  // Для GitHub Pages базовый путь определяется из названия репозитория.
  // При сборке через Action переменная GITHUB_REPOSITORY доступна автоматически.
  // Локально можно передать base через --base.
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Для корректной работы на GitHub Pages
    emptyOutDir: true,
  },
}));
