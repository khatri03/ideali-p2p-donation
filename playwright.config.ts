import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH, e2eEnv } from './e2e/support/e2eEnv';

/**
 * The dev server and the API both serve HTTPS with machine-local mkcert certificates, so certificate
 * errors are ignored here and only here - never in application code.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: e2eEnv.baseUrl,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'database',
      testMatch: /.*\.database\.spec\.ts/,
    },
    {
      // The phase-8 ship-gate sweep sets its own widths, so it runs once rather than under each viewport.
      name: 'shipgate',
      testMatch: /.*\.gate\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        storageState: STORAGE_STATE_PATH,
      },
    },
    {
      name: 'desktop',
      testMatch: /.*\.ui\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        storageState: STORAGE_STATE_PATH,
      },
    },
    {
      name: 'tablet',
      testMatch: /.*\.ui\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        storageState: STORAGE_STATE_PATH,
      },
    },
    {
      name: 'mobile',
      testMatch: /.*\.ui\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: false,
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
});
