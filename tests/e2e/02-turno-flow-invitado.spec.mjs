// ════════════════════════════════════════════════════════════════
//  02-turno-flow-invitado.spec.mjs
//  Flujo crítico que rompió múltiples veces (v37→v40):
//     login invitado → iniciar turno → ver cronómetro → parar
//  En modo invitado todo es 100% local (sin Supabase, sin red), así
//  que cualquier falla acá es 100% bug del frontend.
//
//  El sync cross-device entre cuentas reales requiere un usuario
//  válido en Supabase y vive en su propio spec (todavía no escrito).
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

test('flujo invitado: iniciar y parar un turno', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#initSplash')).toBeHidden({ timeout: 5_000 });

  // Click "Continuar como invitado" (texto exacto del botón en auth-screen.js:841)
  await page.getByRole('button', { name: /Continuar como invitado/i }).click();

  // Después de auth aparece el Home — el botón "INICIAR" es la señal canónica
  const iniciarBtn = page.getByRole('button', { name: /INICIAR/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 5_000 });

  // Iniciar turno
  await iniciarBtn.click();

  // Aparece el toast "Turno iniciado" + el botón cambia a "PARAR"
  await expect(page.getByText(/Turno iniciado/i)).toBeVisible({ timeout: 3_000 });
  const pararBtn = page.getByRole('button', { name: /PARAR/i });
  await expect(pararBtn).toBeVisible({ timeout: 3_000 });

  // Damos un par de segundos para que el cronómetro avance visiblemente.
  // (Si quedáramos bajo 60s al parar, la app descarta el turno.)
  await page.waitForTimeout(2_000);

  // Parar — el botón se llama "PARAR" cuando hay activo
  await pararBtn.click();

  // Vuelve a aparecer "INICIAR" — el turno menor a 60s se descarta
  // ("Turno muy corto — no registrado") pero el botón vuelve igual.
  await expect(page.getByRole('button', { name: /INICIAR/i })).toBeVisible({ timeout: 3_000 });
});

test('flujo invitado: el estado del turno persiste a través de un reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#initSplash')).toBeHidden({ timeout: 5_000 });
  await page.getByRole('button', { name: /Continuar como invitado/i }).click();

  const iniciarBtn = page.getByRole('button', { name: /INICIAR/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 5_000 });
  await iniciarBtn.click();
  await expect(page.getByRole('button', { name: /PARAR/i })).toBeVisible({ timeout: 3_000 });

  // Reload. Como invitado los datos viven en localStorage,
  // debería volver a aparecer el turno activo.
  await page.reload();
  await expect(page.locator('#initSplash')).toBeHidden({ timeout: 5_000 });

  // Después de recargar el botón PARAR sigue ahí — el turno activo
  // se restauró desde localStorage.
  await expect(page.getByRole('button', { name: /PARAR/i })).toBeVisible({ timeout: 5_000 });
});
