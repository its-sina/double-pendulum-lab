/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes asset paths relative, so the build works on GitHub Pages
// project sites (https://<user>.github.io/<repo>/) without hard-coding the repo
// name, and also when opened from a plain file path.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
});
