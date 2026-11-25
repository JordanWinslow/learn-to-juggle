import { defineConfig } from 'playwright/test';

const port = 3193;
const deployedURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = deployedURL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL, reducedMotion: 'reduce', screenshot: 'only-on-failure' },
  projects: [
    { name: 'Phone', use: { viewport: { width: 320, height: 568 }, hasTouch: true } },
    { name: 'Desktop', use: { viewport: { width: 1280, height: 720 } } },
  ],
  webServer: deployedURL ? undefined : {
    command: `npm run start -- --ip 127.0.0.1 --port ${port}`,
    url: baseURL,
  },
});
