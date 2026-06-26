// ════════════════════════════════════════════════════════════════
//  MI TURNO · tests/ai/ai-golden-runner.js
//  Runner de GOLDEN cases: congela el comportamiento actual de la IA antes
//  del refactor de ruteo. Corre la app real en Chromium (modo invitado,
//  datos sembrados), invoca aiAnswer/aiClassifyIntent y valida cada caso.
//
//    node tests/ai/ai-golden-runner.js
//    npm run test:golden
//
//  Sale con código 1 si hay fallos DUROS (intent, mustContain, mustNotContain,
//  shouldUseRealData). expectedRoute/shouldUseLegacy son SOFT (solo warnings):
//  la traza v1 conoce la ruta declarada del registry, no el guard exacto de la
//  cascada (ver AI_ROUTE_MAP.md §6). Mismo harness que tests/ai-benchmark.mjs.
// ════════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

var __dirname = path.dirname(fileURLToPath(import.meta.url));
var ROOT = path.resolve(__dirname, '..', '..');
var CASES = JSON.parse(fs.readFileSync(path.join(__dirname, 'ai-golden-cases.json'), 'utf8')).cases;

var PORT = 8000;
var BASE = 'http://127.0.0.1:' + PORT + '/app.html';
function readIf(p) {
  try {
    return fs.readFileSync(path.join(ROOT, p), 'utf8');
  } catch (_) {
    return null;
  }
}
var REACT = readIf('node_modules/react/umd/react.production.min.js');
var REACTDOM = readIf('node_modules/react-dom/umd/react-dom.production.min.js');
var CHART = readIf('node_modules/chart.js/dist/chart.umd.js');

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
if (!alreadyUp)
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: ROOT,
    stdio: 'ignore'
  });

var browser,
  exitCode = 0;
