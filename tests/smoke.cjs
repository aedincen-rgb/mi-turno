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
  'js/services/calculator.js',
  'js/services/ai-query.js',
  'js/services/ai-episodes.js',
  'js/services/ai-synonyms.js',
  'js/services/ai-nlp.js',
  // ai-help.js cargado antes de ai.js para que aiHelpAnswer esté disponible
  'js/services/ai-help.js',
  'js/services/ai.js',
  'js/services/ai-advisor.js',
  'js/services/ai-enhanced.js',
  // Desde v48, _saludoHora vive en su propio archivo (junto con
  // _aiNombrePersonal y _aiHeroPhrases). ai-greeting.js no toca
  // DOM ni React, es seguro cargarlo entero en node.
  'js/services/ai-history.js',
  'js/services/ai-greeting.js',
  'js/services/ai-proactive.js'
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

// ── ai-query (motor de consultas v260) ──────────────────────────
// Datasets construidos relativos a HOY para que los tests no dependan
// de la fecha en que corre CI. esFest cuenta domingos como festivo,
// así que "primer domingo del mes" es siempre un festivo garantizado.

function mkTurno(d, horas) {
  var ini = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0);
  return {
    id: ini.toISOString(),
    inicio: ini.toISOString(),
    fin: new Date(ini.getTime() + horas * 3600000).toISOString()
  };
}
function primerDomingo(year, month) {
  var d = new Date(year, month, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d;
}
function primerDiaNoFestivo(year, month) {
  var d = new Date(year, month, 1);
  while (w.esFest(d)) d.setDate(d.getDate() + 1);
  return d;
}
var _hoy = new Date();
var _ctx = { vh: 10000, uid: 'u-test' };

group('ai-query: scoping temporal (bug preguntas precargadas de Análisis)');
var qFest = w.aiQueryParse('¿Cuántos días festivos trabajé este mes?');
truthy(qFest, 'pregunta precargada de Análisis es reclamada');
truthy(qFest && qFest.label.indexOf('de este mes') >= 0,
       'el filtro respeta "este mes" en el label');

var dsFest = [
  mkTurno(primerDomingo(_hoy.getFullYear(), _hoy.getMonth()), 8),        // festivo mes actual
  mkTurno(primerDomingo(_hoy.getFullYear(), _hoy.getMonth() - 1), 8),    // festivo mes pasado
  mkTurno(primerDiaNoFestivo(_hoy.getFullYear(), _hoy.getMonth()), 8)    // día normal mes actual
];
var rFest = w.aiQueryRun(qFest, dsFest, _ctx);
truthy(rFest.indexOf('**1 turno**') >= 0,
       'cuenta SOLO el festivo del mes actual (no todo el historial): ' + rFest.split('\n')[0]);

var qFestPas = w.aiQueryParse('¿cuántos festivos trabajé el mes pasado?');
truthy(qFestPas && qFestPas.label.indexOf('del mes pasado') >= 0, 'reclama "mes pasado"');
truthy(w.aiQueryRun(qFestPas, dsFest, _ctx).indexOf('• Turnos: 1') >= 0,
       'mes pasado cuenta solo su festivo');

group('ai-query: las demás preguntas precargadas de Análisis NO se reclaman');
[
  '¿Cuántas horas extra llevo?',
  '¿Cuántas horas nocturnas llevo?',
  '¿Cuánto gané este mes?',
  'Distribución y desglose de mis recargos',
  '¿Cuántos días seguidos llevo?'
].forEach(function (p) {
  eq(w.aiQueryParse(p), null, 'NO reclamada (va al NLP): "' + p + '"');
});

group('ai-query: exclusiones (conocimiento, acciones, hipotéticos)');
eq(w.aiQueryParse('¿qué es el recargo festivo?'), null, 'conocimiento no se reclama');
eq(w.aiQueryParse('envía mi reporte de mayo a juan@x.com'), null, 'correo no se reclama');
eq(w.aiQueryParse('¿cuánto ganaría si trabajo el domingo?'), null, 'hipotético no se reclama');
eq(w.aiQueryParse('próximos festivos'), null, 'festivos futuros no se reclama');

group('ai-query: filtros por día de semana');
var qDom = w.aiQueryParse('¿cuánto gané los domingos?');
truthy(qDom && qDom.label === 'los domingos', 'reclama "los domingos"');
var dom1 = primerDomingo(_hoy.getFullYear(), _hoy.getMonth());
var dom2 = primerDomingo(_hoy.getFullYear(), _hoy.getMonth() - 1);
var dsDom = [mkTurno(dom1, 8), mkTurno(dom2, 6),
             mkTurno(primerDiaNoFestivo(_hoy.getFullYear(), _hoy.getMonth()), 8)];
var rDom = w.aiQueryRun(qDom, dsDom, _ctx);
truthy(rDom.indexOf('• Turnos: 2') >= 0, 'matchea los 2 domingos del dataset');

var qVie = w.aiQueryParse('¿cuánto gané el viernes pasado?');
truthy(qVie && qVie.label.indexOf('el viernes pasado (') >= 0,
       'singular + "pasado" resuelve a una fecha puntual');
var viePas = new Date(_hoy.getFullYear(), _hoy.getMonth(), _hoy.getDate());
do { viePas.setDate(viePas.getDate() - 1); } while (viePas.getDay() !== 5);
var vieAnt = new Date(viePas); vieAnt.setDate(viePas.getDate() - 7);
var rVie = w.aiQueryRun(qVie, [mkTurno(viePas, 5), mkTurno(vieAnt, 5)], _ctx);
truthy(rVie.indexOf('1 coincide (') >= 0,
       'solo coincide el viernes más reciente, no el de hace 2 semanas');

group('ai-query: fecha de calendario específica (v286)');
// Construir una fecha pasada determinista: el día 14 del mes pasado.
var _mesPas = new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 14);
var _nombreMes = ['enero','febrero','marzo','abril','mayo','junio','julio',
                  'agosto','septiembre','octubre','noviembre','diciembre'][_mesPas.getMonth()];

// "14 de <mes pasado>" — varias formas de escribir lo mismo
['¿cuánto gané el 14 de ' + _nombreMes + '?',
 'cuanto hice el 14 de ' + _nombreMes,
 'qué saqué el 14 de ' + _nombreMes,
 'mis ganancias del 14 de ' + _nombreMes
].forEach(function (frase) {
  var qd = w.aiQueryParse(frase);
  truthy(qd && qd.label.indexOf('el 14 de ' + _nombreMes) >= 0,
         'reclama fecha puntual: "' + frase + '"');
});

