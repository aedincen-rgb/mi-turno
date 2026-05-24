// ════════════════════════════════════════════════════════════════
//  01-boot.spec.mjs
//  Tests más básicos: la app arranca y muestra algo usable.
//  Versión conservadora — solo verificamos lo que NUNCA debería
//  romperse independiente del estado de red/Supabase.
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

test('index.html sirve y trae el shell esperado', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status(), 'GET / debe responder OK').toBeLessThan(400);

  // El shell HTML (initSplash + #root) debe estar siempre presente,
  // independiente de que React monte o no — son nodos estáticos del index.html.
  await expect(page.locator('#root')).toBeAttached();
});

test('React monta y la app deja de mostrar el splash', async ({ page }) => {
  await page.goto('/');

  // Esperamos a que MT_APP_VERSION esté disponible — señal canónica de
  // que globals.js cargó. Margen amplio por arranque lento en CI.
  await page.waitForFunction(
    () => typeof window.MT_APP_VERSION === 'string' && window.MT_APP_VERSION.length > 0,
    null,
    { timeout: 15_000 }
  );

  // El #root tiene contenido renderizado por React (o el error fallback).
  // No nos importa QUÉ renderizó, solo que no quedó vacío.
  const root = page.locator('#root');
  await expect(root).not.toBeEmpty({ timeout: 15_000 });

  // El splash failsafe debería retirarse a los <2s por root.js useEffect.
  // Le damos hasta 10s por margen en CI.
  await expect(page.locator('#initSplash')).toBeHidden({ timeout: 10_000 });
});

test('MT_APP_VERSION en JS coincide con version.json', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.MT_APP_VERSION === 'string', null, {
    timeout: 15_000
  });

  const enJS = await page.evaluate(() => window.MT_APP_VERSION);
  const enJSON = await page
    .request.get('/version.json')
    .then((r) => r.json())
    .then((j) => j.v);

  expect(enJS, 'MT_APP_VERSION debe coincidir con version.json').toBe(enJSON);
});
