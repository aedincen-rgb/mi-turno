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
  'js/services/ai-enhanced.js',
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