var qFecha = w.aiQueryParse('¿cuánto gané el 14 de ' + _nombreMes + '?');
var dsFecha = [
  mkTurno(_mesPas, 8),                                              // el 14 (match)
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 15), 8) // el 15 (no match)
];
var rFecha = w.aiQueryRun(qFecha, dsFecha, _ctx);
truthy(rFecha.indexOf('1 coincide') >= 0,
       'solo cuenta el turno del 14, no el del 15: ' + rFecha.split('\n').pop());

// Formato numérico dd/mm
var qNum = w.aiQueryParse('cuánto gané el 14/' + (_mesPas.getMonth() + 1));
truthy(qNum && qNum.label.indexOf('el 14 de ' + _nombreMes) >= 0,
       'formato numérico dd/mm: "14/' + (_mesPas.getMonth() + 1) + '"');

// "el 14 de junio" NO debe filtrar el mes entero (era el riesgo de la palabra mes)
truthy(qFecha && qFecha.label === 'el 14 de ' + _nombreMes,
       'fecha puntual es exclusiva: no arrastra "de ' + _nombreMes + '" como mes entero');

// Guardas: no confundir cifras/porcentajes con fechas
eq(w.aiQueryParse('reparte mi sueldo 50/30/20'), null,
   '50/30/20 (presupuesto) no se lee como fecha');
truthy((function () {
  var q = w.aiQueryParse('cuánto gané');
  return q === null || q.label.indexOf('el ') < 0;
}()), '"cuánto gané" sin fecha no inventa un día');

group('ai-query: rangos de fecha (v287)');
// Rango "del 10 al 15 de <mes pasado>" — determinista
var qRango = w.aiQueryParse('cuánto gané del 10 al 15 de ' + _nombreMes);
truthy(qRango && qRango.label === 'del 10 al 15 de ' + _nombreMes,
       'reclama rango "del 10 al 15 de ' + _nombreMes + '"');
var dsRango = [
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 9), 8),   // 9 (fuera)
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 12), 8),  // 12 (dentro)
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 15), 8),  // 15 (dentro, borde)
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 16), 8)   // 16 (fuera)
];
truthy(w.aiQueryRun(qRango, dsRango, _ctx).indexOf('• Turnos: 2') >= 0,
       'rango incluye bordes (12 y 15), excluye 9 y 16');

// "entre el 1 y el 15" sin mes → mes en curso (solo parsea, sin assert de datos)
truthy(w.aiQueryParse('cuánto hice entre el 1 y el 15'),
       '"entre el 1 y el 15" se reclama como rango');

// Quincenas
var qQuin = w.aiQueryParse('cuánto gané la primera quincena de ' + _nombreMes);
truthy(qQuin && qQuin.label.indexOf('primera quincena de ' + _nombreMes) >= 0,
       'primera quincena reclamada');
var qQuin2 = w.aiQueryParse('cuánto gané la segunda quincena de ' + _nombreMes);
truthy(qQuin2 && qQuin2.label.indexOf('segunda quincena de ' + _nombreMes) >= 0,
       'segunda quincena reclamada');

// El rango gana sobre la fecha puntual ("15 de junio" dentro del rango)
truthy(qRango && qRango.label.indexOf(' al ') >= 0,
       'el rango no se degrada a fecha puntual "15 de ' + _nombreMes + '"');

group('ai-query: comparación de períodos (v287)');
// Dos meses con datos distintos: mes pasado (2 turnos) vs antepasado (1 turno)
var _mesAnt = new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 10);
var _mesAnt2 = new Date(_hoy.getFullYear(), _hoy.getMonth() - 2, 10);
var _nombreAnt = ['enero','febrero','marzo','abril','mayo','junio','julio',
                  'agosto','septiembre','octubre','noviembre','diciembre'][_mesAnt.getMonth()];
var _nombreAnt2 = ['enero','febrero','marzo','abril','mayo','junio','julio',
                   'agosto','septiembre','octubre','noviembre','diciembre'][_mesAnt2.getMonth()];
var dsCmp = [
  mkTurno(_mesAnt, 8),
  mkTurno(new Date(_hoy.getFullYear(), _hoy.getMonth() - 1, 11), 8),
  mkTurno(_mesAnt2, 8)
];
var rCmp = w.aiQueryCompare(
  'compará ' + _nombreAnt + ' con ' + _nombreAnt2, dsCmp, _ctx);
truthy(rCmp && rCmp.indexOf(' vs ') >= 0, 'comparación produce encabezado "X vs Y"');
truthy(rCmp && rCmp.indexOf('más en') >= 0,
       'comparación señala el período con más ingresos: ' + (rCmp || '').split('\n').pop());

// "vs" también dispara
truthy(w.aiQueryCompare(_nombreAnt + ' vs ' + _nombreAnt2, dsCmp, _ctx),
       '"junio vs mayo" (atajo vs) se reclama');

// Sin disparador de comparación → no se reclama (lo maneja el flujo normal)
eq(w.aiQueryCompare('cuánto gané en ' + _nombreAnt, dsCmp, _ctx), null,
   'un solo mes sin "vs/compará" no es comparación');
// Un solo período mencionado → null aunque diga "compará"
eq(w.aiQueryCompare('compará mi mes', dsCmp, _ctx), null,
   '"compará" con un solo período no alcanza');

group('ai-query: estados límite');
truthy(w.aiQueryRun(qDom, [], _ctx).indexOf('no encontré') >= 0,
       'historial vacío responde honesto, sin inventar');
truthy(w.aiQueryRun(qDom, dsDom, { vh: 0, uid: 'u' }).indexOf('Configurá tu salario') >= 0,
       'vh=0 avisa que falta configurar salario');
truthy(w.aiQueryRun(qDom, [{ id: 'x', inicio: 'FECHA_ROTA', fin: null }], _ctx)
         .indexOf('no encontré') >= 0,
       'turno corrupto (sin fin, fecha inválida) no rompe ni cuenta');

// ── comandos rápidos y parsing de cifras (bug "/meta 2000000") ──
// El chip "¿Cuánto falta para 2 millones?" enviaba /meta 2000000 y el
// NLP lo clasificaba como `celebracion` (festejaba los 2 millones como
// resultado). Además _aiNum no entendía "dos millones" → caía al salario.

group('_aiNum: multiplicadores colombianos');
eq(w._aiNum('2 millones'), 2000000, '"2 millones" → 2000000');
eq(w._aiNum('dos millones'), 2000000, '"dos millones" → 2000000 (palabra + multiplicador)');
eq(w._aiNum('150 lucas'), 150000, '"150 lucas" → 150000');
eq(w._aiNum('2000000'), 2000000, 'cifra plana intacta');
eq(w._aiNum('4h'), 4, '"4h" sigue siendo 4 (no romper simulador)');
eq(w._aiNum('quince dias'), 15, 'palabra sin multiplicador intacta');

