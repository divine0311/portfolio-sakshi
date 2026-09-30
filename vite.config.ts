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

// /blog            -> blog.html      (listing)
// /blog/<slug>     -> blog-post.html  (article)
// The article shell is one build output; the slug is read from the URL at
// runtime and matched against Supabase, so adding a post needs no rebuild.
function blogRoute(): Plugin {
  const rewrite = (req: IncomingMessage, _res: ServerResponse, next: () => void) => {
    const url = req.url ?? '';
    const clean = url.split('?')[0];
    if (clean === '/blog' || clean === '/blog/') {
      req.url = '/blog.html';
    } else if (/^\/blog\/[^/]+\/?$/.test(clean)) {
      req.url = '/blog-post.html' + url.slice(clean.length);
    }
    next();
  };
  return {
    name: 'blog-route',
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
    plugins: [react(), tailwindcss(), adminRoute(), blogRoute()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          blog: path.resolve(__dirname, 'blog.html'),
          'blog-post': path.resolve(__dirname, 'blog-post.html'),
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
