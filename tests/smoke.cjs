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
  'js/services/quincena.js',
  // _saludoHora vive arriba en assistant.js (antes de cualquier h(...));
  // cargamos solo la cabecera para no traer todo el archivo.
  '__inline:_saludoHora',
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
  Uint32Array: Uint32Array,
  localStorage: localStorageStub
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.document = { getElementById: function () { return null; } };
sandbox.navigator = { userAgent: 'node-test', onLine: true };
vm.createContext(sandbox);

function loadFile(rel) {
  if (rel === '__inline:_saludoHora') {
    // Extraemos solo el helper que necesitamos sin cargar todo assistant.js
    // (que arrastraría React y otras dependencias).
    var src = fs.readFileSync(path.join(ROOT, 'js/tabs/assistant.js'), 'utf8');
    var m = src.match(/function _saludoHora\([\s\S]*?\n\}/);
    if (!m) throw new Error('_saludoHora no encontrado en assistant.js');
    vm.runInContext(m[0], sandbox, { filename: 'js/tabs/assistant.js#_saludoHora' });
    return;
  }
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

// ── Resumen ──────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  ' + PASS + ' OK · ' + FAIL + ' fallos');
console.log('═══════════════════════════════════════');
process.exit(FAIL > 0 ? 1 : 0);
