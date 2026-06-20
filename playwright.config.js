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
import fs from 'node:fs';

const PORT = 8123; // distinto al 8000 del dev server para no colisionar
const BASE_URL = `http://127.0.0.1:${PORT}`;

function findChrome() {
  const snapChrome = '/snap/chromium/current/usr/lib/chromium-browser/chrome';
  if (fs.existsSync(snapChrome)) return snapChrome;

  const base = `${process.env.HOME}/.cache/ms-playwright`;
  try {
    const dirs = fs
      .readdirSync(base)
      .filter((d) => d.indexOf('chromium-') === 0 && d.indexOf('headless') < 0);
    for (const d of dirs) {
      const chromeLinux64 = `${base}/${d}/chrome-linux64/chrome`;
      if (fs.existsSync(chromeLinux64)) return chromeLinux64;
      const chromeLinux = `${base}/${d}/chrome-linux/chrome`;
      if (fs.existsSync(chromeLinux)) return chromeLinux;
    }
  } catch (_) {}

  return undefined;
}

const chromiumExecutablePath = findChrome();
const chromiumArgs = [
  ...(chromiumExecutablePath && chromiumExecutablePath.indexOf('/snap/chromium/') === 0
    ? ['--headless=old']
    : []),
  '--no-sandbox'
];

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
        // builds oficiales de Playwright todavía (jun 2026). Si snap no
        // existe, usar el Chromium instalado por Playwright. El flag
        // --headless=old solo aplica a snap; Chromium moderno ya no lo acepta.
        launchOptions: {
          ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
          args: chromiumArgs
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
