import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import type {IncomingMessage, ServerResponse} from 'http';

// Serves the studio at /admin (and /admin/) instead of /admin.html, in both
// `vite dev` and `vite preview`. It is intentionally not linked from the site.
function adminRoute(): Plugin {
  const rewrite = (req: IncomingMessage, _res: ServerResponse, next: () => void) => {
    const url = req.url ?? '';
    if (url === '/admin' || url === '/admin/' || url.startsWith('/admin/')) {
      req.url = '/admin.html';
    }
    next();
  };
  return {
    name: 'studio-admin-route',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), adminRoute()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
