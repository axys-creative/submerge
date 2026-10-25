import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages, itch.io or any subfolder.
export default defineConfig({
  base: './',
  server: { open: true },
});
