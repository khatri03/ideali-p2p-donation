import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import fs from 'fs';

const httpsKeyPath = process.env.DEV_HTTPS_KEY;
const httpsCertPath = process.env.DEV_HTTPS_CERT;

if (Boolean(httpsKeyPath) !== Boolean(httpsCertPath)) {
  throw new Error(
    'DEV_HTTPS_KEY and DEV_HTTPS_CERT must be set together. Set both to serve the dev server over HTTPS, or neither to serve over HTTP.',
  );
}

// Defaults to the machine-local mkcert pair in ./ssl; DEV_HTTPS_* overrides it for
// certificates kept outside the repository.
const devHttps = {
  key: fs.readFileSync(httpsKeyPath ?? './ssl/key.pem'),
  cert: fs.readFileSync(httpsCertPath ?? './ssl/cert.pem'),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Map src to absolute path for imports
      src: path.resolve(__dirname, './src'),
      app: path.resolve(__dirname, './src/app'),
      assets: path.resolve(__dirname, './src/assets'),
      components: path.resolve(__dirname, './src/components'),
      themeComponents: path.resolve(__dirname, './src/themeComponents'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    https: devHttps,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'https://api.testing.ideali.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    target: 'es2018',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@chakra-ui/react',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
    ],
  },
});
