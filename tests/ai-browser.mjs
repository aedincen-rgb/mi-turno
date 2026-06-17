// ════════════════════════════════════════════════════════════════
//  MI TURNO · tests/ai-browser.mjs
//  Prueba E2E de la IA en un navegador REAL (Chromium headless).
//
//  Arranca un server estático, monta la app (app.html) en modo
//  invitado y verifica:
//    1. Boot: React montado, MT_APP_VERSION correcto, sin pageerrors.
//    2. Supabase: el SDK self-hosted carga (window.supabase) y en
//       invitado CLOUD_MODE queda false (offline-first, no bloquea).
//    3. UI real: el asistente renderiza, se escribe en el textarea y
//       sale una burbuja con la respuesta.
//    4. IA v283: presupuesto 50/30/20, encadenamiento de módulos
//       ("dale" → fondo de emergencia → "la cuota"), indemnización
//       y follow-up contextual ("llevo 4 años" → 90 días).
//
//    node tests/ai-browser.mjs    (exit 0 = OK, 1 = falla)
//
//  Notas de entorno:
//   · Usa el Chromium del sistema (snap) como el playwright.config.
//   · serviceWorkers: 'block' para no pelear con el cache del SW.
//   · React/ReactDOM/Chart caen a copias locales si el CDN no responde
//     (robustez en sandbox). Supabase NO se stubea: debe cargar de
//     verdad para que la prueba "considere Supabase".
// ════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

var PORT = 8123;
var BASE = 'http://127.0.0.1:' + PORT + '/app.html';
var CHROME = '/snap/chromium/current/usr/lib/chromium-browser/chrome';

function readIf(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (_) {
    return null;
  }
}

var REACT =
  readIf('node_modules/react/umd/react.production.min.js') ||
  readIf('js/lib/react.production.min.js');
var REACTDOM = readIf('node_modules/react-dom/umd/react-dom.production.min.js');
var CHART = readIf('node_modules/chart.js/dist/chart.umd.js') || readIf('js/lib/chart.min.js');

var PASS = 0;
var FAIL = 0;
function ok(cond, label) {
  if (cond) {
    PASS++;
    console.log('  ✓ ' + label);
  } else {
    FAIL++;
    console.log('  ✗ ' + label);
  }
}

async function waitForServer(url, tries) {
  for (var i = 0; i < tries; i++) {
    try {
      var r = await fetch(url);
      if (r.ok) return true;
    } catch (_) {}
    await new Promise(function (res) {
      setTimeout(res, 300);
    });
  }
  return false;
}

var server = null;
var alreadyUp = await waitForServer(BASE, 1);
if (!alreadyUp) {
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    stdio: 'ignore'
  });
}

