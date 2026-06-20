// ════════════════════════════════════════════════════════════════
//  MI TURNO · tests/ai-coverage.mjs
//  Auditoría anti-huérfanos: levanta app.html en Chromium (modo
//  invitado, sin red) y dispara, en lenguaje natural, una pregunta
//  por cada capacidad de la IA. Falla (exit 1) si alguna NO se
//  alcanza desde el ruteo real — para que pedir una función nueva
//  y olvidar cablearla no pase silencioso nunca más.
//
//    node tests/ai-coverage.mjs     (exit 0 = todas vivas, 1 = hay muertas)
//
//  Notas de entorno (idénticas a tests/ai-browser.mjs):
//   · Usa el Chromium de Playwright; CDN de React/Chart cae a copias
//     locales; Supabase queda offline (invitado), no bloquea.
//   · aiAnswer puede devolver una Promesa (rutas async): se await-ea.
// ════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

var PORT = 8000;
var BASE = 'http://127.0.0.1:' + PORT + '/app.html';

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

// Chromium de Playwright (full build); fallback al que resuelva playwright.
function findChrome() {
  var base = process.env.HOME + '/.cache/ms-playwright';
  try {
    var dirs = fs.readdirSync(base).filter(function (d) {
      return d.indexOf('chromium-') === 0 && d.indexOf('headless') < 0;
    });
    for (var i = 0; i < dirs.length; i++) {
      var p = base + '/' + dirs[i] + '/chrome-linux64/chrome';
      if (fs.existsSync(p)) return p;
      var p2 = base + '/' + dirs[i] + '/chrome-linux/chrome';
      if (fs.existsSync(p2)) return p2;
    }
  } catch (_) {}
  return undefined;
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
    executablePath: findChrome(),
    args: ['--headless=old', '--no-sandbox']
  });
  var ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  var page = await ctx.newPage();

  await page.route('**/*', function (route) {
    var url = route.request().url();
    var H = { 'content-type': 'application/javascript', 'access-control-allow-origin': '*' };
    if (REACTDOM && url.indexOf('/react-dom/') !== -1)
      return route.fulfill({ body: REACTDOM, headers: H });
    if (REACT && url.indexOf('/react/') !== -1) return route.fulfill({ body: REACT, headers: H });
    if (CHART && url.indexOf('chart.js') !== -1) return route.fulfill({ body: CHART, headers: H });
    return route.continue();
  });

  await page.addInitScript(function () {
    try {
      var uid = 'guest_cov';
      localStorage.setItem(
        'mt_session',
        JSON.stringify({ uid: uid, email: 'invitado@local', guest: true, cloud: false })
      );
      localStorage.setItem('mt_onboarding_done', '1');
      localStorage.setItem('mt_ob_done', 'true');
      localStorage.setItem('mt_sc_' + uid, JSON.stringify(true));
      localStorage.setItem('mt_s_' + uid, JSON.stringify(2000000));
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.aiAnswer === 'function';
  }, null, { timeout: 20000 });

  var report = await page.evaluate(async function () {
    function mk(monthsAgo, day, hStart, durH) {
      var d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      d.setDate(day);
      var ini = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hStart, 0, 0);
      var fin = new Date(ini.getTime() + durH * 3600000);
      return { id: 'c' + monthsAgo + '-' + day + '-' + hStart, inicio: ini.toISOString(), fin: fin.toISOString() };
    }
    var salario = 2000000;
    var vh = Math.round(salario / 240);
    // turnos multi-mes (histórico/anual) y variados (noche/dom/extra)
    var turnos = [];
    for (var mo = 0; mo < 3; mo++) {
      turnos.push(mk(mo, 3, 14, 8));
      turnos.push(mk(mo, 6, 22, 8));
      turnos.push(mk(mo, 9, 6, 9));
      turnos.push(mk(mo, 12, 14, 8));
    }
    var n = new Date();
    var mes = turnos.filter(function (t) {
      var d = new Date(t.inicio);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
    var st = {
      turnos: mes,
      turnosAll: turnos,
      activo: null,
      calc: window.doCalc(mes, null, new Date(), vh),
      vh: vh,
      salario: salario,
      session: { uid: 'guest_cov', email: 'invitado@local' }
    };

    // [feature, frase en lenguaje natural, [tokens esperados, case-insensitive]]
    var bank = [
      ['Presupuesto 50/30/20', 'cómo reparto mi sueldo', ['50/30/20']],
      ['Fondo de emergencia', 'quiero armar un fondo de emergencia', ['emergencia']],
      ['Capacidad de endeudamiento', 'cuánto puedo pagar de cuota', ['endeudamiento', 'cuota']],
      ['Indemnización (despido)', 'cuánto me dan si me despiden', ['indemnización']],
      ['Liquidación / prestaciones', 'calculá mi liquidación', ['liquidación', 'prestaciones', 'cesantías']],
      ['Plan de ahorro', 'quiero ahorrar 5 millones en un año', ['plan de ahorro', 'ahorro mensual']],
      ['Análisis fiscal', 'tengo que declarar renta este año', ['fiscal', 'renta', 'deduc']],
      ['Optimizador meta extra', 'quiero ganar 200 mil extra este mes', ['optimizador de horarios', 'turnos nocturnos']],
      ['Optimizador predictivo', 'qué turno me conviene tomar', ['rinde más', 'conviene']],
      ['Comparador de ofertas', 'tengo una oferta de 3 millones', ['comparador', 'oferta']],
      ['Verificador de pago', 'me pagaron 70 mil este mes y creo que me pagan mal', ['de menos', 'verificador', 'bien']],
      ['Informe financiero', 'dame un informe financiero completo', ['informe financiero']],
      ['Simulación de turno', 'simular 4 horas nocturnas', ['simul', 'nocturn']],
      ['Tabla de recargos (ley)', 'cuál es la tabla de recargos', ['recargo', 'nocturn']],
      ['Total ganado mes', 'cuánto llevo este mes', ['$', 'llevás', 'llevas', 'ganado']],
      ['Comparar con mes pasado', 'comparar con el mes pasado', ['mes pasado', 'vs', 'comparado']],
      ['Festivos', 'cuántos festivos trabajé este mes', ['festiv']],
      ['Proyección al cierre', 'cuánto voy a ganar este mes', ['proyec', 'cierre', '≈', '$']],
      ['Ayuda / how-to', 'cómo registro un turno', ['turno', 'paso', 'toca', 'botón']],
      ['Saludo / conversación', 'hola', ['hola', 'buen', 'invitado']],
      ['Despedida', 'chao', ['chao', 'cuidate', 'luego', 'pronto']]
    ];

    var out = [];
    for (var i = 0; i < bank.length; i++) {
      if (typeof window.aiResetConv === 'function') window.aiResetConv();
      var r;
      try {
        r = await Promise.resolve(window.aiAnswer(bank[i][1], st));
      } catch (e) {
        r = { text: '__ERROR__ ' + e.message };
      }
      var txt = r && typeof r === 'object' ? r.text || '' : r || '';
      var low = txt.toLowerCase();
      var hit = false;
      for (var k = 0; k < bank[i][2].length; k++) {
        if (low.indexOf(bank[i][2][k].toLowerCase()) >= 0) {
          hit = true;
          break;
        }
      }
      out.push({
        feature: bank[i][0],
        q: bank[i][1],
        hit: hit,
        snippet: (txt.split('\n')[0] || '').slice(0, 80),
        err: txt.indexOf('__ERROR__') >= 0
      });
    }
    return out;
  });

  console.log('\n┌─ COBERTURA RUNTIME DE LA IA (pipeline real en Chromium) ─────────');
  var ok = 0,
    bad = 0;
  report.forEach(function (r) {
    var mark = r.err ? '💥' : r.hit ? '✓' : '✗';
    if (r.err || !r.hit) bad++;
    else ok++;
    console.log('  ' + mark + ' ' + r.feature.padEnd(28) + ' | "' + r.q + '"');
    if (!r.hit || r.err) console.log('       ↳ respondió: ' + (r.snippet || '(vacío)'));
  });
  console.log('└──────────────────────────────────────────────────────────────');
  console.log('  ' + ok + ' features activas · ' + bad + ' no dispararon');
  exitCode = bad > 0 ? 1 : 0;
} catch (err) {
  console.error('\nError en la auditoría de cobertura:', err && err.message ? err.message : err);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

process.exit(exitCode);
