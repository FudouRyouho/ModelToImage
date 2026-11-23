import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: { outDir: 'build/client', emptyOutDir: true, manifest: true },
});