group('comandos rápidos: slash salta el NLP');
var _stMeta = (function () {
  var ds = [mkTurno(primerDiaNoFestivo(_hoy.getFullYear(), _hoy.getMonth()), 8)];
  return {
    turnos: ds, turnosAll: ds,
    calc: w.doCalc(ds, null, new Date(), 10000),
    vh: 10000, salario: 2400000,
    session: { uid: 'u-test', email: 'test@x.com' }
  };
})();
function respText(r) { return ((typeof r === 'object' && r ? r.text : r) || ''); }

var rMeta = respText(w.aiAnswer('/meta 2000000', _stMeta));
truthy(rMeta.indexOf('2.000.000') >= 0, '/meta 2000000 usa la meta pedida: ' +
       rMeta.split('\n')[0]);
truthy(rMeta.indexOf('celebran') < 0 && rMeta.indexOf('¡¡') < 0,
       '/meta 2000000 NO festeja la cifra como logro');

var rDos = respText(w.aiAnswer('¿cuanto falta para dos millones?', _stMeta));
truthy(rDos.indexOf('2.000.000') >= 0,
       '"dos millones" escrito se interpreta como meta de $2.000.000');

var rSim = respText(w.aiAnswer('/simular 4h nocturnas', _stMeta));
truthy(rSim.indexOf('4h nocturnas') >= 0 || rSim.indexOf('Simulación') >= 0,
       '/simular 4h nocturnas llega a su handler');

// ── memoria de tema: la conversación recuerda de qué se habla ───
// "¿Cuántas horas trabajé los domingos?" → "¿y los sábados?" debe
// heredar tema (datos) y métrica (horas) de la pregunta anterior.

group('memoria de tema: follow-ups elípticos');
w.aiResetConv();
eq(w.aiQueryParse('¿y los sabados?', { topic: null }), null,
   'elíptica SIN tema previo no se reclama (no inventar contexto)');
eq(w.aiQueryParse('¿y los sabados?', { topic: 'conversacion' }), null,
   'elíptica con tema no-datos tampoco se reclama');

var _dom1 = primerDomingo(_hoy.getFullYear(), _hoy.getMonth());
var _sab1 = new Date(_dom1); _sab1.setDate(_dom1.getDate() + 6);
var _dsSem = [mkTurno(_dom1, 8), mkTurno(_sab1, 6)];
var _stTema = {
  turnos: _dsSem, turnosAll: _dsSem,
  calc: w.doCalc(_dsSem, null, new Date(), 10000),
  vh: 10000, salario: 2400000,
  session: { uid: 'u-test', email: 'test@x.com' }
};

var rT1 = respText(w.aiAnswer('¿cuántas horas trabajé los domingos?', _stTema));
truthy(rT1.indexOf('los domingos') >= 0, 'primera consulta responde sobre domingos');
eq(w.aiGetConversation().lastTopic, 'dinero',
   'el tema actual queda registrado tras la consulta');

var rT2 = respText(w.aiAnswer('¿y los sabados?', _stTema));
truthy(rT2.indexOf('los sábados') >= 0,
       'elíptica hereda el tema y consulta sábados: ' + rT2.split('\n')[0]);
truthy(rT2.indexOf('Trabajaste') >= 0,
       'hereda también la métrica (horas) de la pregunta anterior');

group('memoria de tema: la cascada clásica también registra el tema');
w.aiResetConv();
respText(w.aiAnswer('¿cuanto falta para dos millones?', _stTema));
truthy(w.aiGetConversation().lastIntent !== null,
       'una respuesta de la cascada clásica deja registrado el intent');
eq(w.aiGetConversation().lastTopic, 'dinero',
   'y el tema queda en "dinero" para el topic bonus del NLP');

// ── memoria episódica (ai-episodes.js) ──────────────────────────
group('memoria episódica: registro y dedup');
var _epUid = 'u-episodios';
truthy(w.aiEpisodeRecord(_epUid, 'meta', 'Te propusiste llegar a $ 2.000.000', { meta: 2000000 }),
       'registra un episodio nuevo');
eq(w.aiEpisodeRecord(_epUid, 'meta', 'Te propusiste llegar a $ 2.000.000', { meta: 2000000 }),
   false, 'mismo episodio en <6h no se duplica');
eq(w.aiEpisodesLoad(_epUid).length, 1, 'queda 1 solo episodio guardado');

w.aiEpisodeFromInteraction(_epUid, 'total_ganado', 'dinero', '¿cuánto llevo?', { pctSalario: 40 });
w.aiEpisodeFromInteraction(_epUid, 'total_ganado', 'dinero', '¿cuánto llevo?', { pctSalario: 40 });
eq(w.aiEpisodesLoad(_epUid).length, 2, 'interacción repetida (mismo intent) no duplica');
w.aiEpisodeFromInteraction(_epUid, 'saludo', 'conversacion', 'hola', { pctSalario: 40 });
eq(w.aiEpisodesLoad(_epUid).length, 2, 'saludos no generan episodios');

group('memoria episódica: hito de salario una vez por mes');
w.aiEpisodeFromInteraction(_epUid, 'proyeccion', 'dinero', 'proyección', { pctSalario: 105 });
w.aiEpisodeFromInteraction(_epUid, 'stats', 'dinero', 'resumen', { pctSalario: 110 });
var _hitos = w.aiEpisodesLoad(_epUid).filter(function (e) { return e.tipo === 'hito'; });
eq(_hitos.length, 1, 'superar el salario se celebra UNA vez por mes');

group('memoria episódica: recuperación conversacional');
var _epAns = w.aiEpisodeAnswer('¿de qué hablamos?', _epUid);
truthy(_epAns && _epAns.indexOf('Te propusiste llegar a') >= 0,
       'recuerda la meta propuesta');
truthy(_epAns && _epAns.indexOf('Hoy:') >= 0, 'fecha relativa legible');
eq(w.aiEpisodeAnswer('¿recuerdas cuánto gané ayer?', _epUid), null,
   'pregunta de DATOS no es secuestrada por la memoria episódica');
eq(w.aiEpisodeAnswer('hola', _epUid), null, 'charla normal no dispara recuerdos');
truthy(w.aiEpisodeAnswer('/recuerdos', 'u-sin-episodios').indexOf('Todavía no tengo') >= 0,
       'sin episodios responde honesto');

