// ════════════════════════════════════════════════════════════════
//  02-turno-flow-invitado.spec.mjs
//  Flujo crítico que rompió múltiples veces (v37→v40):
//     login invitado → iniciar turno → ver cronómetro → parar
//
//  Versión conservadora del PR inicial — usa timeouts amplios y
//  espera explícita por la app montada. El sync cross-device con
//  cuenta real de Supabase vive en su propio spec (todavía no escrito).
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

// Helper: navega y espera a que la app esté montada (no solo el HTML).
async function bootApp(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => typeof window.MT_APP_VERSION === 'string',
    null,
    { timeout: 15_000 }
  );
  // Esperar a que algo se renderice en #root (auth screen, fast-pin, o app).
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
}

test('flujo invitado: iniciar y parar un turno', async ({ page }) => {
  await bootApp(page);

  // El botón "Continuar como invitado (sin cuenta)" — buscamos por texto
  // parcial (el emoji 👤 puede o no entrar al accessible name).
  const guestBtn = page.getByRole('button', { name: /Continuar como invitado/i });
  await expect(guestBtn).toBeVisible({ timeout: 15_000 });
  await guestBtn.click();

  // Después de auth, aparece la pantalla principal con el botón "INICIAR"
  const iniciarBtn = page.getByRole('button', { name: /INICIAR/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 10_000 });
  await iniciarBtn.click();

  // El botón cambia a "PARAR" cuando hay un turno activo
  const pararBtn = page.getByRole('button', { name: /PARAR/i });
  await expect(pararBtn).toBeVisible({ timeout: 5_000 });

  // Esperamos > 60s sería irreal en CI. Dejamos el turno chiquito (será
  // descartado por "turno muy corto"), pero el flujo del botón vuelve igual.
  await page.waitForTimeout(1_500);
  await pararBtn.click();

  // Vuelve "INICIAR"
  await expect(page.getByRole('button', { name: /INICIAR/i })).toBeVisible({ timeout: 5_000 });
});

test('flujo invitado: el turno activo persiste a través de un reload', async ({ page }) => {
  await bootApp(page);

  const guestBtn = page.getByRole('button', { name: /Continuar como invitado/i });
  await expect(guestBtn).toBeVisible({ timeout: 15_000 });
  await guestBtn.click();

  const iniciarBtn = page.getByRole('button', { name: /INICIAR/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 10_000 });
  await iniciarBtn.click();

  await expect(page.getByRole('button', { name: /PARAR/i })).toBeVisible({ timeout: 5_000 });

  // Reload — como invitado los datos viven en localStorage local
  await page.reload();
  await page.waitForFunction(() => typeof window.MT_APP_VERSION === 'string', null, {
    timeout: 15_000
  });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });

  // Tras recargar, el turno activo debe estar restaurado
  await expect(page.getByRole('button', { name: /PARAR/i })).toBeVisible({ timeout: 15_000 });
});
