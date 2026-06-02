// ════════════════════════════════════════════════════════════════
//  MI TURNO · tests/a11y.mjs
//  Auditoría de accesibilidad WCAG 2.1 A/AA con axe-core + Playwright.
//
//  Arranca su propio servidor estático, recorre las 6 pantallas
//  (Login + las 5 tabs) y reporta las violaciones. Sale con código 1
//  si encuentra alguna — apto para CI y para demostrar en vivo.
//
//    npm run test:a11y
//
//  Notas de entorno:
//   · Bloquea el Service Worker (serviceWorkers: 'block') para que
//     Playwright pueda interceptar los fetch.
//   · Si hay copias locales de React UMD en node_modules las sirve en
//     lugar del CDN (útil en sandboxes de CI que bloquean el CDN). Si
//     no, deja que el CDN real cargue.
// ════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

var PORT = 8123;
var BASE = 'http://127.0.0.1:' + PORT + '/index.html';

function readIf(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (_) {
    return null;
  }
}

var AXE = readIf('node_modules/axe-core/axe.min.js');
if (!AXE) {
  console.error('Falta axe-core. Instalá las devDependencies:  npm install');
  process.exit(2);
}
var REACT = readIf('node_modules/react/umd/react.production.min.js');
var REACTDOM = readIf('node_modules/react-dom/umd/react-dom.production.min.js');
var CHART = readIf('node_modules/chart.js/dist/chart.umd.js');

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

async function audit(page, label) {
  await page.evaluate(AXE);
  var res = await page.evaluate(async function () {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    });
  });
  var v = res.violations;
  var tag = v.length === 0 ? '✓' : '✗';
  console.log(
    '\n' + tag + ' ' + label + '  —  violaciones: ' + v.length + ' | aprobadas: ' + res.passes.length
  );
  v.forEach(function (x) {
    console.log('   [' + x.impact + '] ' + x.id + ': ' + x.help + ' (' + x.nodes.length + ')');
    x.nodes.slice(0, 5).forEach(function (n) {
      console.log('       -> ' + n.target.join(' '));
    });
  });
  return v;
}

// Reusa un servidor ya corriendo en el puerto; solo arranca uno si hace falta.
var server = null;
var alreadyUp = await waitForServer(BASE, 1);
if (!alreadyUp) {
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    stdio: 'ignore'
  });
}

var exitCode = 0;
var browser;
try {
  var up = alreadyUp || (await waitForServer(BASE, 30));
  if (!up) throw new Error('El servidor no respondió en el puerto ' + PORT);

  browser = await chromium.launch();
  var context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  var page = await context.newPage();

  await page.route('**/*', function (route) {
    var url = route.request().url();
    var H = { 'content-type': 'application/javascript', 'access-control-allow-origin': '*' };
    if (REACTDOM && url.indexOf('/react-dom/') !== -1)
      return route.fulfill({ body: REACTDOM, headers: H });
    if (REACT && url.indexOf('/react/') !== -1) return route.fulfill({ body: REACT, headers: H });
    if (CHART && url.indexOf('chart.js') !== -1) return route.fulfill({ body: CHART, headers: H });
    if (url.indexOf('supabase') !== -1 || url.indexOf('jspdf') !== -1 || url.indexOf('xlsx') !== -1)
      return route.fulfill({ body: '/* stub */', headers: H });
    return route.continue();
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  var all = [];
  all.push(['Login', await audit(page, 'Pantalla Login')]);

  var guest = page.getByRole('button', { name: /invitado/i }).first();
  if (await guest.count()) {
    await guest.click();
    await page.waitForTimeout(1500);
    all.push(['Inicio', await audit(page, 'Tab Inicio')]);

    var tabs = ['Historial', 'Análisis', 'Asistente', 'Ajustes'];
    for (var t of tabs) {
      var ok = false;
      var cands = [
        page.getByRole('button', { name: new RegExp(t, 'i') }).first(),
        page
          .locator('nav button, .nav-item, .tab-item, [class*="nav"] button')
          .filter({ hasText: new RegExp(t, 'i') })
          .first()
      ];
      for (var sel of cands) {
        if (await sel.count()) {
          try {
            await sel.click({ timeout: 2000 });
            ok = true;
            break;
          } catch (_) {}
        }
      }
      if (ok) {
        await page.waitForTimeout(1200);
        all.push([t, await audit(page, 'Tab ' + t)]);
      } else {
        console.log('\n(no se pudo abrir ' + t + ')');
      }
    }
  } else {
    console.log('\n(no se encontró el botón de invitado — solo se auditó Login)');
  }

  var total = 0;
  console.log('\n═══════════════ RESUMEN ═══════════════');
  all.forEach(function (row) {
    total += row[1].length;
    console.log('  ' + (row[1].length === 0 ? '✓' : '✗') + ' ' + row[0] + ': ' + row[1].length);
  });
  console.log('  ───────────────────────────────────');
  console.log('  TOTAL violaciones: ' + total + (total === 0 ? '  —  WCAG 2.1 A/AA ✓' : ''));
  console.log('═══════════════════════════════════════');
  exitCode = total === 0 ? 0 : 1;
} catch (err) {
  console.error('\nError en la auditoría:', err && err.message ? err.message : err);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

process.exit(exitCode);