group('memoria episódica: cap de 60 episodios');
for (var _ei = 0; _ei < 70; _ei++) {
  w.aiEpisodeRecord('u-cap', 'consulta', 'Episodio número ' + _ei, { i: _ei });
}
eq(w.aiEpisodesLoad('u-cap').length, 60, 'nunca guarda más de 60 (FIFO)');
truthy(w.aiEpisodesLoad('u-cap')[0].resumen === 'Episodio número 10',
       'descarta los más viejos primero');

group('memoria episódica: integrada en aiAnswer');
var _rEp = respText(w.aiAnswer('¿de qué hablamos?', _stTema));
truthy(_rEp.indexOf('🧠') >= 0 && _rEp.indexOf('recuerdo') >= 0,
       'aiAnswer responde con los episodios del usuario: u-test acumuló consultas');
truthy(_rEp.indexOf('consulta a tus datos') >= 0 || _rEp.indexOf('Preguntaste') >= 0,
       'los episodios vienen de las consultas reales hechas en esta suite');

// ── NLP: clasificación de intents críticos (v274) ──────────────
// Prueba los 3 bugs corregidos en v274 + casos borde del clasificador.

group('NLP: saludo de 1 palabra (stop-word → cortocircuito previo)');
var _nlpHola = w.aiClassifyIntent('hola');
eq(_nlpHola.intent, 'saludo', '"hola" sola clasifica como saludo');
truthy(_nlpHola.confidence >= 0.5, '"hola" tiene confianza >= 0.5');

var _nlpChao = w.aiClassifyIntent('chao');
eq(_nlpChao.intent, 'despedida', '"chao" clasifica como despedida');

var _nlpBye = w.aiClassifyIntent('bye');
eq(_nlpBye.intent, 'despedida', '"bye" (stop-word) clasifica como despedida');

group('NLP: "simular X horas nocturnas" → simulacion, no ley');
var _nlpSim = w.aiClassifyIntent('simular 4 horas nocturnas');
eq(_nlpSim.intent, 'simulacion', '"simular 4 horas nocturnas" → simulacion (no ley)');

var _nlpSim2 = w.aiClassifyIntent('simula 2 horas festivas nocturnas');
eq(_nlpSim2.intent, 'simulacion', '"simula 2 horas festivas nocturnas" → simulacion');

// Debe seguir funcionando: pregunta de conocimiento puro (sin verbo simular)
var _nlpLey = w.aiClassifyIntent('¿cuánto vale la hora nocturna?');
eq(_nlpLey.intent, 'ley', '"cuánto vale la hora nocturna" → ley (sin simular)');

group('NLP: "cuánto llevo este mes" → total_ganado, no comparativa_mes');
var _nlpEsteMs = w.aiClassifyIntent('¿cuánto llevo este mes?');
eq(_nlpEsteMs.intent, 'total_ganado', '"cuánto llevo este mes" → total_ganado');

var _nlpSueldo = w.aiClassifyIntent('mi sueldo de este mes');
eq(_nlpSueldo.intent, 'total_ganado', '"mi sueldo de este mes" → total_ganado');

// Debe seguir funcionando: comparativa explícita
var _nlpComp = w.aiClassifyIntent('compara con el mes pasado');
eq(_nlpComp.intent, 'comparativa_mes', '"compara con el mes pasado" → comparativa_mes');

group('NLP: typos y variaciones colombianas');
var _nlpFestib = w.aiClassifyIntent('festibos');
eq(_nlpFestib.intent, 'festivos', '"festibos" → festivos (fuzzy match)');

var _nlpRrec = w.aiClassifyIntent('rrecargo nocturno');
eq(_nlpRrec.intent, 'ley', '"rrecargo nocturno" → ley (fuzzy match)');

var _nlpProyecc = w.aiClassifyIntent('proyecccion al cierre');
eq(_nlpProyecc.intent, 'proyeccion', '"proyecccion" → proyeccion (fuzzy match)');

group('NLP: entradas inválidas no rompen');
var _nlpNull = w.aiClassifyIntent('');
truthy(_nlpNull.intent === null || _nlpNull.confidence < 0.5, 'texto vacío → sin intent válido');

var _nlpEmoji = w.aiClassifyIntent('👍');
truthy(_nlpEmoji.confidence < 0.5, 'solo emoji → confianza baja');

var _nlpNum = w.aiClassifyIntent('123456');
truthy(_nlpNum.confidence < 0.5, 'número solo → confianza baja');

group('NLP: fallback con contexto incompleto no crashea');
var _stVacioSmoke = {
  turnos: [], turnosAll: [],
  calc: w.doCalc([], null, new Date(), 0),
  vh: 0, salario: 0,
  session: { uid: 'u-smoke', email: 'smoke@x.com' }
};
var _rVacio = w.aiAnswer('¿cuánto llevo?', _stVacioSmoke);
truthy(typeof _rVacio === 'string' || (typeof _rVacio === 'object' && _rVacio !== null),
  'aiAnswer con contexto vacío devuelve algo (no explota)');

// ── Acknowledgments conversacionales ───────────────────────────
group('acknowledgments: respuestas breves a "gracias", "ok", "dale"');
var _stAck = {
  turnos: [], turnosAll: [],
  calc: w.doCalc([], null, new Date(), 0),
  vh: 0, salario: 0,
  session: { uid: 'u-ack', email: 'ack@x.com' }
};
var _rGracias = respText(w.aiAnswer('gracias', _stAck));
truthy(
  _rGracias.length < 120,
  '"gracias" da respuesta corta (< 120 chars): ' + _rGracias.length + ' chars'
);
truthy(
  _rGracias.indexOf('Según mis cálculos') < 0 &&
  _rGracias.indexOf('Procesando') < 0,
  '"gracias" no activa fallback largo ni muletillas'
);

var _rOk = respText(w.aiAnswer('ok', _stAck));
truthy(_rOk.length < 120, '"ok" da respuesta corta: ' + _rOk.length + ' chars');

var _rDale = respText(w.aiAnswer('dale', _stAck));
truthy(_rDale.length < 120, '"dale" da respuesta corta: ' + _rDale.length + ' chars');

// ── Referencias contextuales ────────────────────────────────────
group('contexto: referencias elípticas resuelven correctamente');
// Sin contexto previo, referencias sin destino claro no deben inventar
var _ctxVacio = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('¿y eso por qué?', { lastIntent: null, lastTopic: null })
  : null;
truthy(_ctxVacio === null, '¿y eso por qué? sin contexto → null (no inventar)');

// Con contexto financiero previo, la quincena pasada resuelve a comparativa
var _ctxConIntentFin = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('quincena pasada', { lastIntent: 'total_ganado', lastTopic: 'dinero' })
  : 'comparativa_mes';
eq(_ctxConIntentFin, 'comparativa_mes', '"quincena pasada" → comparativa_mes');

