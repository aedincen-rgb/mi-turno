// ════════════════════════════════════════════════════════════════
//  tests/smoke.js — pruebas de humo de funciones puras del core.
//
//  Carga los archivos de la app en orden dentro de un vm.Context
//  con stubs mínimos (window, document, localStorage), y verifica
//  invariantes que NO deberían romperse jamás:
//
//    · helpers de formato (fCOP, fDur)
//    · saludo por hora (_saludoHora)
//    · cálculo de Pascua (getEaster) — usado por festivos
//    · festivos colombianos (esFest)
//    · validación de sesiones (validarSesion, validarTurnos)
//    · clave por usuario (dk)
//    · normalización de prefs
//
//  Sin browser. Sin Supabase. Solo node.
//  Uso: node tests/smoke.js   (exit 0 = OK, exit 1 = falla)
// ════════════════════════════════════════════════════════════════

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');

// Orden de carga (mismo orden que index.html para las primeras 3 capas).
// Solo archivos que no tocan DOM/React.
var FILES = [
  'js/config/globals.js',
  'js/utils/storage.js',
  'js/utils/format.js',
  'js/utils/uuid.js',
  'js/utils/time.js',
  'js/utils/festivos.js',
  'js/utils/validation.js',
  'js/utils/password-hash.js',
  'js/services/quincena.js',
  // Desde v48, _saludoHora vive en su propio archivo (junto con
  // _aiNombrePersonal y _aiHeroPhrases). ai-greeting.js no toca
  // DOM ni React, es seguro cargarlo entero en node.
  'js/services/ai-history.js',
  'js/services/ai-greeting.js'
];

// ── Stubs del entorno ────────────────────────────────────────────
var _storage = {};
var localStorageStub = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(_storage, k) ? _storage[k] : null; },
  setItem: function (k, v) { _storage[k] = String(v); },
  removeItem: function (k) { delete _storage[k]; },
  clear: function () { _storage = {}; },
  key: function (i) { return Object.keys(_storage)[i] || null; },
  get length() { return Object.keys(_storage).length; }
};

var sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  Promise: Promise,
  Error: Error,
  RegExp: RegExp,
  Intl: Intl,
  isNaN: isNaN,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Uint8Array: Uint8Array,
  Uint32Array: Uint32Array,
  TextEncoder: TextEncoder,
  TextDecoder: TextDecoder,
  atob: atob,
  btoa: btoa,
  crypto: globalThis.crypto, // Web Crypto API (node 19+)
  localStorage: localStorageStub
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.document = { getElementById: function () { return null; } };
sandbox.navigator = { userAgent: 'node-test', onLine: true };
vm.createContext(sandbox);

function loadFile(rel) {
  var p = path.join(ROOT, rel);
  vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: rel });
}

for (var i = 0; i < FILES.length; i++) {
  try {
    loadFile(FILES[i]);
  } catch (e) {
    console.error('✗ Error cargando ' + FILES[i] + ':', e.message);
    process.exit(1);
  }
}

// ── Mini framework de aserciones ─────────────────────────────────
var PASS = 0;
var FAIL = 0;
function eq(actual, expected, label) {
  var ok = actual === expected ||
    (typeof actual === 'object' && JSON.stringify(actual) === JSON.stringify(expected));
  if (ok) {
    PASS++;
  } else {
    FAIL++;
    console.error('  ✗ ' + label);
    console.error('      esperado: ' + JSON.stringify(expected));
    console.error('      obtenido: ' + JSON.stringify(actual));
  }
}
function truthy(actual, label) {
  if (actual) PASS++;
  else { FAIL++; console.error('  ✗ ' + label + ' (truthy esperado)'); }
}
function group(name) { console.log('\n→ ' + name); }

// ── TESTS ────────────────────────────────────────────────────────
var w = sandbox;

group('dk(uid, key) — layout REAL es mt_<key>_<uid>');
eq(w.dk('abc', 't'), 'mt_t_abc', 'dk básico');
eq(w.dk('uid-123', 'sc'), 'mt_sc_uid-123', 'dk con guión');

group('format');
truthy(w.fCOP(1750905).indexOf('1.750.905') >= 0 || w.fCOP(1750905).indexOf('1750905') >= 0,
       'fCOP retorna algo plausible');
eq(w.fDur(0), '0h 00m', 'fDur 0');
eq(w.fDur(65), '1h 05m', 'fDur 65');
eq(w.fDur(180), '3h 00m', 'fDur 180');
eq(w.fDur(-10), '0h 00m', 'fDur negativo clampea a 0');

