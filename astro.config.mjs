// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // `npm run dev` has no Worker; send /api (including the live WebSocket) to `wrangler dev`
    // (npm run dev:worker, port 8787) when it's running
    server: {
      proxy: { '/api': { target: 'http://localhost:8787', ws: true } },
    },
  },
});
