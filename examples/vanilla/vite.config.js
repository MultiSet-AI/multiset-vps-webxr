import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    preserveSymlinks: true, // important for local `file:` or `npm link` packages
  },
  optimizeDeps: {
    include: [
      '@multisetai/vps',
      '@multisetai/vps/core',
      '@multisetai/vps/webxr',
    ],
  },
  server: {
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