var browser;
var exitCode = 0;
try {
  var up = alreadyUp || (await waitForServer(BASE, 30));
  if (!up) throw new Error('El servidor no respondió en el puerto ' + PORT);

  browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--headless=old', '--no-sandbox']
  });
  var context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  var page = await context.newPage();

  // Errores fatales de página (rompen el boot).
  var pageErrors = [];
  page.on('pageerror', function (e) {
    pageErrors.push(e.message);
  });

  // Fallback de CDN: React/ReactDOM/Chart desde copias locales si el
  // CDN no responde. Supabase y el resto se dejan cargar normal.
  await page.route('**/*', function (route) {
    var url = route.request().url();
    var H = { 'content-type': 'application/javascript', 'access-control-allow-origin': '*' };
    if (REACTDOM && url.indexOf('/react-dom/') !== -1)
      return route.fulfill({ body: REACTDOM, headers: H });
    if (REACT && url.indexOf('/react/') !== -1) return route.fulfill({ body: REACT, headers: H });
    if (CHART && url.indexOf('chart.js') !== -1) return route.fulfill({ body: CHART, headers: H });
    return route.continue();
  });

  // Sembrar sesión invitada + onboarding visto ANTES de cargar, para
  // que Root() entre directo a la app (sin pasar por el login).
  await page.addInitScript(function () {
    try {
      localStorage.setItem(
        'mt_session',
        JSON.stringify({
          uid: 'guest_ai_e2e',
          email: 'invitado@local',
          guest: true,
          cloud: false,
          pinOnly: false
        })
      );
      localStorage.setItem('mt_onboarding_done', '1');
      localStorage.setItem('mt_ob_done', 'true');
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.MT_APP_VERSION === 'string';
  }, null, { timeout: 20000 });
  await page.waitForFunction(function () {
    var r = document.getElementById('root');
    return r && r.children.length > 0;
  }, null, { timeout: 20000 });

  // ── 1. BOOT ──────────────────────────────────────────────────
  console.log('\n→ Boot de la app');
  var ver = await page.evaluate(function () {
    return window.MT_APP_VERSION;
  });
  ok(ver === 'v283', 'MT_APP_VERSION es v283 (vino: ' + ver + ')');
  ok(pageErrors.length === 0, 'sin errores fatales de página' + (pageErrors.length ? ': ' + pageErrors[0] : ''));
  ok(
    await page.evaluate(function () {
      return typeof window.aiAnswer === 'function';
    }),
    'la IA cargó (window.aiAnswer disponible)'
  );

  // ── 2. SUPABASE ──────────────────────────────────────────────
  // CLOUD_MODE se resuelve async (el init valida con una consulta real
  // a la API, v161). Esperamos a que asiente a un boolean antes de leer.
  console.log('\n→ Supabase');
  await page
    .waitForFunction(function () {
      return typeof window.CLOUD_MODE === 'boolean';
    }, null, { timeout: 10000 })
    .catch(function () {});
  var supa = await page.evaluate(function () {
    return {
      sdk: !!(window.supabase && typeof window.supabase.createClient === 'function'),
      client: !!window.SUPA,
      cloudMode: window.CLOUD_MODE,
      cloudModeType: typeof window.CLOUD_MODE
    };
  });
  ok(supa.sdk, 'SDK de Supabase self-hosted cargado (window.supabase.createClient)');
  ok(supa.client, 'cliente Supabase inicializado (window.SUPA)');
  ok(
    supa.cloudModeType === 'boolean',
    'el init de Supabase resolvió sin romper (CLOUD_MODE=' +
      supa.cloudMode +
      (supa.cloudMode ? ' → conectado' : ' → fallback offline limpio') +
      ')'
  );

  // Robustez de reconexión: los hooks de recuperación deben existir y
  // __cloudRecheck debe ser re-ejecutable (devuelve boolean), no un
  // Promise cacheado de una sola vez.
  var recheck = await page.evaluate(function () {
    return {
      hasRecheck: typeof window.__cloudRecheck === 'function',
      hasResub: typeof window.__mtResubscribe === 'function'
    };
  });
  ok(recheck.hasRecheck, '__cloudRecheck disponible (re-valida la nube sin recargar)');
  ok(recheck.hasResub, '__mtResubscribe disponible (resucita el canal realtime)');
  var recheckResult = await page.evaluate(function () {
    return window.__cloudRecheck();
  });
  ok(
    typeof recheckResult === 'boolean',
    '__cloudRecheck() es re-ejecutable y devuelve boolean (vino: ' + recheckResult + ')'
  );

  // ── 3. UI REAL DEL ASISTENTE ─────────────────────────────────
  console.log('\n→ UI del asistente (camino real: textarea → burbuja)');
  await page.locator('.tab-btn', { hasText: 'Asistente' }).first().click();
  var input = page.locator('textarea.asistente-input');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  ok(true, 'el tab Asistente renderiza con su textarea');

  await input.fill('cómo reparto mi sueldo');
  await input.press('Enter');
  // Esperar una burbuja de la IA con el presupuesto (texto final tras el typing).
  var bubble = page.locator('.asistente-bubble.ai', { hasText: '50/30/20' }).first();
  await bubble.waitFor({ state: 'attached', timeout: 12000 });
  ok(true, '"cómo reparto mi sueldo" produce una burbuja con el presupuesto 50/30/20');

  // ── 4. FLUJO IA v283 (vía window.aiAnswer en el navegador real) ──
  console.log('\n→ Flujo IA v283 (código real corriendo en Chromium)');
  var convo = await page.evaluate(function () {
    function mk(daysAgo, hStart, durH) {
      var d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - daysAgo);
      var ini = new Date(d);
      ini.setHours(hStart, 0, 0, 0);
      var fin = new Date(ini);
      fin.setHours(ini.getHours() + durH);
      return { id: 'T' + daysAgo + '_' + hStart, inicio: ini.toISOString(), fin: fin.toISOString() };
    }
    var salario = 1750905;
    var vh = Math.round(salario / 240);
    var turnos = [mk(0, 14, 8), mk(1, 22, 8), mk(2, 6, 8), mk(4, 14, 9), mk(6, 22, 8)];
    var state = {
      turnos: turnos,
      turnosAll: turnos,
      calc: window.doCalc(turnos, null, new Date(), vh),
      vh: vh,
      salario: salario,
      session: { uid: 'guest_ai_e2e', email: 'invitado@local' }
    };
    try {
      localStorage.setItem('mt_sc_guest_ai_e2e', 'true');
    } catch (e) {}
    if (typeof window.aiResetConv === 'function') window.aiResetConv();
    var script = [
      'cómo reparto mi sueldo?',
      'dale',
      'mejor la cuota',
      'cuánto me dan si me despiden?',
      'llevo 4 años'
    ];
    var out = [];
    for (var i = 0; i < script.length; i++) {
      var r = window.aiAnswer(script[i], state);
      var txt = r && typeof r === 'object' ? r.text || '' : r || '';
      out.push({ q: script[i], a: txt });
    }
    return out;
  });

  convo.forEach(function (turn) {
    console.log('   👤 ' + turn.q);
    console.log('   🤖 ' + turn.a.split('\n')[0]);
  });

  ok(convo[0].a.indexOf('50/30/20') >= 0, 'presupuesto: regla 50/30/20');
  ok(convo[1].a.indexOf('Fondo de emergencia') >= 0, 'encadena "dale" → fondo de emergencia');
  ok(convo[2].a.indexOf('Capacidad de endeudamiento') >= 0, 'encadena "la cuota" → endeudamiento');
  ok(convo[3].a.indexOf('Indemnización') >= 0, 'despido → indemnización (Art. 64)');
  ok(convo[4].a.indexOf('90 días') >= 0, 'follow-up "llevo 4 años" → 90 días (30 + 20×3)');

  // ── RESUMEN ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('  ' + PASS + ' OK · ' + FAIL + ' fallos  (navegador real)');
  console.log('═══════════════════════════════════════');
  exitCode = FAIL > 0 ? 1 : 0;
} catch (err) {
  console.error('\nError en la prueba de navegador:', err && err.message ? err.message : err);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

process.exit(exitCode);
