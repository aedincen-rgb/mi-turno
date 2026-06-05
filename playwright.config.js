// ════════════════════════════════════════════════════════════════
//  playwright.config.js
//  Tests E2E: corren contra un server estático local (python http)
//  en 2 navegadores: Chrome desktop + WebKit móvil (motor de iOS Safari,
//  el mismo que usa la PWA pinned al home).
//
//  Local:  npm run test:e2e
//  CI:     .github/workflows/e2e.yml
// ════════════════════════════════════════════════════════════════

import { defineConfig, devices } from '@playwright/test';

const PORT = 8123; // distinto al 8000 del dev server para no colisionar
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Carpeta donde Playwright guarda videos/screenshots/traces de las fallas
  outputDir: 'test-results',
  // Timeouts conservadores: la PWA tiene splash de hasta 1.5s
  timeout: 30_000,
  expect: { timeout: 8_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',

  use: {
    baseURL: BASE_URL,
    // Trace + video + screenshot: desactivados porque Playwright 1.56 no tiene
    // builds para ubuntu 26.04 (ni chromium, ni ffmpeg, ni webkit).
    // Mientras tanto, usamos chromium snap del sistema con --headless=old.
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    // La app usa localStorage; no compartir entre tests
    storageState: undefined
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        // Usar chromium snap del sistema porque ubuntu 26.04 no tiene
        // builds oficiales de Playwright todavía (jun 2026).
        // --headless=old fuerza el modo clásico sin headless_shell separado.
        launchOptions: {
          executablePath: '/snap/chromium/current/usr/lib/chromium-browser/chrome',
          args: ['--headless=old', '--no-sandbox']
        }
      }
    },
    // WebKit no disponible en ubuntu 26.04 sin build de Playwright.
    // Se reactivará cuando Playwright agregue soporte para ubuntu 26.04.
    // {
    //   name: 'webkit-iphone',
    //   use: { ...devices['iPhone 14'] }
    // }
  ],

  webServer: {
    // El mismo comando del package.json "dev", solo cambiamos el puerto
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
