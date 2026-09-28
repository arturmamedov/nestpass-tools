import { defineConfig, devices } from '@playwright/test';

// No web server: tests/fixtures.ts answers https://nestpass.ai/ from web/ and the fake tool
// origin https://tools.test/ from tests/hosts/, so the tests use the production URLs and the
// same cross-origin load as the QR subdomain, without the network.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
});
