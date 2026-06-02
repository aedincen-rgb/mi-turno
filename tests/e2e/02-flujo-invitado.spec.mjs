// ════════════════════════════════════════════════════════════════
//  02-flujo-invitado.spec.mjs
//  Flujo crítico que rompió múltiples veces (v37 → v40):
//     iniciar turno → parar
//     reload → estado del turno persiste
//
//  Modo invitado = 100% local (sin Supabase), así que cualquier
//  falla acá es 100% bug del frontend.
//
//  Diseño: seed la sesión directo via localStorage para saltar el
//  auth screen. Los selectors visuales de auth son frágiles y no son
//  el foco de este spec — el foco es iniciar/parar/reload.
// ════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

// Auto-skip si el entorno no puede llegar a la CDN de React.
// El environment de Claude Code on the web bloquea cdnjs.cloudflare.com,
// así que estos tests funcionales solo corren en CI (red abierta).
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

// Seed: instala una sesión invitada en localStorage ANTES de cargar la
// página, así Root() arranca directo en AppMain sin pasar por AuthScreen.
async function bootAsGuest(page) {
  // Necesitamos un origin antes de poder escribir en localStorage,
  // así que primero hacemos una nav y después seteamos + reload.
  await page.goto('/');
  await page.evaluate(() => {
    const guestSession = {
      uid: 'guest_test_e2e',
      email: 'invitado@local',
      guest: true,
      cloud: false,
      pinOnly: false
    };
    localStorage.setItem('mt_session', JSON.stringify(guestSession));
  });
  await page.reload();
  // App montada cuando MT_APP_VERSION existe
  await page.waitForFunction(() => typeof window.MT_APP_VERSION === 'string', null, {
    timeout: 20_000
  });
  // #root tiene contenido (React montó)
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
}

// Helper: lee el turno activo desde localStorage de la propia app.
// Más confiable que cualquier selector visual.
async function getActivoFromStorage(page) {
  return page.evaluate(() => {
    // dk(uid, 'a') = 'mt_a_<uid>' — ver js/utils/time.js
    const raw = localStorage.getItem('mt_a_guest_test_e2e');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });
}

// Helper: click al botón de acción via JavaScript nativo.
// Playwright click({ force: true }) en WebKit-iPhone no siempre dispara
// el handler de React cuando el botón tiene CSS animation continua
// (btn3dBreathe: translateY oscilante). page.evaluate().click() envía
// un evento nativo que React captura siempre, sin depender de las
// coordenadas del botón animado.
async function clickActionBtn(page) {
  // Esperar a que el botón exista y sea visible
  const actionBtn = page.locator('button.action-btn');
  await expect(actionBtn).toBeVisible({ timeout: 10_000 });

  // Esperar a que el splash haya terminado completamente
  // (el initSplash HTML se retira, y el React SplashScreen ya no existe)
  await page.waitForFunction(
    () => !document.getElementById('initSplash') && !document.querySelector('.splash'),
    null,
    { timeout: 10_000 }
  );

  // Click via JavaScript nativo — bypassa problemas de coordenadas en
  // WebKit con elementos animados por CSS transforms
  await page.evaluate(() => {
    const btn = document.querySelector('button.action-btn');
    if (btn) btn.click();
  });
}

test('iniciar y parar turno actualiza localStorage', async ({ page }) => {
  await bootAsGuest(page);

  // No hay turno activo aún
  expect(await getActivoFromStorage(page), 'sin turno al inicio').toBeNull();

  // Click el botón principal via JS nativo
  await clickActionBtn(page);

  // Esperamos a que el activo aparezca en localStorage
  await expect.poll(
    async () => await getActivoFromStorage(page),
    { message: 'turno activo debe aparecer tras click', timeout: 5_000 }
  ).not.toBeNull();

  // La clase del botón cambia a action-btn-stop (parar)
  const actionBtn = page.locator('button.action-btn');
  await expect(actionBtn).toHaveClass(/action-btn-stop/, { timeout: 3_000 });

  // Damos 1.5s antes de parar (el código descarta turnos < 60s, pero
  // el cambio de estado en localStorage es lo que importa acá)
  await page.waitForTimeout(1_500);

  // Segundo click: parar turno (via JS nativo)
  await page.evaluate(() => {
    const btn = document.querySelector('button.action-btn');
    if (btn) btn.click();
  });

  // Vuelve a estado "iniciar" (sin activo)
  await expect.poll(
    async () => await getActivoFromStorage(page),
    { message: 'activo debe limpiarse tras click', timeout: 5_000 }
  ).toBeNull();
  await expect(actionBtn).toHaveClass(/action-btn-go/, { timeout: 3_000 });
});

test('turno activo persiste a través de un reload', async ({ page }) => {
  await bootAsGuest(page);

  // Click el botón principal via JS nativo
  await clickActionBtn(page);

  // Esperar que el activo esté en localStorage
  await expect.poll(
    async () => await getActivoFromStorage(page),
    { message: 'turno activo guardado antes del reload', timeout: 5_000 }
  ).not.toBeNull();

  const activoAntes = await getActivoFromStorage(page);

  // Reload
  await page.reload();
  await page.waitForFunction(() => typeof window.MT_APP_VERSION === 'string', null, {
    timeout: 20_000
  });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });

  // El activo debe seguir ahí (mismo id e inicio)
  const activoDespues = await getActivoFromStorage(page);
  expect(activoDespues, 'activo restaurado tras reload').not.toBeNull();
  expect(activoDespues.id, 'mismo id').toBe(activoAntes.id);
  expect(activoDespues.inicio, 'mismo inicio').toBe(activoAntes.inicio);

  // El botón también refleja el estado "stop"
  await expect(page.locator('button.action-btn')).toHaveClass(/action-btn-stop/, {
    timeout: 5_000
  });
});

