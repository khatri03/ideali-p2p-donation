import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Deliberately standalone rather than merged with vite.config.ts: that file reads the local HTTPS
// certificate pair at load time, which the test runner has no business requiring.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      app: path.resolve(__dirname, './src/app'),
      assets: path.resolve(__dirname, './src/assets'),
      components: path.resolve(__dirname, './src/components'),
      themeComponents: path.resolve(__dirname, './src/themeComponents'),
      utils: path.resolve(__dirname, './src/utils'),
      store: path.resolve(__dirname, './src/store'),
      theme: path.resolve(__dirname, './src/theme'),
      variables: path.resolve(__dirname, './src/variables'),
      contexts: path.resolve(__dirname, './src/contexts'),
      layouts: path.resolve(__dirname, './src/layouts'),
      views: path.resolve(__dirname, './src/views'),
      routes: path.resolve(__dirname, './src/routes'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/app/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.d.ts'],
    },
  },
});