group('_saludoHora (mismo helper en AI y Historial)');
eq(w._saludoHora(new Date(2026, 0, 1, 3)),  'Buenos días',  'madrugada → buenos días');
eq(w._saludoHora(new Date(2026, 0, 1, 9)),  'Buenos días',  'mañana');
eq(w._saludoHora(new Date(2026, 0, 1, 13)), 'Buenas tardes','tarde');
eq(w._saludoHora(new Date(2026, 0, 1, 20)), 'Buenas noches','noche');

group('getEaster');
var pascua26 = w.getEaster(2026);
eq(pascua26.getDay(), 0, 'Pascua siempre cae en domingo');
truthy(pascua26.getMonth() === 2 || pascua26.getMonth() === 3, 'Pascua en marzo o abril');

group('esFest (festivos Colombia)');
truthy(w.esFest(new Date(2026, 0, 1)),  '1 de enero es festivo');
truthy(w.esFest(new Date(2026, 6, 20)), '20 de julio (Independencia) es festivo');
truthy(w.esFest(new Date(2026, 11, 25)),'25 de diciembre es festivo');
truthy(!w.esFest(new Date(2026, 0, 2)), '2 de enero NO es festivo');
truthy(w.esFest(new Date(2026, 0, 4)),  'Domingo siempre cuenta como festivo'); // 4-ene-2026 es domingo

group('validarSesion');
eq(w.validarSesion(null), null, 'null → null');
eq(w.validarSesion('texto'), null, 'string → null');
eq(w.validarSesion({}), null, 'objeto sin uid → null');
truthy(w.validarSesion({ uid: 'x', email: 'a@b.c' }), 'objeto válido pasa');

group('validarTurnos');
eq(w.validarTurnos(null, 'u'), [], 'null → []');
eq(w.validarTurnos('texto', 'u'), [], 'string → []');
var turnoOk = { id: '1', inicio: '2026-05-01T08:00:00Z', fin: '2026-05-01T16:00:00Z', userId: 'u' };
eq(w.validarTurnos([turnoOk], 'u').length, 1, 'turno bien formado pasa');
eq(w.validarTurnos([turnoOk], 'otro').length, 0, 'turno de otro uid se filtra');
var turnoSinFin = { id: '2', inicio: '2026-05-01T08:00:00Z', userId: 'u' };
eq(w.validarTurnos([turnoSinFin], 'u').length, 0, 'turno sin fin se filtra');

group('validarTurnoActivo');
eq(w.validarTurnoActivo(null, 'u'), null, 'null → null');
truthy(w.validarTurnoActivo({ inicio: '2026-05-01T08:00:00Z', userId: 'u' }, 'u'),
       'activo válido pasa');
eq(w.validarTurnoActivo({ inicio: 'NO_ES_FECHA', userId: 'u' }, 'u'), null, 'fecha inválida → null');

group('normalizePrefs');
var pBase = w.normalizePrefs(null);
truthy(pBase && typeof pBase === 'object', 'null devuelve objeto');
truthy(typeof pBase.quincenaMode === 'boolean', 'tiene quincenaMode booleano');

// ── hashPassword / verifyPassword (PBKDF2 + salt, v49) ──────────
group('password-hash (PBKDF2 con salt)');
(async function () {
  try {
    var blob = await w.hashPassword('miPassword123');
    var parsed = JSON.parse(blob);
    truthy(parsed.v === 1, 'schema v1');
    truthy(parsed.s && parsed.h, 'tiene salt + hash');
    truthy(parsed.s !== parsed.h, 'salt y hash distintos');

    var ok1 = await w.verifyPassword('miPassword123', blob);
    truthy(ok1.ok && !ok1.legacy, 'password correcta verifica OK (no legacy)');

    var ok2 = await w.verifyPassword('otraPass', blob);
    truthy(!ok2.ok, 'password incorrecta no verifica');

    // Verificación legacy (formato plaintext pre-v49)
    var ok3 = await w.verifyPassword('viejaPlain', 'viejaPlain');
    truthy(ok3.ok && ok3.legacy, 'legacy plaintext matchea con flag legacy=true');

    var ok4 = await w.verifyPassword('viejaPlain', 'otraPlain');
    truthy(!ok4.ok, 'legacy plaintext NO matchea contra otro valor');

    // Salt random: dos hashes del mismo password DEBEN diferir
    var blob2 = await w.hashPassword('miPassword123');
    truthy(blob !== blob2, 'dos hashes del mismo password difieren (salt random)');
  } catch (e) {
    FAIL++;
    console.error('  ✗ password-hash threw:', e.message);
  }

  // ── Resumen ─────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('  ' + PASS + ' OK · ' + FAIL + ' fallos');
  console.log('═══════════════════════════════════════');
  process.exit(FAIL > 0 ? 1 : 0);
})();
