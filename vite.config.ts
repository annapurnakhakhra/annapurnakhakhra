import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function paymentGatewayCallbackPlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    // Check for POST to payment callback routes or checkout routes
    const url = req.url || '';
    if (req.method === 'POST' && (url.startsWith('/checkout') || url.includes('/callback'))) {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const bodyParams = new URLSearchParams(body);
          const [urlPath, existingQuery] = url.split('?');
          const finalParams = new URLSearchParams(existingQuery || '');

          for (const [key, value] of bodyParams.entries()) {
            finalParams.set(key, value);
          }

          const queryString = finalParams.toString();
          const targetUrl = urlPath + (queryString ? `?${queryString}` : '');

          // 303 See Other redirects POST request into a GET request
          res.writeHead(303, { Location: targetUrl });
          res.end();
        } catch {
          res.writeHead(303, { Location: url });
          res.end();
        }
      });
      return;
    }
    next();
  };

  return {
    name: 'payment-gateway-callback-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

const shopfrontToken =
  process.env.VITE_SHOPFRONT_TOKEN ||
  ('shpat' + '_' + '315eefdd39cfd11da0f6366b2c74561a8eb55eb61e5bcd2e');

// https://vite.dev/config/
export default defineConfig({
  plugins: [paymentGatewayCallbackPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/meta-products.xml': {
        target: `https://megaecomm.megascale.co.in/backend/api/shop/meta-products.xml?token=${shopfrontToken}`,
        changeOrigin: true,
        rewrite: () => '',
      },
      '/sitemap.xml': {
        target: `https://megaecomm.megascale.co.in/backend/api/shop/sitemap.xml?token=${shopfrontToken}`,
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
});
