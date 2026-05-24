// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/quincena.js
//  Soporte modo quincenal manual + extras (auxilio, prestaciones)
// ────────────────────────────────────────────────────────────────
//  Las preferencias viven en localStorage bajo `mt_prefs_<uid>` y
//  se inyectan en App, Home y Dashboard. Este módulo concentra:
//   - prefs por defecto y normalización
//   - cálculo del rango de la quincena activa según el `ahora`
//   - filtro de turnos dentro de un rango
//   - extras a sumar al estimado (auxilio + prestaciones)
// ════════════════════════════════════════════════════════════════

var QUINCENA_PREFS_DEFAULT = {
  auxTransp: false,
  prestaciones: false,
  quincenaMode: false,
  q1Day: 1,
  q2Day: 16
};

function clampDayOfMonth(n, fallback) {
  var v = parseInt(n, 10);
  if (isNaN(v)) return fallback;
  if (v < 1) return 1;
  if (v > 28) return 28; // evita meses cortos (febrero)
  return v;
}

function normalizePrefs(p) {
  var src = p && typeof p === 'object' ? p : {};
  return {
    auxTransp: !!src.auxTransp,
    prestaciones: !!src.prestaciones,
    quincenaMode: !!src.quincenaMode,
    q1Day: clampDayOfMonth(src.q1Day, 1),
    q2Day: clampDayOfMonth(src.q2Day, 16)
  };
}

// Devuelve el rango [ini, fin) de la quincena activa en `ahora`,
// respetando los días configurados. fin es exclusivo.
function getQuincenaRange(ahora, prefs) {
  var p = normalizePrefs(prefs);
  var y = ahora.getFullYear();
  var m = ahora.getMonth();
  var d = ahora.getDate();
  var q1 = p.q1Day;
  var q2 = p.q2Day;
  // Si el usuario invierte los valores, normalizamos por orden
  if (q2 <= q1) q2 = Math.min(28, q1 + 14);

  var inQ2 = d >= q2;
  // Si está antes del día Q1 (raro si q1>1) tratamos como Q2 del mes previo
  var antesDeQ1 = d < q1;

  var ini, fin, idx, label;
  if (antesDeQ1) {
    var prev = new Date(y, m - 1, q2);
    ini = prev;
    fin = new Date(y, m, q1);
    idx = 2;
    label = 'Q2';
  } else if (inQ2) {
    ini = new Date(y, m, q2);
    fin = new Date(y, m + 1, q1); // hasta el siguiente Q1
    idx = 2;
    label = 'Q2';
  } else {
    ini = new Date(y, m, q1);
    fin = new Date(y, m, q2);
    idx = 1;
    label = 'Q1';
  }
  return { ini: ini, fin: fin, idx: idx, label: label, q1Day: q1, q2Day: q2 };
}

// Rangos Q1 y Q2 del mes calendario de `ahora`.
function getQuincenasMes(ahora, prefs) {
  var p = normalizePrefs(prefs);
  var y = ahora.getFullYear();
  var m = ahora.getMonth();
  var q1 = p.q1Day;
  var q2 = p.q2Day;
  if (q2 <= q1) q2 = Math.min(28, q1 + 14);
  return {
    q1: { ini: new Date(y, m, q1), fin: new Date(y, m, q2), idx: 1, label: 'Q1' },
    q2: { ini: new Date(y, m, q2), fin: new Date(y, m + 1, q1), idx: 2, label: 'Q2' }
  };
}

function filterTurnosRango(turnos, rango) {
  if (!rango || !turnos) return [];
  var iniMs = rango.ini.getTime();
  var finMs = rango.fin.getTime();
  return turnos.filter(function (t) {
    var s = new Date(t.inicio).getTime();
    return s >= iniMs && s < finMs;
  });
}

// Suma de extras: auxilio (mensual) + prestaciones (% sobre salario).
// `proporcion` permite prorratear para quincena (0.5).
function calcularExtras(salario, prefs, proporcion) {
  var p = normalizePrefs(prefs);
  var prop = typeof proporcion === 'number' ? proporcion : 1;
  var aux = 0,
    prest = 0;
  if (p.auxTransp) aux = AUX_TRANSPORTE_2026 * prop;
  if (p.prestaciones) prest = (salario || 0) * PRESTACIONES_PCT * prop;
  return { aux: aux, prest: prest, total: aux + prest };
}

function formatRangoCorto(rango) {
  if (!rango) return '';
  var ini = rango.ini;
  var fin = new Date(rango.fin.getTime() - 86400000); // último día inclusivo
  var opts = { day: 'numeric', month: 'short' };
  return (
    ini.toLocaleDateString('es-CO', opts) +
    ' – ' +
    fin.toLocaleDateString('es-CO', opts)
  );
}

// expose
window.QUINCENA_PREFS_DEFAULT = QUINCENA_PREFS_DEFAULT;
window.normalizePrefs = normalizePrefs;
window.getQuincenaRange = getQuincenaRange;
window.getQuincenasMes = getQuincenasMes;
window.filterTurnosRango = filterTurnosRango;
window.calcularExtras = calcularExtras;
window.formatRangoCorto = formatRangoCorto;
