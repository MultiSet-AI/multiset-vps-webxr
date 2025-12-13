import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true, // important for local `file:` or `npm link` packages
  },
  optimizeDeps: {
    include: [
      '@multisetai/vps',
      '@multisetai/vps/core',
      '@multisetai/vps/webxr',
      'react',
      'react-dom',
      'three',
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