try {
  var up = alreadyUp || (await waitForServer(BASE, 30));
  if (!up) throw new Error('servidor no respondió en :' + PORT);
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
    var u = route.request().url();
    var H = { 'content-type': 'application/javascript', 'access-control-allow-origin': '*' };
    if (REACTDOM && u.indexOf('/react-dom/') !== -1) return route.fulfill({ body: REACTDOM, headers: H });
    if (REACT && u.indexOf('/react/') !== -1) return route.fulfill({ body: REACT, headers: H });
    if (CHART && u.indexOf('chart.js') !== -1) return route.fulfill({ body: CHART, headers: H });
    return route.continue();
  });
  await page.addInitScript(function () {
    try {
      var uid = 'g';
      localStorage.setItem(
        'mt_session',
        JSON.stringify({ uid: uid, email: 'i@l', guest: true, cloud: false })
      );
      localStorage.setItem('mt_onboarding_done', '1');
      localStorage.setItem('mt_sc_' + uid, JSON.stringify(true));
      localStorage.setItem('mt_s_' + uid, JSON.stringify(2000000));
      window.MT_AI_DEBUG = true;
    } catch (e) {}
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.aiAnswer === 'function';
  }, null, { timeout: 20000 });

  var results = await page.evaluate(async function (cases) {
    // Mismo seed determinista que el benchmark: mes actual + mes pasado.
    function mk(monthsAgo, day, hStart, durH) {
      var d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      d.setDate(day);
      var ini = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hStart, 0, 0);
      return {
        id: 'g' + monthsAgo + '-' + day + '-' + hStart,
        inicio: ini.toISOString(),
        fin: new Date(ini.getTime() + durH * 3600000).toISOString()
      };
    }
    var vh = Math.round(2000000 / 240);
    var turnos = [];
    for (var mo = 0; mo < 2; mo++) {
      turnos.push(mk(mo, 3, 14, 8));
      turnos.push(mk(mo, 6, 22, 8));
      turnos.push(mk(mo, 9, 6, 9));
      turnos.push(mk(mo, 12, 14, 8));
    }
    // Turno en la 2ª quincena del mes actual: da datos reales a las consultas de
    // quincena (los de arriba caen en la 1ª quincena). Día 20 = pasado y en q2 hoy.
    turnos.push(mk(0, 20, 18, 6));
    var n = new Date();
    var mes = turnos.filter(function (t) {
      var d = new Date(t.inicio);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
    var calc = window.doCalc(mes, null, new Date(), vh);
    var st = {
      turnos: mes,
      turnosAll: turnos,
      activo: null,
      calc: calc,
      vh: vh,
      salario: 2000000,
      session: { uid: 'g', email: 'i@l' }
    };

    function intentOf(q) {
      try {
        var r = window.aiClassifyIntent(q) || {};
        return r.intent || null;
      } catch (_) {
        return null;
      }
    }
    async function answer(q) {
      if (window.aiResetConv) window.aiResetConv();
      var r = await Promise.resolve(window.aiAnswer(q, st));
      var text = r && typeof r === 'object' ? r.text || '' : r || '';
      var trace = typeof window.aiLastTrace === 'function' ? window.aiLastTrace() : null;
      return { text: text, trace: trace };
    }

    var out = [];
    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      var gotIntent = intentOf(c.q);
      var res = await answer(c.q);
      out.push({
        q: c.q,
        gotIntent: gotIntent,
        text: res.text,
        lower: (res.text || '').toLowerCase(),
        route: res.trace ? res.trace.registryRoute : null,
        usedRealData: res.trace ? res.trace.usedRealData : /\$\s?\d/.test(res.text || ''),
        agentPath: res.trace ? res.trace.agentPath : null
      });
    }
    return out;
  }, CASES);

  // ── Integridad del registry: cobertura vs intents reales del NLP ──
  var registryCheck = await page.evaluate(function () {
    try {
      var nlpIds = (window.AI_INTENTS || []).map(function (x) {
        return x.id;
      });
      return window.aiRegistryValidate ? window.aiRegistryValidate(nlpIds) : null;
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  // Regresiones dedicadas (no encajan en un caso golden: el runner resetea cada
  // vez, y el humanizador es aleatorio). Cazan BUG1 (reset deja memoria) y BUG3
  // (humanizador rompe gramática "es un placer armamos").
  var bugChecks = await page.evaluate(async function () {
    var out = { resetHygiene: null, humanizerGrammar: null };
    try {
      var vh = Math.round(2000000 / 240);
      var st = { turnos: [], turnosAll: [], activo: null, calc: window.doCalc([], null, new Date(), vh), vh: vh, salario: 2000000, session: { uid: 'g', email: 'i@l' } };
      async function ans(q) { if (window.aiResetConv) window.aiResetConv(); var r = await Promise.resolve(window.aiAnswer(q, st)); return r && typeof r === 'object' ? r.text || '' : r || ''; }
      // BUG1: tras reset, repetir la misma pregunta NO debe traer "te repito"
      await ans('cuánto llevo este mes');
      var r2 = await ans('cuánto llevo este mes');
      out.resetHygiene = !/te repito|lo mismo que te dije|como te coment|sigue igual que antes/i.test(r2);
      // BUG3: el humanizador nunca debe producir "es un placer armamos"
      var bad = false;
      if (window.aiHumanizar) {
        for (var i = 0; i < 60; i++) {
          if (/es un placer\s+armamos/i.test(window.aiHumanizar('Con gusto armamos tu plan de ahorro.'))) { bad = true; break; }
        }
      }
      out.humanizerGrammar = !bad;
    } catch (e) { out.error = String(e); }
    return out;
  });

  // Artefacto de la corrida (útil para calibrar y depurar).
  try {
    fs.writeFileSync(
      path.join(__dirname, '_last-run.json'),
      JSON.stringify(
        results.map(function (r) {
          return { q: r.q, intent: r.gotIntent, route: r.route, data: r.usedRealData, snip: (r.text || '').slice(0, 90) };
        }),
        null,
        2
      )
    );
  } catch (_) {}

  // ── Validación en Node ──
  var hardFails = [];
  var softWarns = [];
  var pass = 0;
  for (var i = 0; i < CASES.length; i++) {
    var c = CASES[i];
    var r = results[i];
    var caseFails = [];

    // expectedIntent (HARD)
    if (c.expectedIntent != null) {
      var accept = Array.isArray(c.expectedIntent) ? c.expectedIntent : [c.expectedIntent];
      if (accept.indexOf(r.gotIntent) < 0)
        caseFails.push('intent: esperaba [' + accept.join('|') + '] obtuvo ' + r.gotIntent);
    }
    // mustContain (HARD)
    if (c.mustContain && c.mustContain.length) {
      for (var m = 0; m < c.mustContain.length; m++) {
        if (r.lower.indexOf(String(c.mustContain[m]).toLowerCase()) < 0)
          caseFails.push('falta "' + c.mustContain[m] + '"');
      }
    }
    // mustNotContain (HARD)
    if (c.mustNotContain && c.mustNotContain.length) {
      for (var mn = 0; mn < c.mustNotContain.length; mn++) {
        if (r.lower.indexOf(String(c.mustNotContain[mn]).toLowerCase()) >= 0)
          caseFails.push('contiene prohibido "' + c.mustNotContain[mn] + '"');
      }
    }
    // shouldUseRealData (HARD solo cuando true)
    if (c.shouldUseRealData === true && !r.usedRealData)
      caseFails.push('esperaba datos reales ($) y no los hay');

    // expectedRoute (SOFT)
    if (c.expectedRoute && r.route && c.expectedRoute !== r.route)
      softWarns.push(r.q + ' · ruta registry=' + r.route + ' esperada=' + c.expectedRoute);

    if (caseFails.length) hardFails.push({ q: c.q, fails: caseFails, got: r.gotIntent });
    else pass++;
  }

  // Validación del registry (cobertura completa de intents del NLP)
  var registryFail = false;
  console.log('\n═══ REGISTRY · integridad ═══');
  if (!registryCheck) {
    console.log('  ~ no se pudo validar (aiRegistryValidate ausente)');
  } else if (registryCheck.ok) {
    console.log('  ✓ ' + registryCheck.total + ' rutas · cobertura NLP completa, sin ids fantasma');
  } else {
    registryFail = true;
    if (registryCheck.missingFromRegistry && registryCheck.missingFromRegistry.length)
      console.log('  ✗ intents del NLP sin entrada: ' + registryCheck.missingFromRegistry.join(', '));
    if (registryCheck.phantomNlp && registryCheck.phantomNlp.length)
      console.log('  ✗ ids marcados nlp que el NLP no emite: ' + registryCheck.phantomNlp.join(', '));
    if (registryCheck.error) console.log('  ✗ ' + registryCheck.error);
  }

  // Regresiones dedicadas (BUG1 reset, BUG3 humanizador)
  var bugFail = false;
  console.log('\n═══ REGRESIONES · bugs ═══');
  if (bugChecks.resetHygiene === false) { bugFail = true; console.log('  ✗ BUG1: aiResetConv NO limpia anti-repetición (repite tras reset)'); }
  else console.log('  ✓ BUG1: reset limpia la memoria anti-repetición');
  if (bugChecks.humanizerGrammar === false) { bugFail = true; console.log('  ✗ BUG3: humanizador produce "es un placer armamos" (gramática rota)'); }
  else console.log('  ✓ BUG3: humanizador no rompe la gramática de "con gusto"');

  console.log('\n═══ GOLDEN · ' + CASES.length + ' casos ═══');
  console.log('  ✓ ' + pass + ' OK · ✗ ' + hardFails.length + ' fallos duros');
  if (hardFails.length) {
    console.log('\n── Fallos duros ──');
    hardFails.forEach(function (f) {
      console.log('  ✗ "' + f.q + '"');
      f.fails.forEach(function (x) {
        console.log('      · ' + x);
      });
    });
  }
  if (softWarns.length) {
    console.log('\n── Avisos de ruta (informativo, no falla) ──');
    softWarns.slice(0, 30).forEach(function (w) {
      console.log('  ~ ' + w);
    });
    if (softWarns.length > 30) console.log('  … (' + (softWarns.length - 30) + ' más)');
  }
  console.log('');
  exitCode = hardFails.length || registryFail || bugFail ? 1 : 0;
} catch (e) {
  console.error('Error en golden runner:', e && e.message ? e.message : e);
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}
process.exit(exitCode);
