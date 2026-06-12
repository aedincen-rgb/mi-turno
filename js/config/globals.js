// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/globals.js
//  Variables globales Supabase + constantes
// ════════════════════════════════════════════════════════════════
// Versión visible de la app (mostrada en Ajustes → Acerca de).
// Mantener sincronizada con CACHE en sw.js y "v" en version.json.
var MT_APP_VERSION = 'v268'; // hito documentación completa v2.1

// Variables globales de Supabase
var SUPA = null;
var CLOUD_MODE = false;
var CLOUD_ERROR = null;

// Constantes de la app
// Ley 2101/2021 — reducción gradual de jornada laboral colombiana
// Cronograma oficial:
//   - 2023.06.15: 47h/semana (↓ de 48h)
//   - 2024.06.15: 46h/semana (↓ de 47h)
//   - 2025.06.15: 45h/semana (↓ de 46h)
//   - 2026.06.15: 44h/semana (↓ de 45h)
//   - 2027.07.01: 42h/semana (meta final)
// Fuente: Ley 2101 de 2021, Art. 1
function getHSEM(fecha) {
  var d = fecha instanceof Date ? fecha : new Date(fecha);
  if (d >= new Date(2027, 6, 1)) return 42; // Meta final de la ley
  if (d >= new Date(2026, 6, 15)) return 44;
  if (d >= new Date(2025, 6, 15)) return 45;
  if (d >= new Date(2024, 6, 15)) return 46;
  if (d >= new Date(2023, 6, 15)) return 47;
  return 48; // Estado antes de reforma
}
var HSEM = getHSEM(new Date()); // límite de la semana actual (referencia)
var SMIN = 1750905; // Salario mínimo Colombia 2026 (Decretos 1469-1470 dic 2025)
var AUX_TRANSPORTE_2026 = 249095; // Auxilio de transporte fijo 2026 (Decreto 1470 dic 2025)
var PRESTACIONES_PCT = 0.218; // Aproximado: cesantías (8.33%) + prima (8.33%) + vacaciones (4.17%) + intereses cesantías (~1%)
var U12H = 12 * 3600000; // 12 horas en milisegundos
var SKEY = 'mt_session'; // Clave para la sesión en localStorage
var FEST_CACHE = {}; // Caché para festivos colombianos

// Mapeo de Recargos (RC) - Centralizado para servicios y UI
var RC = {
  diurnaOrd: {
    label: 'Diurna ordinaria',
    short: 'Diur. ord.',
    factor: 1.0,
    color: '#527FCC',
    bg: 'var(--accent-dim)',
    bd: 'var(--accent)',
    icon: '☀'
  },
  noctOrd: {
    label: 'Nocturna ordinaria',
    short: 'Noct. ord.',
    factor: 1.35,
    color: '#7C52CC',
    bg: 'var(--purple-dim)',
    bd: 'var(--purple)',
    icon: '☾'
  },
  diurnaFest: {
    label: 'Diurna festiva',
    short: 'Fest. diur.',
    factor: 1.75,
    color: '#CC527F',
    bg: 'var(--danger-dim)',
    bd: 'var(--danger)',
    icon: '⛪'
  },
  noctFest: {
    label: 'Nocturna festiva',
    short: 'Fest. noct.',
    factor: 2.1,
    color: '#CC5252',
    bg: 'var(--danger-dim)',
    bd: 'var(--danger)',
    icon: '🌙'
  },
  extraDiurna: {
    label: 'Extra diurna',
    short: 'Ex. diurna',
    factor: 1.25,
    color: '#52CC7C',
    bg: 'var(--success-dim)',
    bd: 'var(--success)',
    icon: '➕'
  },
  extraNoct: {
    label: 'Extra nocturna',
    short: 'Ex. noct.',
    factor: 1.75,
    color: '#52CCB5',
    bg: 'var(--success-dim)',
    bd: 'var(--success)',
    icon: '🌑'
  },
  extraFestDiur: {
    label: 'Extra fest. diurna',
    short: 'Ex. fest. d.',
    factor: 2.0,
    color: '#CCA352',
    bg: 'var(--warn-dim)',
    bd: 'var(--warn)',
    icon: '⭐'
  },
  extraFestNoct: {
    label: 'Extra fest. noct.',
    short: 'Ex. fest. n.',
    factor: 2.5,
    color: '#CC7A52',
    bg: 'var(--warn-dim)',
    bd: 'var(--warn)',
    icon: '🌌'
  }
};

/**
 * Calcula el Domingo de Ramos para un año dado (Algoritmo de Butcher-Meeus)
 */
function getEaster(year) {
  var a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    hh = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - hh - k) % 7,
    m = Math.floor((a + 11 * hh + 22 * l) / 451);
  var month = Math.floor((hh + l - 7 * m + 114) / 31) - 1;
  var day = ((hh + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// ─── STUBS TEMPORALES DE SEGURIDAD ───
// Evitan ReferenceError si root.js carga antes que los módulos de utilidades
if (typeof window.leer === 'undefined')
  window.leer = function (k, d) {
    console.warn('[BOOT] leer() stub', k);
    return d;
  };
if (typeof window.grabar === 'undefined')
  window.grabar = function (k, v) {
    console.warn('[BOOT] grabar() stub', k);
  };
if (typeof window.borrarKey === 'undefined')
  window.borrarKey = function (k) {
    console.warn('[BOOT] borrarKey() stub', k);
  };
if (typeof window.dk === 'undefined')
  window.dk = function (u, k) {
    // Mismo layout que el dk real en js/utils/time.js: 'mt_<key>_<uid>'.
    // Cualquier inversión rompe los reads del resto de la app (los stubs
    // a veces se ejecutan antes que el dk real cargue desde time.js).
    return 'mt_' + k + '_' + u;
  };
if (typeof window.haptic === 'undefined') window.haptic = function () {};
if (typeof window.validarSesion === 'undefined')
  window.validarSesion = function (s) {
    return s;
  };
if (typeof window.traducirError === 'undefined')
  window.traducirError = function (e) {
    return (e || {}).message || String(e);
  };