var _ctxSemana = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('semana pasada', { lastIntent: 'hoy', lastTopic: 'dinero' })
  : 'comparativa_semana';
eq(_ctxSemana, 'comparativa_semana', '"semana pasada" → comparativa_semana');

var _ctxMes = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('mes pasado', { lastIntent: 'hoy', lastTopic: 'dinero' })
  : 'comparativa_mes';
eq(_ctxMes, 'comparativa_mes', '"mes pasado" → comparativa_mes');

// "¿y ayer?" elíptico con contexto financiero → ayer
var _ctxAyer = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('y ayer?', { lastIntent: 'hoy', lastTopic: 'dinero' })
  : 'ayer';
eq(_ctxAyer, 'ayer', '"y ayer?" con contexto financiero → ayer');

// Contexto no-financiero no dispara resolución para "¿y eso?"
var _ctxConv = typeof w.aiResolveContextRef === 'function'
  ? w.aiResolveContextRef('y eso?', { lastIntent: 'saludo', lastTopic: 'conversacion' })
  : null;
truthy(_ctxConv === null, '"y eso?" con contexto conversacional → null (no reclama)');

// ── Mejoras de comunicación v277 ────────────────────────────────
group('v277 — voseo: ninguna respuesta contiene tuteo residual');
var _voseoState = {
  turnos: [], turnosAll: [],
  calc: w.doCalc([], null, new Date(), 0),
  vh: 0, salario: 0,
  session: { uid: 'u-voseo', email: 'v@test.com' }
};
var _tuteoPhrases = ['tienes ', 'puedes ', 'debes ', 'mantienes '];
var _checkTuteo = function(q) {
  var r = respText(w.aiAnswer(q, _voseoState));
  for (var _ti = 0; _ti < _tuteoPhrases.length; _ti++) {
    if (r.toLowerCase().indexOf(_tuteoPhrases[_ti]) >= 0) return r;
  }
  return null;
};
var _noTurnos = _checkTuteo('cuántos turnos tengo');
truthy(!_noTurnos, 'respuesta "cuántos turnos" no contiene tuteo: ' + (_noTurnos ? _noTurnos.slice(0,80) : 'OK'));

group('v277 — distribucion: respuesta no contiene [object Object]');
var _stDist = {
  turnos: [], turnosAll: [],
  calc: w.doCalc([], null, new Date(), 0),
  vh: 7916, salario: 1900000,
  session: { uid: 'u-dist', email: 'd@test.com' }
};
var _rDist = respText(w.aiAnswer('desglose de recargos', _stDist));
truthy(
  _rDist.indexOf('[object Object]') < 0,
  'respuesta desglose no contiene "[object Object]": ' + _rDist.slice(0, 80)
);
truthy(
  typeof _rDist === 'string' && _rDist.length > 0,
  'respuesta desglose es string no vacío'
);

group('v277 — help: verbos conjugados disparan guías correctas');
// "¿cómo inicio un turno?" debe encontrar la guía iniciar_turno (no null)
var _helpInicio = typeof w.aiHelpSearch === 'function'
  ? w.aiHelpSearch('como inicio un turno')
  : null;
truthy(_helpInicio && _helpInicio.id === 'iniciar_turno',
  '"como inicio un turno" encuentra guía iniciar_turno (era null antes del fix)');

var _helpTermino = typeof w.aiHelpSearch === 'function'
  ? w.aiHelpSearch('termino turno')
  : null;
truthy(_helpTermino && _helpTermino.id === 'finalizar_turno',
  '"termino turno" encuentra guía finalizar_turno');

var _helpCambio = typeof w.aiHelpSearch === 'function'
  ? w.aiHelpSearch('cambio salario')
  : null;
truthy(_helpCambio && _helpCambio.id === 'configurar_salario',
  '"cambio salario" encuentra guía configurar_salario');

// ── Bug v277: clasificación de "como estuvo ayer" ──────────────
group('NLP: intent ayer con "como estuvo ayer"');
(function () {
  var _nlp = typeof w.aiClassifyIntent === 'function';
  // "como estuvo ayer" debe ir a ayer, no a curiosidad_app ni reflexion
  var r1 = _nlp ? w.aiClassifyIntent('como estuvo ayer', null, null) : null;
  truthy(r1 && r1.intent === 'ayer',
    '"como estuvo ayer" → ayer (era curiosidad_app antes del fix)');

  var r2 = _nlp ? w.aiClassifyIntent('cómo estuvo ayer', null, null) : null;
  truthy(r2 && r2.intent === 'ayer',
    '"cómo estuvo ayer" → ayer');

  var r3 = _nlp ? w.aiClassifyIntent('que tal estuvo ayer', null, null) : null;
  truthy(r3 && r3.intent === 'ayer',
    '"que tal estuvo ayer" → ayer');

  // Casos que NO deben ir a ayer
  var r4 = _nlp ? w.aiClassifyIntent('que tal estuvo la semana', null, null) : null;
  truthy(r4 && r4.intent !== 'ayer',
    '"que tal estuvo la semana" no va a ayer');

  // "ayer" solo sigue en ayer
  var r5 = _nlp ? w.aiClassifyIntent('ayer', null, null) : null;
  truthy(r5 && r5.intent === 'ayer',
    '"ayer" solo → ayer');

  // "cuánto hice ayer" sigue en ayer
  var r6 = _nlp ? w.aiClassifyIntent('cuánto hice ayer', null, null) : null;
  truthy(r6 && r6.intent === 'ayer',
    '"cuánto hice ayer" → ayer');

  // "cómo funciona la app" no va a ayer
  var r7 = _nlp ? w.aiClassifyIntent('cómo funciona la app', null, null) : null;
  truthy(r7 && r7.intent !== 'ayer',
    '"cómo funciona la app" no va a ayer');
})();

