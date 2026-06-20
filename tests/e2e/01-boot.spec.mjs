// ════════════════════════════════════════════════════════════════
//  01-boot.spec.mjs
//  Test mínimo: el server sirve algo, el HTML tiene el shell esperado.
//  Versión ULTRA conservadora para validar la infra del workflow.
//  Si esto pasa, agregamos más tests en commits siguientes.
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

const APP_PATH = '/app.html';

test('GET /app.html responde 200 y contiene #root', async ({ page, request, baseURL }) => {
  console.log('[TEST] baseURL =', baseURL);

  // Primero: el server responde a HTTP directo (sin renderizar).
  const res = await request.get(APP_PATH);
  console.log('[TEST] GET ' + APP_PATH + ' status =', res.status());
  expect(res.status()).toBeLessThan(400);

  const html = await res.text();
  console.log('[TEST] HTML length =', html.length);
  expect(html).toContain('id="root"');
  expect(html).toContain('id="initSplash"');

  // Segundo: la página navega sin errores.
  const navRes = await page.goto(APP_PATH, { waitUntil: 'domcontentloaded' });
  console.log('[TEST] page.goto status =', navRes?.status());
  expect(navRes?.status()).toBeLessThan(400);

  // El #root es un nodo del HTML estático, debe existir SIEMPRE.
  await expect(page.locator('#root')).toBeAttached({ timeout: 5_000 });
});

test('version.json se sirve y es JSON válido con la versión esperada', async ({ request }) => {
  const res = await request.get('/version.json');
  console.log('[TEST] /version.json status =', res.status());
  expect(res.status()).toBe(200);

  const data = await res.json();
  console.log('[TEST] version.json =', JSON.stringify(data));
  expect(data).toHaveProperty('v');
  expect(data.v).toMatch(/^v\d+$/);
});
