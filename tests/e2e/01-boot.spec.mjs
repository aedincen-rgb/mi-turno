// ════════════════════════════════════════════════════════════════
//  01-boot.spec.mjs
//  Tests más básicos: la app arranca, no tira errores fatales en
//  consola, y la pantalla inicial termina mostrando algo usable
//  (auth o fast-pin o app).
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

test('app carga sin errores fatales y oculta el splash', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  // El splash failsafe se retira solo a los 8s; queremos verlo desaparecer
  // bastante antes — el render normal del Root debería retirarlo a los <1s.
  // Si tarda más, algo se rompió en la carga (init.js, React, etc.)
  const splash = page.locator('#initSplash');
  await expect(splash).toBeHidden({ timeout: 5_000 });

  // El root tiene contenido renderizado
  const root = page.locator('#root');
  await expect(root).not.toBeEmpty();

  // Filtramos errores conocidos no-críticos (CORS de iconos, etc.)
  const fatales = consoleErrors.filter(
    (e) =>
      !/favicon|chrome-extension|web-share|workbox/i.test(e) &&
      !/^Failed to load resource: net::ERR_/i.test(e)
  );
  expect(fatales, 'no debería haber errores fatales en consola').toEqual([]);
});

test('versión visible en window.MT_APP_VERSION coincide con version.json', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#initSplash')).toBeHidden({ timeout: 5_000 });

  const enJS = await page.evaluate(() => window.MT_APP_VERSION);
  const enJSON = await page
    .request.get('/version.json')
    .then((r) => r.json())
    .then((j) => j.v);

  expect(enJS, 'MT_APP_VERSION debe coincidir con version.json').toBe(enJSON);
});
