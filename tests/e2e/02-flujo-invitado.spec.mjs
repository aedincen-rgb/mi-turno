// ════════════════════════════════════════════════════════════════
//  02-flujo-invitado.spec.mjs
//  Flujo crítico que rompió múltiples veces (v37 → v40):
//     login invitado → iniciar turno → parar
//     reload → estado del turno persiste
//  Modo invitado = 100% local (sin Supabase), así que cualquier
//  falla acá es 100% bug del frontend.
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

// Auto-skip si el entorno no puede llegar a la CDN de React.
// El environment de Claude Code on the web bloquea cdnjs.cloudflare.com,
// así que estos tests funcionales solo corren en CI (red abierta).
// El test 01-boot sigue corriendo local porque solo verifica HTML estático.
test.beforeAll(async ({ request }) => {
  try {
    const res = await request.head(
      'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
      { timeout: 4000 }
    );
    if (res.status() >= 400) {
      test.skip(true, 'CDN inalcanzable desde este entorno (esperado fuera de CI)');
    }
  } catch (_) {
    test.skip(true, 'CDN inalcanzable desde este entorno (esperado fuera de CI)');
  }
});

// Helper: navega y espera a que React haya montado.
// La señal canónica de "app montada" es que window.MT_APP_VERSION exista
// (lo declara globals.js, que carga después del splash). Más confiable
// que esperar por un selector visual.
async function bootApp(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => typeof window.MT_APP_VERSION === 'string',
    null,
    { timeout: 15_000 }
  );
  // #root tiene contenido renderizado por React
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
}

test('flujo invitado: login → iniciar → parar', async ({ page }) => {
  await bootApp(page);

  // Login invitado (botón en auth-screen.js:841)
  const guestBtn = page.getByRole('button', { name: /Continuar como invitado/i });
  await expect(guestBtn).toBeVisible({ timeout: 15_000 });
  await guestBtn.click();

  // Pantalla principal con botón "INICIAR"
  const iniciarBtn = page.getByRole('button', { name: /^INICIAR$/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 10_000 });
  await iniciarBtn.click();

  // Tras iniciar aparece "PARAR" — esto rompió en v37-v40 cuando
  // queueAction no flushaba; el setActivo local sí actualizaba el botón,
  // así que este test no cubre ese bug específico, pero sí confirma el
  // happy path de toda la cadena del frontend.
  const pararBtn = page.getByRole('button', { name: /^PARAR$/i });
  await expect(pararBtn).toBeVisible({ timeout: 5_000 });

  // Damos 1.5s antes de parar — el código descarta turnos < 60s
  // (línea 540 de app-main.js), pero el flujo del botón es el mismo.
  await page.waitForTimeout(1_500);
  await pararBtn.click();

  // Vuelve a "INICIAR"
  await expect(iniciarBtn).toBeVisible({ timeout: 5_000 });
});

test('flujo invitado: turno activo persiste a través de un reload', async ({ page }) => {
  await bootApp(page);

  const guestBtn = page.getByRole('button', { name: /Continuar como invitado/i });
  await expect(guestBtn).toBeVisible({ timeout: 15_000 });
  await guestBtn.click();

  const iniciarBtn = page.getByRole('button', { name: /^INICIAR$/i });
  await expect(iniciarBtn).toBeVisible({ timeout: 10_000 });
  await iniciarBtn.click();

  await expect(page.getByRole('button', { name: /^PARAR$/i })).toBeVisible({ timeout: 5_000 });

  // Reload — los datos del invitado viven en localStorage local
  // (mt_a_<uid> via dk()). Tras el reload el turno activo debe restaurarse.
  await page.reload();
  await page.waitForFunction(() => typeof window.MT_APP_VERSION === 'string', null, {
    timeout: 15_000
  });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });

  // PARAR debe seguir visible — el turno activo fue restaurado desde
  // localStorage por cargarDatos() en el boot
  await expect(page.getByRole('button', { name: /^PARAR$/i })).toBeVisible({ timeout: 15_000 });
});