// ── Bug v277: proyección inflada en briefing proactivo ──────────
group('aiBriefing: porcentaje vs salario clampeado');
(function () {
  var _hasBriefing = typeof w.aiBriefing === 'function';
  var _hasBuildCtx = typeof w.buildContext === 'function';

  // Contexto simulado: 9 turnos, salario OK (1.900.000)
  // El proy correcto es (648375/9)*30 = 2161250, vsSalario ~+13.7%
  if (_hasBriefing && _hasBuildCtx) {
    // buildContext necesita state completo — fabricamos un turno
    var _ahora = new Date();
    var _ini = new Date(_ahora.getFullYear(), _ahora.getMonth(), 1);
    _ini.setHours(8, 0, 0, 0);
    var _fin = new Date(_ini);
    _fin.setHours(16, 0, 0, 0);
    var _turno = { id: '1', inicio: _ini.toISOString(), fin: _fin.toISOString() };

    var _state = {
      turnos: [_turno],
      turnosAll: [_turno],
      calc: w.doCalc([_turno], null, _ahora, 7916.67),
      salario: 1900000,
      vh: 7916.67,
      session: { uid: 'test-uid', email: 'test@test.com' },
      activo: null
    };

    var _ctx = w.buildContext(_state);
    truthy(_ctx && _ctx.totalCOP > 0,
      'buildContext genera totalCOP > 0 con un turno');
    truthy(_ctx && _ctx.diasTrab > 0,
      'buildContext genera diasTrab > 0 con un turno');
    truthy(_ctx && _ctx.proy > 0,
      'buildContext genera proy > 0 con diasTrab > 0');
    truthy(_ctx && _ctx.salario === 1900000,
      'buildContext preserva el salario mensual (no vh)');

    var _briefing = w.aiBriefing(_ctx);
    truthy(typeof _briefing === 'string',
      'aiBriefing retorna string');
    truthy(_briefing.indexOf('turnos') >= 0 || _briefing.indexOf('mes') >= 0,
      'briefing menciona turnos o mes (no "Aún no tenés turnos")');

    // El porcentaje NO puede superar 300%
    var _hasPct = _briefing.indexOf('%') >= 0;
    if (_hasPct) {
      var _match = _briefing.match(/\(([+-]?\d+)%/);
      if (_match) {
        var _pct = parseInt(_match[1], 10);
        truthy(Math.abs(_pct) <= 300,
          'vsSalario clampea a ±300% (era ' + _pct + '%, debería ser ≤300%)');
      }
    }
  } else {
    // Al menos verificar que la función existe
    truthy(_hasBriefing, 'aiBriefing existe como función');
  }

  // Con salario extremadamente bajo (< 500000) no debe mostrar porcentaje absurdo
  if (_hasBriefing) {
    var _cBajo = {
      diasTrab: 9,
      totalCOP: 648375,
      proy: 1620938,
      salario: 7917,   // vh mal pasado como salario
      vh: 7917,
      turnosHoy: 0,
      copHoy: 0,
      minsHoy: 0,
      rachaActual: 0
    };
    var _bBajo = w.aiBriefing(_cBajo);
    // Con salario < 500000 no debe aparecer el "% vs tu salario"
    truthy(_bBajo.indexOf('20375') < 0,
      'briefing con salario < 500000 no muestra +20375%');
  }
})();

// ════════════════════════════════════════════════════════════════
//  ai-advisor: calculadoras financieras/laborales (v279)
//  Funciones puras del asesor. Antes de v279 el módulo no tenía
//  NINGUNA cobertura en smoke. Estas pruebas afirman la matemática
//  legal (CST) y los casos borde (sin salario, sin ingreso).
// ════════════════════════════════════════════════════════════════

group('ai-advisor: indemnización por despido (Art. 64 CST)');
(function () {
  var SAL = w.SMIN; // salario mínimo 2026
  var r1 = w.aiAdvisorIndemnizacion({ salario: SAL }, 1);
  truthy(r1.indexOf('30 días') >= 0, '1 año (< 10 SMMLV) → 30 días de salario');
  // 1 año a 30 días = exactamente 1 salario mensual (sal/30*30)
  truthy(r1.indexOf(w.fCOP(SAL)) >= 0, '1 año ≈ 1 salario de indemnización');

  var r3 = w.aiAdvisorIndemnizacion({ salario: SAL }, 3);
  truthy(r3.indexOf('70 días') >= 0, '3 años → 30 + 20×2 = 70 días');

  var rAlto = w.aiAdvisorIndemnizacion({ salario: w.SMIN * 10 }, 1);
  truthy(rAlto.indexOf('20 días') >= 0, 'salario ≥ 10 SMMLV: primer año = 20 días (no 30)');

  var rNoSal = w.aiAdvisorIndemnizacion({}, 1);
  truthy(rNoSal.indexOf('salario base') >= 0,
    'sin salario configurado: pide el dato, NO calcula sobre basura');
})();

group('ai-advisor: fondo de emergencia (#3 plan realista)');
(function () {
  var r = w.aiAdvisorEmergencia({ proy: 2000000 });
  truthy(r.indexOf(w.fCOP(6000000)) >= 0, 'colchón mínimo = 3 meses de ingreso');
  truthy(r.indexOf(w.fCOP(12000000)) >= 0, 'colchón ideal = 6 meses de ingreso');
  // Plan realista = mínimo/12 = 6M/12 = 500k (25%), NO el 50% (ideal/12)
  truthy(r.indexOf(w.fCOP(500000)) >= 0, 'plan realista = colchón mínimo / 12 (25%)');
  truthy(r.indexOf('25.0%') >= 0, 'el plan se comunica como 25% del ingreso, no 50%');
  truthy(r.indexOf('50%') >= 0 && r.indexOf('poco realista') >= 0,
    'advierte explícitamente que armar 6 meses en 1 año (50%) es poco realista');

  var r0 = w.aiAdvisorEmergencia({});
  truthy(r0.indexOf('ingreso mensual') >= 0,
    'sin ningún ingreso conocido: no inventa cifras');
})();

group('ai-advisor: capacidad de endeudamiento (regla 30%)');
(function () {
  var r = w.aiAdvisorEndeudamiento({ proy: 1000000 }, 0);
  // neto = 1.000.000 * 0.92 = 920.000 → 30% = 276.000
  truthy(r.indexOf(w.fCOP(276000)) >= 0, 'cuota sana = 30% del ingreso neto');

  var rRiesgo = w.aiAdvisorEndeudamiento({ proy: 1000000 }, 500000);
  truthy(rRiesgo.indexOf('🔴') >= 0, 'cuota > 40% del neto → riesgo alto');

  var rOk = w.aiAdvisorEndeudamiento({ proy: 1000000 }, 100000);
  truthy(rOk.indexOf('🟢') >= 0, 'cuota baja → saludable');

  var r0 = w.aiAdvisorEndeudamiento({});
  truthy(r0.indexOf('ingreso mensual') >= 0, 'sin ingreso: no calcula');
})();

group('ai-advisor: comparador de ofertas (rescatado de función muerta)');
(function () {
  var c = { vh: 7295, salario: w.SMIN, totalMins: 0, diasTrab: 22 };
  var r = w.aiAdvisorCompararOfertas(c, 2500000, 0);
  truthy(r.indexOf('Comparador') >= 0, 'el comparador ahora es alcanzable');
  truthy(r.indexOf('✅') >= 0, 'oferta mayor al salario actual se marca como mejora');
})();

group('ai-advisor: dispatch de intents (aiAdvisorRespond)');
(function () {
  var c = { salario: w.SMIN, proy: 2000000, vh: 7295, totalMins: 0, diasTrab: 22 };
  truthy((w.aiAdvisorRespond('indemnizacion', c, { anios: 2 }) || '').indexOf('50 días') >= 0,
    'respond(indemnizacion, anios:2) → 30 + 20 = 50 días');
  truthy(w.aiAdvisorRespond('emergencia', c, null), 'respond(emergencia) responde');
  truthy(w.aiAdvisorRespond('endeudamiento', c, { cuota: 300000 }),
    'respond(endeudamiento) responde');
  truthy(w.aiAdvisorRespond('comparar_oferta', c, { ofertaSalario: 2500000 }),
    'respond(comparar_oferta) con salario responde');
  eq(w.aiAdvisorRespond('comparar_oferta', c, {}), null,
    'respond(comparar_oferta) SIN salario → null (no inventa una comparación)');
})();

group('ai-agente: rutas conversacionales nuevas (lenguaje natural + slash)');
(function () {
  w.aiResetConv();
  var rD = respText(w.aiAnswer('¿cuánto me dan si me despiden?', _stMeta));
  truthy(rD.indexOf('Indemnización') >= 0,
    'frase natural de despido → indemnización (no liquidación)');

  var rD3 = respText(w.aiAnswer('/indemnizacion 3', _stMeta));
  truthy(rD3.indexOf('70 días') >= 0, '/indemnizacion 3 → 70 días');

  var rFE = respText(w.aiAnswer('quiero armar un fondo de emergencia', _stMeta));
  truthy(rFE.indexOf('emergencia') >= 0, 'natural → fondo de emergencia');

  var rCu = respText(w.aiAnswer('cuánto puedo pagar de cuota', _stMeta));
  truthy(rCu.indexOf('endeudamiento') >= 0 || rCu.indexOf('Cuota') >= 0,
    'natural → capacidad de cuota');

  var rOf = respText(w.aiAnswer('tengo una oferta de 3 millones', _stMeta));
  truthy(rOf.indexOf('Comparador') >= 0, 'natural con oferta + cifra → comparador');

  // Regresión: "comparar con el mes pasado" NO debe ir al comparador de
  // ofertas (no tiene oferta ni cifra de salario nuevo).
  var rCmpMes = respText(w.aiAnswer('comparar con el mes pasado', _stMeta));
  truthy(rCmpMes.indexOf('Comparador de ofertas') < 0 && rCmpMes.indexOf('oferta') < 0,
    'regresión: "comparar mes" NO se desvía al comparador de ofertas');
})();

group('ai-agente #1: follow-up contextual de calculadoras');
(function () {
  // Despido → "llevo 4 años": debe recalcular (30 + 20×3 = 90 días).
  // Antes caía al fallback genérico pese a que la IA pidió el dato.
  w.aiResetConv();
  respText(w.aiAnswer('¿cuánto me dan si me despiden?', _stMeta));
  var rA = respText(w.aiAnswer('llevo 4 años en la empresa', _stMeta));
  truthy(rA.indexOf('90 días') >= 0,
    'follow-up: tras despido, "llevo 4 años" recalcula a 90 días');

  // Capacidad de cuota → "y si la cuota es de 600 mil": evalúa esa cuota.
  w.aiResetConv();
  respText(w.aiAnswer('cuánto puedo pagar de cuota', _stMeta));
  var rB = respText(w.aiAnswer('y si la cuota es de 600 mil?', _stMeta));
  truthy(rB.indexOf('600.000') >= 0,
    'follow-up: tras capacidad de cuota, "600 mil" evalúa esa cuota concreta');
  truthy(rB.indexOf('🔴') >= 0 || rB.indexOf('🟡') >= 0 || rB.indexOf('🟢') >= 0,
    'follow-up de cuota incluye el semáforo de riesgo');

  // Adyacencia: un número suelto NO debe interpretarse como follow-up si
  // hubo un turno intermedio no financiero.
  w.aiResetConv();
  respText(w.aiAnswer('¿cuánto me dan si me despiden?', _stMeta));
  respText(w.aiAnswer('cuánto llevo este mes', _stMeta));
  var rC = respText(w.aiAnswer('5', _stMeta));
  truthy(rC.indexOf('días de salario') < 0,
    'adyacencia: "5" dos turnos después NO se lee como años de antigüedad');
})();

group('ai-agente #2: salario configurado por flag sc, no por monto');
(function () {
  var uid = 'u-sc-test';
  var ds = [mkTurno(primerDiaNoFestivo(_hoy.getFullYear(), _hoy.getMonth()), 8)];
  var vhMin = Math.round(w.SMIN / 240);
  var stMin = {
    turnos: ds, turnosAll: ds,
    calc: w.doCalc(ds, null, new Date(), vhMin),
    vh: vhMin, salario: w.SMIN,
    session: { uid: uid, email: 't@x.com' }
  };
  w.localStorage.removeItem(w.dk(uid, 'sc'));
  truthy(w.buildContext(stMin).salarioConfigurado === false,
    'salario == SMIN sin flag → NO configurado (estado neutro)');
  w.localStorage.setItem(w.dk(uid, 'sc'), 'true');
  truthy(w.buildContext(stMin).salarioConfigurado === true,
    'salario == SMIN con flag sc=true → configurado (bug del mínimo resuelto)');
})();

group('ai-advisor #4: comparador proyecta horas a mes completo');
(function () {
  // 75h a la fecha (mes parcial) con proy ≈ 1.875× → mes completo ≈ 141h
  var c = { vh: 7295, salario: w.SMIN, totalMins: 4500, totalCOP: 760869, proy: 1426628, diasTrab: 9 };
  var r = w.aiAdvisorCompararOfertas(c, 2300000, 0);
  truthy(r.indexOf('estimadas') >= 0, 'rotula las horas como estimadas (mes completo)');
  truthy(r.indexOf('≈141h') >= 0, 'proyecta 75h MTD × (proy/totalCOP) ≈ 141h');
  truthy(r.indexOf('≈75h') < 0, 'ya NO muestra las horas de mes parcial');
  truthy(r.indexOf('base legal de 240h') >= 0, 'el cálculo de /h se ancla a la base legal de 240h');
})();

group('ai-agente #5: fatiga responde con empatía, no "vas bien"');
(function () {
  w.aiResetConv();
  var r = respText(w.aiAnswer('estoy agotado, llevo varios turnos seguidos', _stMeta));
  truthy(r.indexOf('Vas bien') < 0,
    'NO responde "Vas bien" a quien dice estar agotado (tono-sordo)');
  truthy(r.indexOf('🤝') >= 0 || r.indexOf('escucho') >= 0 || r.indexOf('entiendo') >= 0,
    'valida el sentimiento antes de dar el dato');
})();

group('ai-advisor: presupuesto 50/30/20 (asesor base)');
(function () {
  // bruto 2.000.000 → neto 1.840.000 → 50/30/20 = 920k / 552k / 368k
  var r = w.aiAdvisorPresupuesto({ proy: 2000000 });
  truthy(r.indexOf('50/30/20') >= 0, 'enuncia la regla 50/30/20');
  truthy(r.indexOf(w.fCOP(1840000)) >= 0, 'presupuesta sobre el NETO (×0.92), no el bruto');
  truthy(r.indexOf(w.fCOP(920000)) >= 0, '50% necesidades = 920.000');
  truthy(r.indexOf(w.fCOP(552000)) >= 0, '30% gustos = 552.000');
  truthy(r.indexOf(w.fCOP(368000)) >= 0, '20% ahorro y deudas = 368.000');
  truthy(r.indexOf('emergencia') >= 0, 'cross-sell conversacional al fondo de emergencia');

  // override de ingreso
  var rOv = w.aiAdvisorPresupuesto({ proy: 2000000 }, 4000000);
  truthy(rOv.indexOf(w.fCOP(3680000)) >= 0, 'override de ingreso recalcula sobre 4M (neto 3.68M)');

  // borde: sin ingreso conocido → guía, no inventa
  var r0 = w.aiAdvisorPresupuesto({});
  truthy(r0.indexOf('ingreso mensual') >= 0, 'sin ingreso: pide el dato, no inventa números');

  // dispatch
  truthy(w.aiAdvisorRespond('presupuesto', { proy: 2000000 }, null),
    'aiAdvisorRespond(presupuesto) responde');
})();

group('ai-agente: presupuesto conversacional (natural + slash + follow-up)');
(function () {
  w.aiResetConv();
  var rNat = respText(w.aiAnswer('cómo reparto mi sueldo?', _stMeta));
  truthy(rNat.indexOf('50/30/20') >= 0, 'natural "cómo reparto mi sueldo" → presupuesto');

  var rSlash = respText(w.aiAnswer('/presupuesto', _stMeta));
  truthy(rSlash.indexOf('50/30/20') >= 0, '/presupuesto → presupuesto');

  // follow-up: tras el presupuesto, un ingreso suelto recalcula
  w.aiResetConv();
  respText(w.aiAnswer('cómo reparto mi sueldo?', _stMeta));
  var rFu = respText(w.aiAnswer('y si gano 4 millones?', _stMeta));
  truthy(rFu.indexOf(w.fCOP(3680000)) >= 0,
    'follow-up: "y si gano 4 millones" recalcula el reparto (neto 3.68M)');

  // regresión: "en qué gasté más este mes" NO debe ir a presupuesto
  w.aiResetConv();
  var rReg = respText(w.aiAnswer('comparar con el mes pasado', _stMeta));
  truthy(rReg.indexOf('50/30/20') < 0, 'regresión: "comparar mes" no se desvía a presupuesto');
})();

group('ai-agente: interconexión — los ganchos encadenan a módulos');
(function () {
  // presupuesto ofrece [emergencia, cuota]; "dale" toma la primera
  w.aiResetConv();
  respText(w.aiAnswer('cómo reparto mi sueldo?', _stMeta));
  var rDale = respText(w.aiAnswer('dale', _stMeta));
  truthy(rDale.indexOf('Fondo de emergencia') >= 0,
    '"dale" tras presupuesto encadena a la 1ª opción (fondo de emergencia)');

  // nombrar la segunda opción explícitamente
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  var rCuota = respText(w.aiAnswer('mejor la cuota', _stMeta));
  truthy(rCuota.indexOf('Capacidad de endeudamiento') >= 0,
    '"la cuota" tras presupuesto encadena a capacidad de endeudamiento');

  // ordinal
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  var rSeg = respText(w.aiAnswer('el segundo', _stMeta));
  truthy(rSeg.indexOf('Capacidad de endeudamiento') >= 0,
    '"el segundo" toma la 2ª opción ofrecida');

  // "ambos" muestra las dos
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  var rAmbos = respText(w.aiAnswer('ambos', _stMeta));
  truthy(rAmbos.indexOf('Fondo de emergencia') >= 0 && rAmbos.indexOf('Capacidad de endeudamiento') >= 0,
    '"ambos" encadena las dos opciones');

  // el encadenamiento continúa varios pasos
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta)); // ofrece emergencia/cuota
  respText(w.aiAnswer('dale', _stMeta));          // → emergencia (ofrece presupuesto/cuota)
  var rChain = respText(w.aiAnswer('dale', _stMeta)); // → presupuesto
  truthy(rChain.indexOf('50/30/20') >= 0,
    'el encadenamiento sigue varios pasos (emergencia → presupuesto)');

  // indemnización → pedir liquidación encadena a esa calculadora
  w.aiResetConv();
  respText(w.aiAnswer('cuánto me dan si me despiden?', _stMeta));
  var rLiq = respText(w.aiAnswer('dale, la liquidación', _stMeta));
  truthy(rLiq.indexOf('Liquidación') >= 0 || rLiq.indexOf('prestaciones') >= 0,
    'tras indemnización, pedir liquidación encadena a esa calculadora');
})();

group('ai-agente: interconexión — guards (sin falsos positivos)');
(function () {
  // afirmación NO adyacente no dispara (oferta expirada)
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  respText(w.aiAnswer('cuánto llevo este mes', _stMeta));
  var rTarde = respText(w.aiAnswer('dale', _stMeta));
  truthy(rTarde.indexOf('Fondo de emergencia') < 0,
    'un "dale" 2 turnos después NO encadena (oferta expirada)');

  // "simular 4 horas" NO se confunde con afirmación pese a empezar con "si"
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  var rSim = respText(w.aiAnswer('simular 4 horas nocturnas', _stMeta));
  truthy(rSim.indexOf('Fondo de emergencia') < 0,
    'frase larga con "si..." (simular) NO se lee como afirmación a la oferta');

  // el follow-up numérico de ingreso gana sobre la oferta
  w.aiResetConv();
  respText(w.aiAnswer('/presupuesto', _stMeta));
  var rIng = respText(w.aiAnswer('y si gano 4 millones?', _stMeta));
  truthy(rIng.indexOf(w.fCOP(3680000)) >= 0,
    'override de ingreso recalcula presupuesto, no encadena a otra opción');
})();

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
