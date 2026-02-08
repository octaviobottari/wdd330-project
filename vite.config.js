import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',  // Change from 'src' to '.'
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html'  // Change from 'src/index.html'
    }
  },
  server: {
    port: 3000
  }
});