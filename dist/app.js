// ════════════════════════════════════════════════════════════
//  MI TURNO · app.js (build de producción)
//  Versión: v96 · 2026-06-03 22:58
//  Archivos concatenados: 56
//  Generado por scripts/build.sh
// ════════════════════════════════════════════════════════════

(function(){
'use strict';

// ── js/config.js ──
window.SUPABASE_CONFIG = {
  url: 'https://yrpqvmqmchsxpotytxiy.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycHF2bXFtY2hzeHBvdHl0eGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDY5ODMsImV4cCI6MjA5MzYyMjk4M30.55nhMmkBg1aqH3wy7tZ4zpnbFv3-Id-sWUTqdyUg1jI'
};


// ── js/theme-boot.js ──
(function () {
  try {
    var t = JSON.parse(localStorage.getItem('mt_theme'));
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();


// ── js/config/react-init.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/react-init.js
//  Verificación React y aliases
// ════════════════════════════════════════════════════════════════
// Verificación de React + aliases
if (!window.React || !window.ReactDOM) {
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;text-align:center;font-family:-apple-system,sans-serif">Error de conexión. Recarga la página.</div>';
  throw new Error('React no cargó - abortando carga de scripts');
}
var useState = React.useState,
  useEffect = React.useEffect,
  useRef = React.useRef,
  useCallback = React.useCallback,
  useMemo = React.useMemo,
  h = React.createElement;


// ── js/config/env.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/env.js
//  Variables de entorno y aliases React
// ════════════════════════════════════════════════════════════════
// Variables de entorno
var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var IS_SAFARI = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
var IS_IOS_SAFARI = IS_IOS && IS_SAFARI;
var IS_STANDALONE = window.navigator.standalone === true;
console.log('[MT] Entorno:', {
  iOS: IS_IOS,
  Safari: IS_SAFARI,
  iOSSafari: IS_IOS_SAFARI,
  PWA: IS_STANDALONE
});


// ── js/config/viewport-fix.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/viewport-fix.js
//  Fix viewport iOS
// ════════════════════════════════════════════════════════════════
// Fix viewport iOS (notch, safe area, barra dinámica)
if (IS_IOS) {
  try {
    var setVH = function () {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', function () {
      setTimeout(setVH, 100);
    });
  } catch (e) {}
}


// ── js/config/globals.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/globals.js
//  Variables globales Supabase + constantes
// ════════════════════════════════════════════════════════════════
// Versión visible de la app (mostrada en Ajustes → Acerca de).
// Mantener sincronizada con CACHE en sw.js y "v" en version.json.
var MT_APP_VERSION = 'v96';

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


// ── js/utils/storage.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/storage.js
//  localStorage seguro con fallback en memoria
// ════════════════════════════════════════════════════════════════
var safeStorage = (function () {
  try {
    var t = '__mt_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return window.localStorage;
  } catch (e) {
    console.warn('[MT] localStorage no disponible, usando memoria');
    var m = {};
    return {
      getItem: function (k) {
        return m[k] || null;
      },
      setItem: function (k, v) {
        m[k] = String(v);
      },
      removeItem: function (k) {
        delete m[k];
      },
      clear: function () {
        m = {};
      },
      key: function (i) {
        return Object.keys(m)[i] || null;
      },
      get length() {
        return Object.keys(m).length;
      }
    };
  }
})();

function leer(k, d) {
  try {
    var v = safeStorage.getItem(k);
    return v != null ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}

function grabar(k, v) {
  try {
    safeStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    // QuotaExceededError u otro fallo. Devolvemos false para que el
    // caller pueda avisar al usuario en vez de fingir que guardó.
    console.warn('[MT] Storage falló:', e);
    return false;
  }
}

function borrarKey(k) {
  try {
    safeStorage.removeItem(k);
  } catch (e) {}
}


// ── js/utils/format.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/format.js
//  Formateo de moneda y duración
// ════════════════════════════════════════════════════════════════
function fCOP(v) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v || 0);
}

function fDur(m) {
  var mm = Math.max(0, Math.round(m));
  return Math.floor(mm / 60) + 'h ' + String(mm % 60).padStart(2, '0') + 'm';
}

function fDurShort(m) {
  var mm = Math.max(0, Math.round(m));
  var hh = Math.floor(mm / 60);
  return hh + 'h' + (mm % 60 > 0 ? ' ' + (mm % 60) + 'm' : '');
}


// ── js/utils/haptic.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/haptic.js
//  Vibración háptica — patrones diferenciados por intención
// ════════════════════════════════════════════════════════════════
function _vibrate(pattern) {
  try {
    if (window.navigator && navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) {}
}

// Tap neutro (taps de UI, navegación)
function haptic() {
  _vibrate(5);
}

// Éxito: doble pulso corto y suave
function hapticSuccess() {
  _vibrate([10, 40, 14]);
}

// Error: tres pulsos firmes (patrón de rechazo)
function hapticError() {
  _vibrate([35, 28, 35, 28, 35]);
}

// Advertencia: un pulso medio seguido de uno corto
function hapticWarning() {
  _vibrate([22, 50, 12]);
}


// ── js/utils/error-logger.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/error-logger.js
//  Captura y gestiona errores de runtime offline
// ════════════════════════════════════════════════════════════════

var _errorLogsKey = 'mt_error_logs';
var _maxLogs = 50; // Máximo de errores a almacenar
var _errors = []; // Cache en memoria
var _listeners = []; // Listeners para notificar cambios

function _loadLogs() {
  try {
    var stored = leer(_errorLogsKey, []);
    _errors = Array.isArray(stored) ? stored : [];
    // Asegurarse de que los errores tengan un ID único si no lo tienen
    _errors.forEach(e => { if (!e.id) e.id = generateUUID(); });
    _errors = _errors.slice(-_maxLogs); // Mantener el límite
  } catch (e) {
    console.error('[ErrorLogger] Error al cargar logs:', e);
    _errors = [];
  }
}

function _saveLogs() {
  try {
    grabar(_errorLogsKey, _errors);
  } catch (e) {
    console.error('[ErrorLogger] Error al guardar logs:', e);
  }
}

function _notifyListeners() {
  _listeners.forEach(cb => cb(_errors));
}

function logError(errorObj) {
  var newError = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    message: errorObj.message || 'Error desconocido',
    stack: errorObj.stack || 'No stack trace',
    filename: errorObj.filename || 'unknown',
    lineno: errorObj.lineno || 0,
    colno: errorObj.colno || 0,
    type: errorObj.type || 'error',
    // Información de diagnóstico adicional
    online: navigator.onLine,
    url: window.location.href,
    ua: navigator.userAgent.split(' ').pop()
  };
  
  _errors.push(newError);
  _errors = _errors.slice(-_maxLogs); // Mantener el límite
  _saveLogs();
  _notifyListeners();
  console.error('[ErrorLogger] Error capturado:', newError);
}

function getErrors() {
  return _errors.slice(); // Devolver una copia para evitar mutaciones externas
}

function clearErrors() {
  _errors = [];
  _saveLogs();
  _notifyListeners();
}

function addErrorListener(callback) {
  _listeners.push(callback);
}

function removeErrorListener(callback) {
  _listeners = _listeners.filter(cb => cb !== callback);
}

function initErrorLogger() {
  _loadLogs(); // Cargar logs existentes al iniciar
  window.onerror = function (message, source, lineno, colno, error) { logError({ message: message, filename: source, lineno: lineno, colno: colno, stack: error ? error.stack : 'No stack trace available', type: 'error' }); return false; };
  window.onunhandledrejection = function (event) { logError({ message: event.reason ? event.reason.message || event.reason.toString() : 'Unhandled Rejection', stack: event.reason ? event.reason.stack : 'No stack trace available', filename: 'Promise Rejection', lineno: 0, colno: 0, type: 'unhandledrejection' }); return false; };
}
initErrorLogger(); // Inicializar el logger al cargar el script

// ── js/utils/network.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/network.js
//  Timeout y traducción de errores
// ════════════════════════════════════════════════════════════════
function withTimeout(promise, ms, label) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var t = setTimeout(function () {
      if (done) return;
      done = true;
      reject(new Error((label || 'Operación') + ' superó el tiempo de espera'));
    }, ms);
    Promise.resolve(promise).then(
      function (v) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      },
      function (e) {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

// --- Network Status Management ---
var _isOnline = navigator.onLine;
var _onlineListeners = [];
var _offlineListeners = [];

function _updateOnlineStatus() {
  var newStatus = navigator.onLine;
  if (newStatus !== _isOnline) {
    _isOnline = newStatus;
    if (_isOnline) {
      _onlineListeners.forEach(function (fn) {
        fn();
      });
    } else {
      _offlineListeners.forEach(function (fn) {
        fn();
      });
    }
  }
}

window.addEventListener('online', _updateOnlineStatus);
window.addEventListener('offline', _updateOnlineStatus);

function isOnline() {
  return _isOnline;
}
function onOnline(callback) {
  _onlineListeners.push(callback);
}
function onOffline(callback) {
  _offlineListeners.push(callback);
}

function removeOnlineListener(callback) {
  _onlineListeners = _onlineListeners.filter(function (fn) {
    return fn !== callback;
  });
}
function removeOfflineListener(callback) {
  _offlineListeners = _offlineListeners.filter(function (fn) {
    return fn !== callback;
  });
}

// --- Error Translation ---
function traducirError(err) {
  if (!err) return 'Error desconocido';
  var msg = (err.message || err.error_description || err.toString() || '').toString();
  var low = msg.toLowerCase();
  if (
    low.indexOf('load failed') >= 0 ||
    low.indexOf('failed to fetch') >= 0 ||
    low.indexOf('networkerror') >= 0 ||
    low.indexOf('tiempo de espera') >= 0 ||
    low.indexOf('service worker') >= 0 ||
    low.indexOf('404') >= 0 ||
    low.indexOf('network request failed') >= 0 ||
    low.indexOf('abort') >= 0
  )
    return 'Fallo de conexión o archivo no encontrado (404). Revisa la red o el Service Worker.';
  if (low.indexOf('invalid login') >= 0 || low.indexOf('invalid credentials') >= 0)
    return 'Correo o contraseña incorrectos.';
  if (low.indexOf('email not confirmed') >= 0) return 'Debes confirmar tu correo antes de entrar.';
  if (low.indexOf('user already') >= 0 || low.indexOf('already registered') >= 0)
    return 'Ya existe una cuenta con ese correo.';
  if (low.indexOf('password should be') >= 0 || low.indexOf('weak password') >= 0)
    return 'La contraseña es muy débil (mínimo 6).';
  if (low.indexOf('rate limit') >= 0 || low.indexOf('too many requests') >= 0)
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (
    low.indexOf('duplicate key') >= 0 ||
    low.indexOf('unique constraint') >= 0 ||
    low.indexOf('23505') >= 0
  )
    return 'Ya existe un registro con esa información única (ej. el PIN ya está en uso).';
  if (low.indexOf('database error') >= 0 || low.indexOf('pgrst') >= 0)
    return 'Error de base de datos. Los cambios se guardaron localmente.';
  return msg;
}


// ── js/utils/uuid.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/uuid.js
//  Generador de UUID
// ════════════════════════════════════════════════════════════════
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hashP(s) {
  var hv = 0,
    i;
  for (i = 0; i < s.length; i++) {
    hv = (Math.imul(31, hv) + s.charCodeAt(i)) | 0;
  }
  return 'p' + (hv >>> 0).toString(36);
}


// ── js/utils/icons.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/icons.js
//  Generador de iconos SVG para la navegación
// ════════════════════════════════════════════════════════════════
function tabIcon(name) {
  var c = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'tab-icon-svg'
  };
  if (name === 'home')
    return h(
      'svg',
      c,
      h('circle', { cx: 12, cy: 14, r: 7.5 }),
      h('path', { d: 'M12 10 L12 14 L15 14' }),
      h('path', { d: 'M9.5 3 L14.5 3' }),
      h('path', { d: 'M12 3 L12 6.5' })
    );
  if (name === 'chart')
    return h(
      'svg',
      c,
      h('path', { d: 'M6 20 L6 13' }),
      h('path', { d: 'M12 20 L12 6' }),
      h('path', { d: 'M18 20 L18 10' }),
      h('path', { d: 'M4 21 L20 21' })
    );
  if (name === 'sparkle')
    return h(
      'svg',
      Object.assign({}, c, {
        style: { 
          transform: 'scale(1.22)', 
          filter: 'drop-shadow(0 0 2px rgba(91, 134, 229, 0.45))' 
        },
        strokeWidth: 2,
        stroke: '#5B86E5'
      }),
      h('path', { d: 'M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z' })
    );
  if (name === 'history')
    return h(
      'svg',
      c,
      h('circle', { cx: 12, cy: 12, r: 9 }),
      h('path', { d: 'M12 7 L12 12 L15.5 14' })
    );
  if (name === 'settings')
    return h(
      'svg',
      c,
      h('path', { d: 'M4 7.5 L10.5 7.5' }),
      h('path', { d: 'M14.5 7.5 L20 7.5' }),
      h('circle', { cx: 12.5, cy: 7.5, r: 1.9 }),
      h('path', { d: 'M4 16.5 L6.5 16.5' }),
      h('path', { d: 'M10.5 16.5 L20 16.5' }),
      h('circle', { cx: 8.5, cy: 16.5, r: 1.9 })
    );
  return null;
}

// ── js/utils/festivos.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/festivos.js
//  Cálculo de festivos colombianos
// ════════════════════════════════════════════════════════════════

function getColombianHolidays(year) {
  var hol = new Set();
  hol.add(year + '-01-01');
  hol.add(year + '-05-01');
  hol.add(year + '-07-20');
  hol.add(year + '-08-07');
  hol.add(year + '-12-08');
  hol.add(year + '-12-25');
  function formatDate(d) {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }
  function nextMon(date) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7));
    return formatDate(d);
  }
  hol.add(nextMon(new Date(year, 0, 6)));
  hol.add(nextMon(new Date(year, 2, 19)));
  hol.add(nextMon(new Date(year, 5, 29)));
  hol.add(nextMon(new Date(year, 7, 15)));
  hol.add(nextMon(new Date(year, 9, 12)));
  hol.add(nextMon(new Date(year, 10, 1)));
  hol.add(nextMon(new Date(year, 10, 11)));
  var pascua = getEaster(year);
  function offsetPascua(days) {
    var d = new Date(pascua.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }
  hol.add(formatDate(offsetPascua(-3)));
  hol.add(formatDate(offsetPascua(-2)));
  hol.add(nextMon(offsetPascua(39)));
  hol.add(nextMon(offsetPascua(60)));
  hol.add(nextMon(offsetPascua(68)));
  return hol;
}

function esFest(d) {
  var y = d.getFullYear();
  if (!FEST_CACHE[y]) FEST_CACHE[y] = getColombianHolidays(y);
  var key =
    y +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0');
  return FEST_CACHE[y].has(key) || d.getDay() === 0;
}


// ── js/utils/time.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/time.js
//  Helpers temporales
// ════════════════════════════════════════════════════════════════
function esNoct(d) {
  return d.getHours() >= 21 || d.getHours() < 6;
}

function semLun(d) {
  if (!d || isNaN(d.getTime())) return new Date(0);
  var r = new Date(d);
  r.setHours(0, 0, 0, 0);
  var dia = r.getDay();
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1));
  return r;
}

function dk(uid, n) {
  if (!uid) throw new Error('UID requerido para acceder a datos');
  return 'mt_' + n + '_' + uid;
}

// Ley 2101/2021: Obtener jornada máxima semanal según año del turno
// Facilita auditoría y mantenimiento de la reforma laboral colombiana
function obtenerJornadaMaximaSemanas(fechaTurno) {
  var anio = new Date(fechaTurno).getFullYear();
  if (anio <= 2022) return 48; // Pre-reforma
  if (anio === 2023) return 47; // A partir de jun 2023
  if (anio === 2024) return 46; // A partir de jun 2024
  if (anio === 2025) return 45; // A partir de jun 2025
  if (anio === 2026) return 44; // A partir de jun 2026
  return 42; // 2027 en adelante (meta final)
}


// ── js/utils/validation.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/validation.js
//  Validación de datos almacenados
// ════════════════════════════════════════════════════════════════
function validarTurnoActivo(activo, uid) {
  if (!activo || typeof activo !== 'object' || !activo.inicio) return null;
  if (isNaN(new Date(activo.inicio).getTime())) return null;
  if (activo.userId && activo.userId !== uid) return null;
  return activo;
}

function validarTurnos(turnos, uid) {
  if (!Array.isArray(turnos)) return [];
  return turnos.filter(function (t) {
    if (!t || typeof t !== 'object' || !t.inicio || !t.fin) return false;
    if (isNaN(new Date(t.inicio).getTime()) || isNaN(new Date(t.fin).getTime())) return false;
    if (t.userId && t.userId !== uid) return false;
    return true;
  });
}

/**
 * Valida la estructura de la sesión recuperada de storage o nube
 * @param {Object} s - Objeto de sesión
 */
function validarSesion(s) {
  console.log('[DIAG] Validando sesión:', s);

  if (!s || typeof s !== 'object') {
    console.warn('[DIAG] Sesión nula o tipo incorrecto');
    return null;
  }

  if (!s.uid) {
    console.error('[DIAG] Sesión inválida: falta UID');
    return null;
  }

  return {
    uid: s.uid,
    email: s.email || 'invitado@local',
    guest: !!s.guest,
    cloud: !!s.cloud,
    isAdmin: !!s.isAdmin,
    pin: s.pin || null
  };
}


// ── js/utils/otp.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/otp.js
//  OTP local y generación de PIN único
// ════════════════════════════════════════════════════════════════
var _otpRef = { code: null, expires: 0 };

function otpGenerar() {
  _otpRef.code = String(Math.floor(100000 + Math.random() * 900000));
  _otpRef.expires = Date.now() + 300000; // 5 min
  return _otpRef.code;
}

function otpVerificar(input) {
  if (!_otpRef.code) return false;
  if (Date.now() > _otpRef.expires) {
    _otpRef.code = null;
    return false;
  }
  return input === _otpRef.code;
}

function otpLimpiar() {
  _otpRef.code = null;
  _otpRef.expires = 0;
}

var _PINES_RESERVADOS = ['9999', '0000'];

async function generarPINUnico(uid) {
  var ts = Date.now();
  var rnd = Math.floor(Math.random() * 10000);
  var pin = String((ts + rnd) % 10000).padStart(4, '0');
  if (_PINES_RESERVADOS.indexOf(pin) >= 0) pin = '0001';
  if (CLOUD_MODE && SUPA) {
    var intentos = 0;
    while (intentos < 10) {
      try {
        var r = await SUPA.from('pin_lookup').select('pin').eq('pin', pin).maybeSingle();
        if (r.error && r.error.code !== 'PGRST116') break;
        if (!r.data) break;
        pin = String(Math.floor(Math.random() * 9998) + 1).padStart(4, '0');
        if (_PINES_RESERVADOS.indexOf(pin) >= 0) pin = '0001';
        intentos++;
      } catch (e) {
        break;
      }
    }
  }
  return pin;
}

async function guardarPINEnNube(uid, email, pin) {
  if (!SUPA || !CLOUD_MODE) return { success: false };
  try {
    var r = await SUPA.from('pin_lookup').upsert(
      { user_id: uid, user_email: email, pin: pin, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    return { success: !r.error, error: r.error };
  } catch (e) {
    return { success: false, error: e };
  }
}


// ── js/utils/password-hash.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/password-hash.js
//  PBKDF2 + salt random para passwords cacheadas localmente.
//
//  Antes (deuda v37): mt_pass_<base64(email)> = "miPasswordPlain"
//   → cualquiera con acceso al device leía la password directo.
//
//  Ahora (v49): mt_pass_<base64(email)> = JSON.stringify({
//                  v: 1,                              // versión del schema
//                  s: '<salt 16B base64>',
//                  h: '<hash 32B base64>'
//                })
//   → SubtleCrypto PBKDF2-SHA256 con 100k iteraciones
//   → resistente a rainbow tables y a fuerza bruta razonable
//
//  Migración suave: legacyVerifyPassword acepta el formato viejo
//  (string plano) para no romper logins existentes; el callsite
//  re-guarda en formato nuevo en cuanto un login viejo sea exitoso.
// ════════════════════════════════════════════════════════════════

(function () {
  var ITERATIONS = 100000;
  var HASH_BITS = 256;
  var SCHEMA_VERSION = 1;

  function _subtle() {
    return window.crypto && window.crypto.subtle ? window.crypto.subtle : null;
  }
  function _u8ToB64(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function _b64ToU8(b64) {
    var s = atob(b64);
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }

  // Deriva HASH_BITS bits con PBKDF2-SHA256 desde plaintext + salt.
  function _derive(plaintext, salt) {
    var subtle = _subtle();
    if (!subtle) return Promise.reject(new Error('Web Crypto no disponible'));
    var keyData = new TextEncoder().encode(String(plaintext || ''));
    return subtle
      .importKey('raw', keyData, 'PBKDF2', false, ['deriveBits'])
      .then(function (keyMat) {
        return subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
          },
          keyMat,
          HASH_BITS
        );
      })
      .then(function (bits) {
        return new Uint8Array(bits);
      });
  }

  // Hashea un password nuevo. Devuelve string serializable para localStorage.
  // Genera salt random de 16 bytes con crypto.getRandomValues.
  function hashPassword(plaintext) {
    var salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    return _derive(plaintext, salt).then(function (hashU8) {
      return JSON.stringify({
        v: SCHEMA_VERSION,
        s: _u8ToB64(salt),
        h: _u8ToB64(hashU8)
      });
    });
  }

  // Verifica un password contra el blob guardado. Acepta:
  //   · JSON {v, s, h}  → formato nuevo (v49+)
  //   · string plano    → formato legacy (pre-v49), comparación directa
  //
  // El segundo retorno es `legacy: true` cuando se verificó por la rama
  // legacy — el callsite puede usar eso para re-guardar como hash.
  function verifyPassword(plaintext, stored) {
    if (!stored) return Promise.resolve({ ok: false, legacy: false });
    // Formato legacy
    if (typeof stored !== 'string' || stored.charAt(0) !== '{') {
      var ok = String(stored) === String(plaintext);
      return Promise.resolve({ ok: ok, legacy: ok });
    }
    var parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (_) {
      return Promise.resolve({ ok: false, legacy: false });
    }
    if (!parsed || parsed.v !== SCHEMA_VERSION || !parsed.s || !parsed.h) {
      return Promise.resolve({ ok: false, legacy: false });
    }
    var salt = _b64ToU8(parsed.s);
    return _derive(plaintext, salt).then(function (hashU8) {
      // Comparación constante (no crítico para hashes pero buen hábito)
      var stored2 = _b64ToU8(parsed.h);
      if (hashU8.length !== stored2.length) return { ok: false, legacy: false };
      var diff = 0;
      for (var i = 0; i < hashU8.length; i++) diff |= hashU8[i] ^ stored2[i];
      return { ok: diff === 0, legacy: false };
    });
  }

  window.hashPassword = hashPassword;
  window.verifyPassword = verifyPassword;
})();


// ── js/services/supabase.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/supabase.js
//  Helpers CRUD de Supabase
// ════════════════════════════════════════════════════════════════

// Estado de la suscripción Realtime, para el indicador de conexión del
// header. Valores: null | 'CONNECTING' | 'SUBSCRIBED' | 'TIMED_OUT' |
// 'CHANNEL_ERROR' | 'CLOSED'. Es informativo: lo lee getRealtimeStatus().
var _mtRealtimeStatus = null;
function getRealtimeStatus() {
  return _mtRealtimeStatus;
}

function supaSyncDown(uid) {
  if (!SUPA) return Promise.resolve(null);
  return SUPA.auth.getSession().then(function (sres) {
    // Sin sesión autenticada en Supabase (p. ej. se entró por PIN offline
    // tras un signOut global) la nube NO es fuente de verdad: sus queries
    // con RLS devuelven vacío SIN error y borrarían el turno activo y el
    // salario locales. Devolvemos null → cargarDatos cae a los datos locales.
    if (!sres || !sres.data || !sres.data.session) return null;
    return Promise.all([
      SUPA.from('perfiles').select('salario_base').eq('id', uid).maybeSingle(),
      SUPA.from('turnos')
        .select('id,inicio,fin')
        .eq('user_id', uid)
        .order('inicio', { ascending: false })
        .limit(500),
      SUPA.from('turno_activo').select('id,inicio').eq('user_id', uid).maybeSingle()
    ])
      .then(function (results) {
        if (results[0].error || results[1].error) return null;
        if (results[2].error && results[2].error.code !== 'PGRST116') return null;
        var perfil = results[0].data;
        var turnos = (results[1].data || []).map(function (t) {
          return { id: t.id, inicio: t.inicio, fin: t.fin, userId: uid };
        });
        var activoRaw = results[2].data;
        var activo = activoRaw ? { id: activoRaw.id, inicio: activoRaw.inicio, userId: uid } : null;
        // Distinguimos "configurado" de "default": si perfil.salario_base
        // es un número > 0, el usuario lo guardó explícitamente alguna vez
        // (aunque coincida con SMIN actual por casualidad). Esto evita que
        // el banner de "Salario no configurado" aparezca para siempre cuando
        // el SMIN del año sube hasta el valor que el usuario ya tenía.
        var rawSalario = perfil && perfil.salario_base;
        var salarioConfigured = rawSalario != null && Number(rawSalario) > 0;
        var salario = salarioConfigured ? Number(rawSalario) : SMIN;
        return {
          turnos: turnos,
          activo: activo,
          salario: salario,
          salarioConfigured: salarioConfigured
        };
      })
      .catch(function (e) {
        console.warn('[Supa] error:', e);
        return null;
      });
  });
}

function supaSetActivo(uid, activo) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  if (!activo) {
    return SUPA.from('turno_activo')
      .delete()
      .eq('user_id', uid)
      .then(function (res) {
        return { success: !res.error, error: res.error };
      })
      .catch(function (e) {
        return { success: false, error: e };
      });
  }
  return SUPA.from('turno_activo')
    .upsert(
      {
        user_id: uid,
        id: activo.id,
        inicio: activo.inicio,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    ) // Upsert para manejar si ya existe un activo
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaInsertTurno(uid, turno) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .insert({ id: turno.id, user_id: uid, inicio: turno.inicio, fin: turno.fin })
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaDeleteTurno(uid, id) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .eq('id', id)
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaDeleteAllTurnos(uid) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaSetSalario(uid, salario) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  // UPSERT (no UPDATE): si la fila no existe la crea, si existe la actualiza.
  // Antes usábamos .update() y si el perfil no estaba creado, fallaba en
  // silencio — la app marcaba "sincronizado" pero el valor nunca llegaba.
  return SUPA.from('perfiles')
    .upsert(
      { id: uid, salario_base: salario, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// Nueva función para upsert de perfil (usada en sync-queue)
function supaUpsertPerfil(uid, data) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('perfiles')
    .upsert({ id: uid, ...data }, { onConflict: 'id' })
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// ── Suscripción Realtime por usuario ──────────────────────────────
// Escucha cambios en turno_activo y turnos filtrados por user_id y
// dispara onChange(table, payload) por cada evento (INSERT/UPDATE/
// DELETE). Devuelve una función de limpieza. Tolera entornos donde
// SUPA no expone channel() (fallback silencioso).
function supaSubscribeUser(uid, onChange) {
  if (!SUPA || !uid || typeof SUPA.channel !== 'function') return function () {};
  var ch;
  _mtRealtimeStatus = 'CONNECTING';
  try {
    ch = SUPA.channel('mt-user-' + uid)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turno_activo',
          filter: 'user_id=eq.' + uid
        },
        function (payload) {
          try {
            onChange('turno_activo', payload);
          } catch (_) {}
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turnos',
          filter: 'user_id=eq.' + uid
        },
        function (payload) {
          try {
            onChange('turnos', payload);
          } catch (_) {}
        }
      )
      .subscribe(function (status) {
        _mtRealtimeStatus = status;
        if (status === 'SUBSCRIBED') {
          console.log('[MT] Realtime suscrito para', uid);
          // Realtime NUNCA reenvía los eventos perdidos mientras estuvo
          // desconectado. Por eso, en CADA (re)suscripción forzamos un
          // re-fetch completo para reconciliar (best practice Supabase).
          try {
            if (typeof window.__mtResync === 'function') setTimeout(window.__mtResync, 250);
          } catch (_) {}
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[MT] Realtime status:', status);
        }
      });
  } catch (e) {
    _mtRealtimeStatus = 'CHANNEL_ERROR';
    console.warn('[MT] No se pudo iniciar realtime:', e);
    return function () {};
  }
  return function () {
    _mtRealtimeStatus = null;
    try {
      if (ch && SUPA.removeChannel) SUPA.removeChannel(ch);
    } catch (_) {}
  };
}
// Upsert en pin_lookup con onConflict en user_id (UNIQUE), así
// permite cambiar el PIN (PK) sin crear filas duplicadas. Si el
// nuevo PIN ya está tomado por otro usuario, Postgres devuelve
// 23505 que mapeamos a un mensaje claro.
function supaUpdatePinLookup(uid, payload) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('pin_lookup')
    .upsert(
      {
        pin: payload.pin,
        user_email: payload.user_email,
        user_id: uid,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .then(function (res) {
      if (res && res.error) {
        var c = String(res.error.code || '');
        var m = String(res.error.message || '').toLowerCase();
        // 23505 = unique_violation. Si es la PK pin, el PIN está usado.
        // Esto NO debe reintentarse en la cola (el usuario debe elegir
        // otro), pero la cola lo descartará al recibir success:false con
        // un marcador especial — ver processQueue.
        if (c === '23505' || m.indexOf('duplicate') >= 0) {
          return { success: false, error: res.error, permanent: true };
        }
        return { success: false, error: res.error };
      }
      return { success: true };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// ── Propagar cambio de email a pin_lookup + perfiles ─────────────
// auth.users.email es la fuente de verdad pero estas dos tablas
// guardan el email para lookups rápidos. Las actualizamos en
// paralelo; cualquiera puede fallar y reintentarse.
function supaPropagateEmail(uid, payload) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  var ts = new Date().toISOString();
  return Promise.all([
    SUPA.from('pin_lookup')
      .update({ user_email: payload.email, updated_at: ts })
      .eq('user_id', uid),
    SUPA.from('perfiles').update({ email: payload.email, updated_at: ts }).eq('id', uid)
  ])
    .then(function (results) {
      var anyError = results.find(function (r) {
        return r && r.error;
      });
      if (anyError) return { success: false, error: anyError.error };
      return { success: true };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}


// ── js/services/supabase-init.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/supabase-init.js
//  Inicialización del cliente Supabase
// ════════════════════════════════════════════════════════════════
// Inicialización de Supabase
(function initSupabase() {
  try {
    var cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || cfg.url.indexOf('TU_SUPABASE') === 0) {
      console.log('[MT] Modo LOCAL');
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      CLOUD_ERROR = 'SDK no cargó';
      return;
    }

    var supaOpts = {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        storageKey: 'mt-supabase-auth',
        flowType: 'pkce'
      }
    };

    if (IS_IOS_SAFARI) {
      supaOpts.global = {
        fetch: function (url, opts) {
          opts = opts || {};
          opts.cache = 'no-store';
          return fetch(url, opts);
        }
      };
    }

    SUPA = window.supabase.createClient(cfg.url, cfg.anonKey, supaOpts);
    CLOUD_MODE = true;
    console.log('[MT] CLOUD conectado');
  } catch (e) {
    console.error('[MT] Supabase falló:', e);
    SUPA = null;
    CLOUD_MODE = false;
    CLOUD_ERROR = traducirError(e);
  }
})();

window.__cloudReady = (function () {
  if (!CLOUD_MODE || !SUPA) return Promise.resolve(false);
  var timeout = IS_IOS_SAFARI ? 15000 : 6000;
  var maxRetries = IS_IOS_SAFARI ? 2 : 1;
  function intentar(retries) {
    return withTimeout(
      SUPA.auth.getSession().then(function () {
        return true;
      }),
      timeout,
      'Conexión Supabase'
    )
      .then(function () {
        return true;
      })
      .catch(function (e) {
        if (retries > 0) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              intentar(retries - 1).then(resolve);
            }, 1500);
          });
        }
        CLOUD_MODE = false;
        SUPA = null;
        CLOUD_ERROR = traducirError(e);
        return false;
      });
  }
  return intentar(maxRetries);
})();


// ── js/services/error-logger.js ──
var _errorLoggerInit = (function () {
  var queue = [];
  var isProcessing = false;

  function shouldLog(message) {
    if (!message) return false;
    var ignore = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection detected',
      'Script error',
      'undefined is not an object'
    ];
    return !ignore.some(function (pattern) {
      return message.indexOf(pattern) !== -1;
    });
  }

  function getStackTrace(error) {
    if (!error || !error.stack) return '';
    return error.stack.substring(0, 500);
  }

  function logToSupabase(errorData) {
    if (!window.SUPA || !isOnline()) return;

    queue.push(errorData);

    if (isProcessing) return;
    isProcessing = true;

    setTimeout(function () {
      if (queue.length === 0) {
        isProcessing = false;
        return;
      }

      var batch = queue.splice(0, 10);

      window.SUPA.from('error_logs')
        .insert(batch)
        .then(function () {
          isProcessing = false;
          if (queue.length > 0) {
            setTimeout(logToSupabase, 100);
          }
        })
        .catch(function (err) {
          isProcessing = false;
        });
    }, 50);
  }

  window.onerror = function (message, source, lineno, colno, error) {
    if (!shouldLog(message)) return false;

    var uid = null;
    try {
      var sess = leer('mt_sess');
      if (sess) {
        var parsed = JSON.parse(sess);
        uid = parsed.user ? parsed.user.id : null;
      }
    } catch (e) {}

    var errorData = {
      message: String(message).substring(0, 255),
      source: source ? source.split('/').pop() : null,
      line: lineno,
      col: colno,
      stack: getStackTrace(error),
      version: window.MT_APP_VERSION || 'unknown',
      user_id: uid,
      ua: navigator.userAgent.substring(0, 255),
      url: window.location.pathname
    };

    logToSupabase(errorData);

    return false;
  };

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message =
      typeof reason === 'string'
        ? reason
        : reason && reason.message
          ? reason.message
          : String(reason);

    if (!shouldLog(message)) return;

    var uid = null;
    try {
      var sess = leer('mt_sess');
      if (sess) {
        var parsed = JSON.parse(sess);
        uid = parsed.user ? parsed.user.id : null;
      }
    } catch (e) {}

    var errorData = {
      message: 'Unhandled Promise: ' + String(message).substring(0, 220),
      source: 'promise',
      stack: getStackTrace(reason),
      version: window.MT_APP_VERSION || 'unknown',
      user_id: uid,
      ua: navigator.userAgent.substring(0, 255),
      url: window.location.pathname
    };

    logToSupabase(errorData);
  });

  return function () {
    return queue.length;
  };
})();


// ── js/services/session-sync.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/session-sync.js
//  Sincronización de cierre de sesión entre dispositivos
// ════════════════════════════════════════════════════════════════
//
//  Al cerrar sesión en modo global, Supabase revoca los refresh tokens,
//  pero el JWT de acceso de los demás dispositivos sigue siendo válido
//  hasta que caduca (≈1 h). Por eso un dispositivo "no se entera" de
//  inmediato cuando se cierra sesión en otro.
//
//  Este módulo verifica activamente el refresh token contra el servidor.
//  Si fue revocado en otro dispositivo la verificación falla con un
//  error de autenticación y avisamos para cerrar sesión también aquí.
//
//  La verificación se dispara:
//    · al volver la app a primer plano  (visibilitychange → visible)
//    · al recuperar conexión            (online)
//    · de forma periódica con la app visible
//
//  NUNCA cierra sesión por errores de red: el modo offline queda intacto.

(function () {
  var INTERVALO = 120000; // verificación periódica con la app visible (2 min)
  var ANTIREBOTE = 12000; // separación mínima entre verificaciones

  var _ultimaVerif = 0;
  var _verificando = false;
  var _intervalId = null;
  var _activo = false;
  var _alCerrarRemoto = null;

  // Un fallo de red NO debe cerrar la sesión: el usuario simplemente
  // está sin internet y debe poder seguir usando la app offline.
  function _esErrorDeRed(error) {
    if (!error) return false;
    var msg = (error.message || error.toString() || '').toLowerCase();
    return (
      msg.indexOf('fetch') >= 0 ||
      msg.indexOf('network') >= 0 ||
      msg.indexOf('load failed') >= 0 ||
      msg.indexOf('tiempo de espera') >= 0 ||
      msg.indexOf('timeout') >= 0
    );
  }

  // El refresh token fue rechazado/revocado: la sesión ya no es válida.
  function _esErrorDeAuth(error) {
    if (!error) return false;
    var status = error.status;
    if (status === 400 || status === 401 || status === 403) return true;
    var msg = (error.message || '').toLowerCase();
    return (
      msg.indexOf('refresh token') >= 0 ||
      msg.indexOf('refresh_token') >= 0 ||
      msg.indexOf('not found') >= 0 ||
      msg.indexOf('already used') >= 0 ||
      msg.indexOf('session missing') >= 0 ||
      msg.indexOf('revoked') >= 0 ||
      msg.indexOf('invalid') >= 0 ||
      msg.indexOf('expired') >= 0
    );
  }

  // Verifica contra el servidor si la sesión sigue viva.
  //   Promise<true>  → sigue válida, o no se pudo determinar (sin red)
  //   Promise<false> → fue cerrada/revocada en otro dispositivo
  function verificarSesion() {
    if (!CLOUD_MODE || !SUPA || !SUPA.auth) return Promise.resolve(true);
    if (!navigator.onLine) return Promise.resolve(true);

    return SUPA.auth
      .getSession()
      .then(function (g) {
        // Sin sesión local de Supabase: no hay nada que verificar aquí.
        if (!g || !g.data || !g.data.session) return true;

        return withTimeout(SUPA.auth.refreshSession(), 10000, 'Verificación de sesión')
          .then(function (res) {
            if (res && res.error) {
              if (_esErrorDeRed(res.error)) return true;
              if (_esErrorDeAuth(res.error)) return false;
              return true; // error ambiguo → conservador, no cerrar
            }
            if (res && res.data && !res.data.session) return false;
            return true;
          })
          .catch(function () {
            // timeout o caída de red → conservador, no cerramos sesión
            return true;
          });
      })
      .catch(function () {
        return true;
      });
  }

  function _verificar(forzar) {
    if (!_activo || _verificando) return;
    var ahora = Date.now();
    if (!forzar && ahora - _ultimaVerif < ANTIREBOTE) return;
    _ultimaVerif = ahora;
    _verificando = true;
    verificarSesion()
      .then(function (viva) {
        _verificando = false;
        if (!viva && _activo) {
          _activo = false; // evita avisos repetidos
          console.warn('[MT] Sesión cerrada desde otro dispositivo. Cerrando aquí.');
          if (_alCerrarRemoto) _alCerrarRemoto();
        }
      })
      .catch(function () {
        _verificando = false;
      });
  }

  function _onVisibilidad() {
    if (document.visibilityState === 'visible') _verificar(false);
  }
  function _onOnline() {
    _verificar(true);
  }

  // Arranca la vigilancia. callback se invoca si se detecta cierre remoto.
  function startSessionSync(callback) {
    _alCerrarRemoto = callback;
    if (_activo) return;
    _activo = true;
    document.addEventListener('visibilitychange', _onVisibilidad, { passive: true });
    window.addEventListener('online', _onOnline);
    _intervalId = setInterval(function () {
      if (document.visibilityState === 'visible') _verificar(false);
    }, INTERVALO);
    _verificar(true); // verificación inicial al entrar
  }

  function stopSessionSync() {
    _activo = false;
    _alCerrarRemoto = null;
    document.removeEventListener('visibilitychange', _onVisibilidad);
    window.removeEventListener('online', _onOnline);
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  }

  window.startSessionSync = startSessionSync;
  window.stopSessionSync = stopSessionSync;
  window.verificarSesion = verificarSesion;
})();


// ── js/services/calculator.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/calculator.js
//  Motor de cálculo de turnos y recargos
// ════════════════════════════════════════════════════════════════

// NOTA: El objeto RC ya está definido globalmente en js/config/globals.js
// No se debe re-definir aquí para evitar sobrescribir la configuración.

function calcCats(inicio, fin, minsOrd) {
  var cats = {
    diurnaOrd: 0,
    noctOrd: 0,
    diurnaFest: 0,
    noctFest: 0,
    extraDiurna: 0,
    extraNoct: 0,
    extraFestDiur: 0,
    extraFestNoct: 0
  };
  var current = new Date(inicio.getTime());
  var remainingOrd = minsOrd;
  while (current < fin) {
    var nextBoundary = new Date(current.getTime());
    if (current.getHours() < 6) nextBoundary.setHours(6, 0, 0, 0);
    else if (current.getHours() < 21) nextBoundary.setHours(21, 0, 0, 0);
    else {
      // Corte en medianoche para re-evaluar estado festivo del nuevo día
      nextBoundary.setDate(nextBoundary.getDate() + 1);
      nextBoundary.setHours(0, 0, 0, 0);
    }
    var chunkEnd = new Date(Math.min(nextBoundary.getTime(), fin.getTime()));
    var minsInChunk = (chunkEnd - current) / 60000;
    if (minsInChunk > 0) {
      var isNight = current.getHours() >= 21 || current.getHours() < 6;
      var isHoliday = esFest(current);
      var isExtra = remainingOrd <= 0;
      if (!isExtra) {
        if (isHoliday) isNight ? (cats.noctFest += minsInChunk) : (cats.diurnaFest += minsInChunk);
        else isNight ? (cats.noctOrd += minsInChunk) : (cats.diurnaOrd += minsInChunk);
        remainingOrd -= minsInChunk;
      } else {
        if (isHoliday)
          isNight ? (cats.extraFestNoct += minsInChunk) : (cats.extraFestDiur += minsInChunk);
        else isNight ? (cats.extraNoct += minsInChunk) : (cats.extraDiurna += minsInChunk);
      }
    }
    current = chunkEnd;
  }
  return cats;
}

function doCalc(turnos, activo, ahoraRef, vh) {
  var todos = activo
    ? turnos.concat([{ id: activo.id, inicio: activo.inicio, fin: ahoraRef.toISOString() }])
    : turnos.slice();
  // Agrupar por semana: el límite ordinario de cada turno es min(8h/día, saldo semanal 46h)
  // Esto cubre tanto el extra diario (CST Art.159) como el límite semanal (Ley 2101/2021)
  var semMap = {};
  todos.forEach(function (t) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push(t);
  });
  var tMins = 0,
    tCOP = 0,
    bd = {};
  Object.keys(RC).forEach(function (k) {
    bd[k] = { mins: 0, cop: 0 };
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60; // saldo semanal según Ley 2101/2021
    ts.forEach(function (t) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin || ahoraRef);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var mOrd = Math.min(8 * 60, semOrd); // el que se agote primero manda
      var cats = calcCats(ini, fin, mOrd);
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          var c = (m / 60) * vh * RC[rk].factor;
          bd[rk].mins += m;
          bd[rk].cop += c;
          tMins += m;
          tCOP += c;
        }
      });
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
    });
  });
  return { totalMins: tMins, totalCOP: tCOP, bd: bd };
}

// Ingreso por turno respetando el límite semanal (mismo algoritmo y orden
// que doCalc). Cada turno recibe su contribución marginal: el primero de la
// semana consume las horas ordinarias y los siguientes caen en extra. Por
// eso la suma de todos los turnos COINCIDE con doCalc — a diferencia de
// calcular cada turno aislado (que reinicia el saldo semanal y subestima
// los recargos). Devuelve { byId, total }.
function doCalcPerTurno(turnos, vh) {
  var byId = {};
  var total = 0;
  var semMap = {};
  turnos.forEach(function (t, idx) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push({ t: t, idx: idx });
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.t.inicio) - new Date(b.t.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60;
    ts.forEach(function (item) {
      var t = item.t;
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var mOrd = Math.min(8 * 60, semOrd);
      var cats = calcCats(ini, fin, mOrd);
      var bd = {};
      var cop = 0,
        mins = 0;
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          var c = (m / 60) * vh * RC[rk].factor;
          bd[rk] = { mins: m, cop: c };
          cop += c;
          mins += m;
        }
      });
      var key = t.id != null ? t.id : 'idx_' + item.idx;
      byId[key] = { cop: cop, mins: mins, bd: bd };
      total += cop;
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
    });
  });
  return { byId: byId, total: total };
}

function calcPorDia(turnos, vh) {
  var dias = {};
  // Mismo enfoque combinado: min(8h/día, saldo semanal 46h)
  var semMap = {};
  turnos.forEach(function (t) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push(t);
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60;
    ts.forEach(function (t) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var k =
        ini.getFullYear() +
        '-' +
        String(ini.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(ini.getDate()).padStart(2, '0');
      if (!dias[k])
        dias[k] = { fecha: k, mins: 0, cop: 0, fest: esFest(ini), noct: esNoct(ini), turnos: 0 };
      var mOrd = Math.min(8 * 60, semOrd);
      var cats = calcCats(ini, fin, mOrd);
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          dias[k].mins += m;
          dias[k].cop += (m / 60) * vh * RC[rk].factor;
        }
      });
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
      dias[k].turnos++;
    });
  });
  return Object.values(dias).sort(function (a, b) {
    return a.fecha.localeCompare(b.fecha);
  });
}


// ── js/services/quincena.js ──
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


// ── js/services/data.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/data.js
//  CRUD de datos local/nube
// ════════════════════════════════════════════════════════════════
function cargarDatos(uid, pinOnly) {
  if (!uid) return Promise.reject(new Error('UID requerido'));
  var getLocal = function () {
    var t = validarTurnos(leer(dk(uid, 't'), []), uid);
    var a = validarTurnoActivo(leer(dk(uid, 'a'), null), uid);
    var s = leer(dk(uid, 's'), SMIN);
    return { turnos: t, activo: a, salario: s };
  };
  if (!CLOUD_MODE || pinOnly || !SUPA) return Promise.resolve(getLocal());
  return withTimeout(supaSyncDown(uid), 8000, 'sync')
    .then(function (remote) {
      if (!remote) return getLocal();
      var remoteTurnos = (remote.turnos || []).filter(function (t) {
        return t.userId === uid;
      });
      if (remote.activo && remote.activo.userId !== uid) remote.activo = null;
      var localTurnos = validarTurnos(leer(dk(uid, 't'), []), uid);
      var remoteIds = new Set(
        remoteTurnos.map(function (t) {
          return t.id;
        })
      );
      var merged = remoteTurnos.concat(
        localTurnos.filter(function (t) {
          return !remoteIds.has(t.id);
        })
      );
      grabar(dk(uid, 't'), merged);
      if (remote.activo) grabar(dk(uid, 'a'), remote.activo);
      else borrarKey(dk(uid, 'a'));

      // ── Resolución de conflictos para SALARIO ──
      // Si el usuario marcó su salario como configurado localmente
      // (flag 'sc'), local es la fuente de verdad — no dejamos que
      // un cloud desactualizado lo arrastre hacia atrás.
      // Esto resuelve el bug donde editar el salario en Ajustes no
      // se aplicaba al estimado tras un reload: cargarDatos pulía
      // siempre el valor remoto sobre el local recién guardado.
      var localSalario = leer(dk(uid, 's'), null);
      var localConfigured = leer(dk(uid, 'sc'), false) === true;
      var finalSalario = remote.salario;
      var pushBackToCloud = false;

      if (localConfigured && localSalario && Number(localSalario) > 0) {
        // Local manda — y si difiere del remoto, programamos un push
        if (Number(localSalario) !== Number(remote.salario)) {
          finalSalario = Number(localSalario);
          pushBackToCloud = true;
        } else {
          finalSalario = Number(localSalario);
        }
      }
      grabar(dk(uid, 's'), finalSalario);

      if (pushBackToCloud) {
        // Fire-and-forget: no bloqueamos la carga
        try {
          if (typeof supaSetSalario === 'function') {
            supaSetSalario(uid, finalSalario).catch(function () {});
          }
        } catch (_) {}
      }

      return {
        turnos: merged,
        activo: remote.activo,
        salario: finalSalario,
        // El flag remoto solo es útil si local NO está marcado todavía:
        // el usuario puede haber pulsado en este device → local manda.
        // Pero si local nunca fue tocado en este device, el flag remoto
        // nos dice si fue configurado desde OTRO device (incluyendo
        // dominios distintos como github.io vs vercel.app).
        salarioConfigured: remote.salarioConfigured === true
      };
    })
    .catch(function (e) {
      console.warn('[MT] fallback local:', e.message);
      return getLocal();
    });
}

function insertTurno(uid, inicio) {
  return Promise.resolve({
    id: generateUUID(),
    inicio: inicio,
    userId: uid
  });
}


// ── js/services/backup.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/backup.js
//  Respaldo y restauración de datos locales
//  Exporta localStorage a un archivo .json y permite restaurarlo.
//  100% offline · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── EXPORTAR RESPALDO ────────────────────────────────────────
// Recolecta todas las claves mt_* de localStorage y las empaqueta
// en un archivo .json que se descarga automáticamente.
function backupExport() {
  try {
    var data = {};
    var count = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('mt_') === 0) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (_) {
          data[key] = localStorage.getItem(key);
        }
        count++;
      }
    }

    if (count === 0) {
      alert('No hay datos para respaldar. Registrá algunos turnos primero.');
      return false;
    }

    var backup = {
      app: 'mi-turno',
      version: typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'v95',
      date: new Date().toISOString(),
      keys: count,
      data: data
    };

    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'mi-turno-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    alert('Error al crear el respaldo: ' + (err.message || err));
    return false;
  }
}

// ─── IMPORTAR RESPALDO ────────────────────────────────────────
// Abre un selector de archivos, valida el .json y restaura los datos.
// callback(isSuccess, message) se llama al finalizar.
function backupImport(callback) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';

  input.onchange = function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) {
      if (callback) callback(false, 'No se seleccionó ningún archivo.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var backup = JSON.parse(ev.target.result);

        // Validar estructura
        if (!backup || backup.app !== 'mi-turno' || !backup.data || typeof backup.data !== 'object') {
          if (callback) callback(false, 'El archivo no es un respaldo válido de Mi Turno.');
          return;
        }

        var keys = Object.keys(backup.data);
        if (keys.length === 0) {
          if (callback) callback(false, 'El respaldo está vacío.');
          return;
        }

        // Confirmación antes de sobrescribir
        var confirmed = confirm(
          '¿Restaurar este respaldo?\n\n' +
          '📅 Fecha: ' + (backup.date ? new Date(backup.date).toLocaleString('es-CO') : 'Desconocida') + '\n' +
          '📦 Versión: ' + (backup.version || 'Desconocida') + '\n' +
          '🔑 Datos: ' + keys.length + ' registros\n\n' +
          '⚠️ Esto reemplazará tus datos actuales. La app se recargará.'
        );

        if (!confirmed) {
          if (callback) callback(false, 'Restauración cancelada.');
          return;
        }

        // Restaurar
        var restored = 0;
        var failed = 0;
        for (var i = 0; i < keys.length; i++) {
          try {
            var val = backup.data[keys[i]];
            var str = typeof val === 'string' ? val : JSON.stringify(val);
            localStorage.setItem(keys[i], str);
            restored++;
          } catch (_) {
            failed++;
          }
        }

        // Guardar timestamp de última restauración
        try {
          localStorage.setItem('mt_backup_restored', new Date().toISOString());
        } catch (_) {}

        if (callback) callback(true, 'Se restauraron ' + restored + ' registros' + (failed > 0 ? ' (' + failed + ' errores)' : '') + '.');
      } catch (err) {
        if (callback) callback(false, 'El archivo no es un JSON válido.');
      }
    };

    reader.onerror = function () {
      if (callback) callback(false, 'No se pudo leer el archivo.');
    };

    reader.readAsText(file);
  };

  // Trigger click
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// ─── RECORDATORIO DE RESPALDO ─────────────────────────────────
// Sugiere respaldar cada 15 días. Devuelve true si toca recordar.
function backupShouldRemind() {
  try {
    var lastBackup = localStorage.getItem('mt_backup_exported');
    var lastRestore = localStorage.getItem('mt_backup_restored');
    var last = lastBackup || lastRestore;
    if (!last) return true; // nunca respaldó

    var lastDate = new Date(last);
    var now = new Date();
    var days = (now - lastDate) / (1000 * 60 * 60 * 24);
    return days >= 15;
  } catch (_) {
    return false;
  }
}

// Marcar que ya se respaldó (para el recordatorio)
function backupMarkExported() {
  try {
    localStorage.setItem('mt_backup_exported', new Date().toISOString());
  } catch (_) {}
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] backup.js cargado');


// ── js/services/ai-nlp.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-nlp.js
//  Motor NLP mejorado — v76
//  Comprensión de lenguaje natural en español colombiano.
//  100% offline · ES5 · sin dependencias externas.
//
//  Capacidades:
//    · Clasificación de intenciones por puntaje ponderado
//    · Stemming español simplificado
//    · Stop words + tokenización
//    · Similitud de Jaccard para matching difuso
//    · Tolerancia a typos (Levenshtein para palabras cortas)
//    · Estado conversacional multi-turno
//    · Detección de tono emocional (empatía contextual)
// ════════════════════════════════════════════════════════════════

// ─── STOP WORDS ESPAÑOL ───────────────────────────────────────
var AI_STOP = {
  'a':1,'ante':1,'bajo':1,'cabe':1,'con':1,'contra':1,'de':1,'del':1,
  'desde':1,'durante':1,'en':1,'entre':1,'hacia':1,'hasta':1,'mediante':1,
  'para':1,'por':1,'según':1,'sin':1,'sobre':1,'tras':1,
  'el':1,'la':1,'los':1,'las':1,'un':1,'una':1,'unos':1,'unas':1,
  'lo':1,'le':1,'les':1,'se':1,'su':1,'sus':1,'mi':1,'mis':1,
  'tu':1,'tus':1,'yo':1,'me':1,'te':1,'nos':1,'os':1,
  'que':1,'cual':1,'cuales':1,'quien':1,'quienes':1,'cuyo':1,'cuya':1,
  'donde':1,'cuando':1,'como':1,'cuanto':1,'cuanta':1,'cuantos':1,
  'es':1,'son':1,'fue':1,'era':1,'está':1,'esta':1,'estoy':1,
  'hay':1,'tiene':1,'tengo':1,'hacer':1,'ser':1,'estar':1,
  'más':1,'mas':1,'menos':1,'muy':1,'tan':1,'tanto':1,'poco':1,
  'sí':1,'si':1,'no':1,'ya':1,'aún':1,'aun':1,'solo':1,'sólo':1,
  'todo':1,'toda':1,'algo':1,'nada':1,'cada':1,'otro':1,'otra':1,
  'pero':1,'porque':1,'pues':1,'aunque':1,'asi':1,'así':1,
  'ahora':1,'hoy':1,'ayer':1,'mañana':1,'siempre':1,'nunca':1,
  'bueno':1,'buena':1,'mal':1,'malo':1,'mejor':1,'peor':1,
  'puede':1,'puedo':1,'puedes':1,'podria':1,'podrías':1,'quisiera':1,
  'dame':1,'di':1,'dime':1,'decir':1,'saber':1,'quiero':1,'necesito':1,
  'porfa':1,'porfi':1,'gracias':1,'hola':1,'buenas':1,'buenos':1,
  'a':1,'o':1,'y':1,'e':1,'ni':1,'al':1,'del':1
};

// ─── STEMMING ESPAÑOL SIMPLIFICADO ─────────────────────────────
// Reduce palabras a su raíz aproximada para mejorar matching.
// No es un stemmer completo (Porter), pero cubre los sufijos
// más comunes en el dominio de nómina y conversación.
function aiStem(w) {
  if (w.length <= 3) return w;
  // Plurales
  if (w.slice(-2) === 'es') w = w.slice(0, -2);
  else if (w.slice(-1) === 's' && w.slice(-2, -1) !== 'e') w = w.slice(0, -1);
  // Verbos comunes: gerundios y participios
  if (w.slice(-4) === 'ando' || w.slice(-4) === 'iendo') w = w.slice(0, -4);
  else if (w.slice(-3) === 'ado' || w.slice(-3) === 'ido') w = w.slice(0, -3);
  // Diminutivos coloquiales colombianos
  if (w.slice(-4) === 'ito ' || w.slice(-4) === 'ita ') w = w.slice(0, -4);
  else if (w.slice(-3) === 'ito' || w.slice(-3) === 'ita') w = w.slice(0, -3);
  // Superlativos
  if (w.slice(-5) === 'ísimo' || w.slice(-5) === 'ísima') w = w.slice(0, -5);
  // Verbos conjugados comunes (-ar, -er, -ir)
  if (w.length > 5) {
    if (w.slice(-2) === 'ar' || w.slice(-2) === 'er' || w.slice(-2) === 'ir') {
      // No reducir si es palabra corta tipo "dar", "ser", "ir"
    }
  }
  return w;
}

// ─── TOKENIZACIÓN ──────────────────────────────────────────────
// Convierte texto en array de stems, filtrando stop words
function aiTokenize(text) {
  var raw = (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[¿¡?!;:,.()[\]"'\u201c\u201d\u2018\u2019]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  var words = raw.split(' ');
  var tokens = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (!w || w.length < 2) continue;
    if (AI_STOP[w]) continue;
    tokens.push(aiStem(w));
  }
  return tokens;
}

// ─── SIMILITUD DE JACCARD ─────────────────────────────────────
// Compara dos conjuntos de tokens. Valor entre 0 y 1.
function aiJaccard(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  var intersection = 0;
  var union = {};
  for (var i = 0; i < tokensA.length; i++) {
    union[tokensA[i]] = 1;
  }
  for (var j = 0; j < tokensB.length; j++) {
    if (union[tokensB[j]]) {
      intersection++;
      union[tokensB[j]] = 2; // marcado como compartido
    } else {
      union[tokensB[j]] = 1;
    }
  }
  // Contar unión real
  var unionCount = 0;
  for (var k in union) {
    if (union.hasOwnProperty(k)) unionCount++;
  }
  return unionCount > 0 ? intersection / unionCount : 0;
}

// ─── DISTANCIA LEVENSHTEIN ────────────────────────────────────
// Tolerancia a typos para palabras cortas (≤5 caracteres)
function aiLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  var m = a.length;
  var n = b.length;
  var d = [];
  for (var i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (var j = 0; j <= n; j++) {
    d[0][j] = j;
  }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // borrar
        d[i][j - 1] + 1,       // insertar
        d[i - 1][j - 1] + cost // reemplazar
      );
    }
  }
  return d[m][n];
}

// ¿Coincide con tolerancia de 1 error para palabras cortas?
function aiFuzzyMatch(word, target) {
  if (word === target) return true;
  if (Math.abs(word.length - target.length) > 1) return false;
  if (word.length <= 5 && aiLevenshtein(word, target) <= 1) return true;
  return false;
}

// ─── DICCIONARIO DE SINÓNIMOS ────────────────────────────────
// Expande términos a su forma canónica para mejorar matching
var AI_SYNONYMS = {
  'plata': 'dinero',
  'billete': 'dinero',
  'lucas': 'dinero',
  'guita': 'dinero',
  'cobro': 'pago',
  'cobre': 'pago',
  'sueldo': 'salario',
  'nomina': 'salario',
  'laburo': 'trabajo',
  'chamba': 'trabajo',
  'camello': 'trabajo',
  'jornada': 'turno',
  'descanso': 'descansar',
  'pausa': 'descansar',
  'reposo': 'descansar',
  'cansado': 'fatiga',
  'agotado': 'fatiga',
  'reventado': 'fatiga',
  'mamado': 'fatiga',
  'rendir': 'productividad',
  'rendimiento': 'productividad',
  'finde': 'fin de semana',
  'findesemana': 'fin de semana',
  'finde semana': 'fin de semana',
  'feriado': 'festivo',
  'festividad': 'festivo',
  'proye': 'proyeccion',
  'proyecto': 'proyeccion',
  'estimado': 'proyeccion',
  'comparar': 'comparativa',
  'comparacion': 'comparativa',
  'diferencia': 'comparativa',
  'vs': 'comparativa',
  'versus': 'comparativa',
  'resumen': 'total',
  'balance': 'total',
  'cuentas': 'total',
  'numeros': 'total',
  'estadisticas': 'stats',
  'datos': 'stats',
  'info': 'stats',
  'envio': 'email',
  'correo': 'email',
  'mandar': 'email',
  'reporte': 'email',
  'informe': 'email',
  'jefe': 'email',
  'empresa': 'email',
  'admin': 'email',
  'salud': 'bienestar',
  'bien': 'bienestar',
  'sano': 'bienestar',
  'consejo': 'tip',
  'recomendacion': 'tip',
  'sugerencia': 'tip',
  'aconsejar': 'tip',
  'ahorrar': 'ahorro',
  'meta': 'ahorro',
  'objetivo': 'ahorro',
  'llegar': 'ahorro',
  'falta': 'ahorro',
  'cuanto falta': 'ahorro'
};

function aiExpandSynonym(w) {
  return AI_SYNONYMS[w] || w;
}

// ─── INTENTS ──────────────────────────────────────────────────
// Cada intent tiene:
//   id: identificador único
//   keywords: array de [palabra, peso]
//   context: opcional, array de keywords que deben estar en
//            el estado conversacional previo
// Los pesos: 3 = muy específico, 2 = relevante, 1 = débil
var AI_INTENTS = [
  // ── Conversacionales ──
  { id: 'saludo', kw: [['hola',3],['holi',3],['buen dia',3],['buenos dias',3],['buenas tardes',3],['buenas noches',3],['que tal',3],['como vas',3],['como va',3],['hey',3],['alo',3],['saludo',3],['buenas',3]] },
  { id: 'despedida', kw: [['adios',3],['chao',3],['hasta luego',3],['nos vemos',3],['bye',3],['me voy',3],['hasta pronto',3]] },
  { id: 'agradecimiento', kw: [['gracias',3],['genial',3],['excelente',3],['perfecto',3],['que bien',3],['buenisimo',3],['buen trabajo',3],['gracias totales',3]] },
  { id: 'identidad', kw: [['quien eres',3],['que eres',3],['como te llamas',3],['nombre',2],['quien sos',3],['que haces',2],['para que servis',3],['para que sirves',3]] },
  { id: 'capacidades', kw: [['que sabes hacer',3],['que podes hacer',3],['que puedes hacer',3],['capacidades',3],['skills',3],['funciones',3],['que sabes',3]] },

  // ── Nómina / Dinero ──
  { id: 'total_ganado', kw: [['cuanto gane',3],['cuanto gané',3],['cuanto he ganado',3],['cuanto llevo',3],['total ganado',3],['total mes',3],['ingreso',2],['cuanto dinero',3],['cuanta plata',3],['cuanto cobro',3],['cuanto cobre',3],['balance',2],['resumen',2],['mis numeros',3]] },
  { id: 'hoy', kw: [['hoy',3],['este dia',3],['que tal hoy',3],['como me fue hoy',3],['cuanto hoy',3],['dia de hoy',3]] },
  { id: 'ayer', kw: [['ayer',3],['dia anterior',3],['como me fue ayer',3],['cuanto ayer',3],['y ayer',3]] },
  { id: 'proyeccion', kw: [['proyeccion',3],['proyectar',3],['cuanto al final',3],['al cierre',3],['estimado',2],['cuanto voy a ganar',3],['fin de mes',2],['cuanto al terminar',3],['al final del mes',3]] },
  { id: 'horas_trabajadas', kw: [['cuantas horas',3],['horas trabajadas',3],['tiempo trabajado',3],['total horas',3],['cuanto tiempo',2],['horas totales',3]] },
  { id: 'promedio', kw: [['promedio',3],['media',2],['promedio por turno',3],['promedio diario',3],['cuanto gano por dia',3],['por turno',2],['por dia',2]] },

  // ── Comparativas ──
  { id: 'comparativa_mes', kw: [['mes pasado',3],['vs mes',3],['comparar mes',3],['mejor que mes',3],['peor que mes',3],['vs el mes',3],['comparativa',2],['diferencia con',2],['contra mes',3]] },
  { id: 'comparativa_semana', kw: [['semana pasada',3],['vs semana',3],['esta semana',3],['comparar semana',3],['semana anterior',3]] },

  // ── Días específicos ──
  { id: 'mejor_dia', kw: [['mejor dia',3],['dia mas productivo',3],['dia que mas gane',3],['dia que mas gané',3],['record',2],['mejor jornada',3],['tope',2]] },
  { id: 'peor_dia', kw: [['peor dia',3],['dia mas bajo',3],['dia que menos',3],['jornada mas corta',3]] },
  { id: 'turno_largo', kw: [['turno mas largo',3],['jornada mas larga',3],['turno largo',2],['maxima duracion',3]] },
  { id: 'turno_corto', kw: [['turno mas corto',3],['turno mas breve',3],['jornada corta',3],['minima duracion',3]] },

  // ── Rachas y patrones ──
  { id: 'racha', kw: [['racha',3],['dias seguidos',3],['dias consecutivos',3],['cuantos dias sin parar',3],['seguidos',2]] },
  { id: 'distribucion', kw: [['distribucion',3],['porcentaje',2],['desglose',3],['donde va',3],['por categoria',3],['como se reparte',3]] },
  { id: 'velocidad', kw: [['velocidad',3],['cop por hora',3],['cuanto gano por hora',3],['ritmo',2],['tasa',2],['eficiencia',2]] },

  // ── Simulación ──
  { id: 'simulacion', kw: [['si trabajo',3],['si hago',3],['si meto',3],['cuanto si',3],['cuanto ganaria',3],['cuanto ganaría',3],['horas mas',3],['adicional',2],['extra',2],['simular',3],['que pasaria',3],['que pasaría',3]] },

  // ── Festivos ──
  { id: 'festivos', kw: [['festivo',3],['festivos',3],['proximo festivo',3],['proximos festivos',3],['cuando es festivo',3],['feriado',3],['feriados',3],['que dias son festivos',3]] },

  // ── Bienestar / Fatiga ──
  { id: 'bienestar', kw: [['cansado',3],['fatiga',3],['descanso',2],['bienestar',3],['salud',3],['agotado',3],['reventado',3],['mamado',3],['estres',3],['estresado',3],['burnout',3],['como estoy',2]] },

  // ── Liquidación ──
  { id: 'liquidacion', kw: [['liquidacion',3],['liquidación',3],['prestaciones',3],['neto',2],['cuanto me liquidan',3],['cesantias',3],['cesantías',3],['prima',2],['vacaciones',2],['descuento',2],['deduccion',2],['deducción',2],['salario neto',3]] },

  // ── Ley / Normativa ──
  { id: 'ley', kw: [['ley',3],['normativa',3],['jornada maxima',3],['jornada máxima',3],['horas legales',3],['cuantas horas permite',3],['limite',2],['legal',2],['2101',3],['cst',3],['codigo laboral',3]] },

  // ── Ahorro / Meta ──
  { id: 'ahorro', kw: [['ahorro',3],['ahorrar',3],['meta',2],['objetivo',2],['cuanto necesito',3],['cuanto debo trabajar',3],['cuantas horas para',3],['cuanto falta para',3],['para llegar a',3]] },

  // ── Email ──
  { id: 'email', kw: [['enviar',2],['correo',3],['email',3],['mandar',2],['reporte',3],['informe',3],['jefe',2],['empresa',2],['admin',2],['envia',3],['envia mi',3],['enviame',3]] },
  { id: 'correo_formal', kw: [['redacta',3],['redactar',3],['correo formal',3],['carta',2],['escribi',3],['escribe',3],['componer',3],['borrador',3]] },

  // ── Ayuda ──
  { id: 'ayuda_app', kw: [['como usar',3],['como funciona',3],['como inicio',3],['como registrar',3],['tutorial',3],['guia',3],['guía',3],['explicame',3],['explicame',3],['no entiendo',3]] },

  // ── Stats rápido ──
  { id: 'stats', kw: [['stats',3],['estadisticas',3],['estadísticas',3],['datos rapidos',3],['datos rápidos',3],['resumen rapido',3],['resumen rápido',3],['cifras',3]] }
];

// ─── ESTADO CONVERSACIONAL ────────────────────────────────────
var _aiConv = {
  lastIntent: null,
  lastTopic: null,
  turnCount: 0,
  contextHints: [],
  askedFollowUp: false
};

function aiGetConv() {
  return _aiConv;
}

function aiResetConv() {
  _aiConv.lastIntent = null;
  _aiConv.lastTopic = null;
  _aiConv.turnCount = 0;
  _aiConv.contextHints = [];
  _aiConv.askedFollowUp = false;
}

// ─── CLASIFICADOR DE INTENCIONES ─────────────────────────────
// Analiza el texto y devuelve { intent, score, confidence, tokens }
// score: puntaje bruto del mejor intent
// confidence: score normalizado (0-1) considerando cantidad de tokens
function aiClassify(text, convState, userContext) {
  var tokens = aiTokenize(text);
  if (!tokens.length) {
    return { intent: null, score: 0, confidence: 0, tokens: tokens, topic: null };
  }

  // Expandir sinónimos en los tokens
  var expandedTokens = tokens.map(function (t) {
    return aiExpandSynonym(t);
  });

  var bestIntent = null;
  var bestScore = 0;
  var secondScore = 0;

  // Evaluar cada intent contra los tokens expandidos
  for (var i = 0; i < AI_INTENTS.length; i++) {
    var intent = AI_INTENTS[i];
    var score = 0;
    var maxPossible = 0;
    var textStr = ' ' + text.toLowerCase() + ' ';

    for (var j = 0; j < intent.kw.length; j++) {
      var kw = intent.kw[j][0];
      var weight = intent.kw[j][1];
      maxPossible += weight;

      // Buscar la keyword completa (frase) en el texto original
      if (textStr.indexOf(' ' + kw + ' ') >= 0) {
        score += weight * 1.5; // bonus por frase exacta
      } else {
        // Buscar palabras individuales de la keyword en los tokens expandidos
        var kwWords = kw.split(' ');
        var kwMatchCount = 0;
        for (var w = 0; w < kwWords.length; w++) {
          var kwStem = aiStem(kwWords[w]);
          for (var t = 0; t < expandedTokens.length; t++) {
            if (expandedTokens[t] === kwStem || aiFuzzyMatch(expandedTokens[t], kwStem)) {
              kwMatchCount++;
              break;
            }
          }
        }
        // Puntaje proporcional a cuántas palabras de la keyword matchearon
        if (kwMatchCount > 0) {
          score += weight * (kwMatchCount / kwWords.length) * 0.7;
        }
      }
    }

    // Bonus por contexto conversacional
    if (convState && convState.lastTopic) {
      var topicBonus = _aiTopicBonus(intent.id, convState.lastTopic);
      score += topicBonus;
    }

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestIntent = intent;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Calcular confianza: diferencia entre el mejor y el segundo,
  // normalizada por el puntaje máximo posible
  var margin = bestScore - secondScore;
  var confidence = bestScore > 0 ? Math.min(1, (bestScore / 9) * (0.5 + margin / (bestScore + 0.01))) : 0;

  // Si hay un intent por contexto conversacional que es muy probable
  if (!bestIntent && convState && convState.lastIntent) {
    confidence = 0.15;
    bestIntent = { id: 'contexto', kw: [] };
  }

  return {
    intent: bestIntent ? bestIntent.id : null,
    score: bestScore,
    confidence: confidence,
    tokens: tokens,
    topic: bestIntent ? _aiIntentTopic(bestIntent.id) : null
  };
}

// ─── MAPEO INTENT → TOPIC ────────────────────────────────────
function _aiIntentTopic(intentId) {
  var map = {
    'saludo': 'conversacion',
    'despedida': 'conversacion',
    'agradecimiento': 'conversacion',
    'identidad': 'conversacion',
    'capacidades': 'conversacion',
    'total_ganado': 'dinero',
    'hoy': 'dinero',
    'ayer': 'dinero',
    'proyeccion': 'dinero',
    'horas_trabajadas': 'tiempo',
    'promedio': 'dinero',
    'comparativa_mes': 'comparativa',
    'comparativa_semana': 'comparativa',
    'mejor_dia': 'patrones',
    'peor_dia': 'patrones',
    'turno_largo': 'patrones',
    'turno_corto': 'patrones',
    'racha': 'patrones',
    'distribucion': 'patrones',
    'velocidad': 'patrones',
    'simulacion': 'dinero',
    'festivos': 'informacion',
    'bienestar': 'salud',
    'liquidacion': 'dinero',
    'ley': 'informacion',
    'ahorro': 'dinero',
    'email': 'accion',
    'correo_formal': 'accion',
    'ayuda_app': 'informacion',
    'stats': 'dinero'
  };
  return map[intentId] || 'general';
}

// ─── BONUS POR CONTEXTO ──────────────────────────────────────
// Si el usuario preguntó sobre dinero y luego dice "¿y ayer?",
// el intent "ayer" recibe bonus porque sigue en contexto dinero
function _aiTopicBonus(intentId, lastTopic) {
  var topic = _aiIntentTopic(intentId);
  if (topic === lastTopic && topic !== 'conversacion') return 2;
  if (topic === 'dinero' && lastTopic === 'comparativa') return 1;
  if (topic === 'comparativa' && lastTopic === 'dinero') return 1;
  if (topic === 'patrones' && lastTopic === 'dinero') return 1;
  return 0;
}

// ─── DETECCIÓN DE TONO EMOCIONAL ─────────────────────────────
// Analiza el texto y el contexto del usuario para ajustar
// el nivel de empatía en la respuesta.
// Devuelve { mood, intensity, hints }
function aiDetectMood(text, userContext) {
  var t = (text || '').toLowerCase();
  var mood = 'neutral';
  var intensity = 0;
  var hints = [];

  // Señales de frustración / cansancio
  var frustKW = ['cansado','cansada','agotado','agotada','reventado','mamado','mamada',
                  'estresado','estresada','mal','fatal','horrible','no puedo mas',
                  'no doy mas','hasta aqui','hasta aquí','rendido','rendida','duro','pesado'];
  var positiveKW = ['bien','genial','excelente','feliz','contento','contenta','motivado',
                     'motivada','animado','animada','bacan','bacano','chevere','chévere',
                     'buenisimo','orgulloso','orgullosa'];
  var worriedKW = ['preocupado','preocupada','inseguro','insegura','duda','confundido',
                    'confundida','no se','no sé','ayuda','auxilio','socorro'];

  for (var i = 0; i < frustKW.length; i++) {
    if (t.indexOf(frustKW[i]) >= 0) { mood = 'frustrado'; intensity += 2; hints.push('fatiga'); break; }
  }
  for (var j = 0; j < worriedKW.length; j++) {
    if (t.indexOf(worriedKW[j]) >= 0) { if (mood === 'neutral') mood = 'preocupado'; intensity += 1; hints.push('inseguridad'); break; }
  }
  for (var k = 0; k < positiveKW.length; k++) {
    if (t.indexOf(positiveKW[k]) >= 0) { if (mood === 'neutral' || mood === 'preocupado') mood = 'positivo'; intensity += 1; hints.push('motivacion'); break; }
  }

  // Contexto del usuario: racha larga sin descanso
  if (userContext && userContext.rachaActual >= 7) {
    if (mood === 'neutral') mood = 'frustrado';
    intensity += 1;
    hints.push('racha_larga');
  }
  // Contexto: hora de madrugada
  if (userContext && userContext.ahora) {
    var h = new Date(userContext.ahora).getHours();
    if (h >= 0 && h < 5) {
      intensity += 1;
      hints.push('madrugada');
    }
  }
  // Contexto: burnout
  if (userContext && userContext.burnout) {
    intensity += 2;
    hints.push('burnout');
    if (mood === 'neutral') mood = 'frustrado';
  }

  return { mood: mood, intensity: Math.min(intensity, 5), hints: hints };
}

// ─── VARIANTES DE RESPUESTA EMPÁTICA ─────────────────────────
// Prefijos y sufijos que se añaden según el tono emocional
var AI_EMPATHY = {
  frustrado: {
    prefixes: [
      'Te escucho. ',
      'Qué duro, parce. ',
      'Uff, te entiendo. ',
      'Fuerza con eso. ',
      'No es fácil, lo sé. ',
      'Ánimo, que ya pasaste varias así. '
    ],
    suffixes: [
      ' ¿Querés que veamos cuándo fue tu último descanso?',
      ' Si necesitás bajar el ritmo, tus números igual están bien.',
      ' Cuidate, ¿vale? Que la máquina también necesita pausa.',
      ' Estoy acá para lo que necesités.'
    ]
  },
  positivo: {
    prefixes: [
      '¡Qué energía! ',
      'Esa es la actitud. ',
      'Me encanta leerte así. ',
      '¡Vamos por más! ',
      'Qué bueno verte con ese ánimo. '
    ],
    suffixes: [
      ' ¡Seguí así que vas volando! 🚀',
      ' Esos números van a estar lindos este mes.',
      ' ¿Vamos por un récord?'
    ]
  },
  preocupado: {
    prefixes: [
      'Tranqui, vamos por partes. ',
      'No te preocupés, todo tiene solución. ',
      'Respirá hondo, acá estoy. ',
      'Vamos a resolverlo juntos. '
    ],
    suffixes: [
      ' ¿Querés que te explique algo en específico?',
      ' Decime qué necesitás y te ayudo.',
      ' No hay pregunta tonta, preguntá con confianza.'
    ]
  },
  neutral: {
    prefixes: [
      '',
      'Dale, ',
      'A ver, ',
      'Mirá, '
    ],
    suffixes: [
      '',
      ' ¿Algo más en lo que te pueda ayudar?',
      ' ✦'
    ]
  }
};

function aiPickEmpathy(prefixes) {
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}

// ─── RESPUESTA CONVERSACIONAL (FALLBACK) ──────────────────────
// Cuando ninguna intención tiene suficiente confianza,
// se genera una respuesta conversacional genérica pero cálida
function aiConversationalFallback(text, userContext) {
  var t = (text || '').toLowerCase();
  var mood = aiDetectMood(text, userContext);

  // Si el texto es muy corto, es probable que sea un intento de charla
  if (t.length < 10) {
    var cortas = [
      'Contame más, ¿qué querés saber?',
      'No te entendí bien. ¿Me lo decís de otra forma?',
      'Podés preguntarme de tu salario, tus horas, tus recargos... lo que necesités.',
      'Estoy acá. ¿En qué te puedo ayudar?'
    ];
    return aiPickEmpathy(mood.mood === 'neutral' ? AI_EMPATHY.neutral.prefixes : AI_EMPATHY[mood.mood].prefixes) +
           cortas[Math.floor(Math.random() * cortas.length)];
  }

  // Respuesta más completa para textos largos que no matchean
  var generales = [
    'Mmm, no estoy seguro de haber entendido bien. Te cuento lo que sí puedo responder:\n\n📊 **Tu mes:** cuánto ganaste, cuántas horas, proyección al cierre\n📈 **Comparativas:** vs mes pasado, vs semana pasada\n🔮 **Simulaciones:** "¿cuánto si trabajo 4h más?"\n📅 **Festivos:** próximos, cuántos caen este mes\n🧘 **Bienestar:** cómo está tu ritmo, si necesitás descanso\n📧 **Reportes:** "enviá mi reporte por correo"\n\n💡 Probá con cualquiera de esas, ¡o preguntame con tus palabras!',
    'Perdón, no capté bien la pregunta. Pero no te vayás — puedo ayudarte con:\n\n• Tu salario del mes y proyección\n• Comparativas con meses o semanas anteriores\n• Simulaciones de horas extra\n• Próximos festivos\n• Consejos de descanso\n• Envío de reportes por email\n\n¿Por dónde le damos?',
    'Uy, me perdí un poco. ¿Me lo preguntás de otra manera? Mientras tanto, te tiro ideas de lo que sé hacer:\n\n💰 Calcular tus ingresos con recargos\n📊 Comparar semanas y meses\n🎯 Proyectar al cierre del mes\n📅 Ver próximos festivos\n📧 Enviar reportes\n\n¿Cuál te sirve?'
  ];

  var prefix = '';
  if (mood.mood !== 'neutral') {
    prefix = aiPickEmpathy(AI_EMPATHY[mood.mood].prefixes);
  }

  return prefix + generales[Math.floor(Math.random() * generales.length)];
}

// ─── SEGUIMIENTO CONVERSACIONAL ──────────────────────────────
// Sugiere una pregunta de seguimiento según el último intent
function aiSuggestFollowUp(lastIntent, userContext) {
  var followUps = {
    'total_ganado': [
      '¿Querés ver la comparativa con el mes pasado?',
      '¿Te muestro la proyección al cierre?',
      '¿Vemos cómo vas vs tu meta?'
    ],
    'hoy': [
      '¿Y ayer cómo te fue?',
      '¿Querés comparar con tu mejor día?',
      '¿Vemos la proyección al cierre del mes?'
    ],
    'comparativa_mes': [
      '¿Querés ver también la comparativa semanal?',
      '¿Te muestro tu mejor día del mes?',
      '¿Calculamos cuánto te falta para la meta?'
    ],
    'bienestar': [
      '¿Querés ver cuándo fue tu último día libre?',
      '¿Te muestro tu racha actual?',
      '¿Revisamos tus horas semanales?'
    ],
    'proyeccion': [
      '¿Querés simular cuánto ganarías con horas extra?',
      '¿Vemos tu distribución de recargos?',
      '¿Te muestro cuánto te falta para la meta?'
    ],
    'default': [
      '¿Necesitás algo más?',
      '¿Querés que profundice en algo?',
      '¿Te ayudo con otra cosa?',
      '¿Alguna otra duda?'
    ]
  };

  var opts = followUps[lastIntent] || followUps['default'];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── API PÚBLICA ─────────────────────────────────────────────
// Funciones expuestas como globales (window.*) para que ai.js las use

// Clasificar intención de un mensaje
function aiClassifyIntent(text, convState, userContext) {
  return aiClassify(text, convState || _aiConv, userContext || {});
}

// Obtener/actualizar estado conversacional
function aiGetConversation() {
  return _aiConv;
}

function aiUpdateConversation(intent, topic) {
  _aiConv.lastIntent = intent;
  _aiConv.lastTopic = topic;
  _aiConv.turnCount++;
}

// Detectar tono emocional
function aiAnalyzeMood(text, userContext) {
  return aiDetectMood(text, userContext);
}

// Obtener prefijo/sufijo empático
function aiEmpatheticPrefix(mood) {
  var m = mood || 'neutral';
  var entry = AI_EMPATHY[m] || AI_EMPATHY['neutral'];
  return aiPickEmpathy(entry.prefixes);
}

function aiEmpatheticSuffix(mood) {
  var m = mood || 'neutral';
  var entry = AI_EMPATHY[m] || AI_EMPATHY['neutral'];
  return aiPickEmpathy(entry.suffixes);
}

// Respuesta conversacional de fallback
function aiFallbackResponse(text, userContext) {
  return aiConversationalFallback(text, userContext);
}

// Sugerir seguimiento
function aiFollowUp(lastIntent, userContext) {
  return aiSuggestFollowUp(lastIntent, userContext);
}

// Tokenizar (útil para debug)
function aiDebugTokens(text) {
  return aiTokenize(text);
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-nlp.js cargado — NLP mejorado v76');


// ── js/services/ai.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai.js
//  Motor de IA local 100% offline · 50+ capacidades
//  Sin red, sin LLM, sin dependencias externas
// ════════════════════════════════════════════════════════════════

// ─── NLP HELPERS ───────────────────────────────────────────────

function _aiNorm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿¡?!;:()[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _aiHas(t) {
  for (var i = 1; i < arguments.length; i++) {
    if (t.indexOf(arguments[i]) >= 0) return true;
  }
  return false;
}

function _aiAll(t, arr) {
  for (var i = 0; i < arr.length; i++) if (t.indexOf(arr[i]) < 0) return false;
  return true;
}

// Extrae primer número en texto. Soporta dígitos y palabras (uno..diez)
function _aiNum(t) {
  // Limpiar formato de moneda común en Colombia (puntos de miles)
  var clean = t.replace(/\./g, '').replace(/,/g, '.');
  var m = clean.match(/(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);

  // Mapeo de palabras a números
  var w = {
    cero: 0,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    veinte: 20,
    treinta: 30
  };
  for (var k in w) {
    if (t.indexOf(k) >= 0) return w[k];
  }
  return null;
}

// ─── VARIACIÓN DE FRASES CONVERSACIONALES ────────────────────
var _aiPhraseVariants = {
  total: [
    'Te cuento cómo vas:',
    'Esto es lo que llevas:',
    'Aquí van tus números:',
    'Así vas este mes:',
    'Vamos a ver...',
    'Mira esto:'
  ],
  comparativa: [
    'Mira la comparativa:',
    'Te pongo los números lado a lado:',
    'Así se ve la diferencia:',
    'Comparando ambos periodos:'
  ],
  consejo: [
    'Un tip rápido:',
    'Te recomiendo:',
    'Mi sugerencia:',
    'Para mejorar:',
    'Algo que podrías hacer:'
  ]
};

function _aiPickPhrase(category) {
  var opts = _aiPhraseVariants[category] || [''];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── PREGUNTAS DE SEGUIMIENTO CONVERSACIONALES ─────────────────
var _aiFollowUps = {
  salario: [
    '¿Quieres saber cuánto te falta para la meta? 🤔',
    '¿Te gustaría ver cómo subir ese número con nocturnas o extras?'
  ],
  extra: [
    '¿Quieres el detalle de cuánto suman esas extras por tipo?',
    '¿Te gustaría saber cómo se comparan con el mes pasado?'
  ],
  nocturn: [
    '¿Sabías que con 20h nocturnas extra podrías sumar bastante más?',
    '¿Quieres ver cuánto ganarías si haces solo turnos nocturnos?'
  ],
  festiv: [
    '¿Quieres saber cuáles son los próximos festivos que se vienen?',
    '¿Te gustaría planear tus turnos para esos días?'
  ],
  proyecc: [
    '¿Quieres que calcule escenarios optimista y pesimista?',
    '¿Te gustaría saber cuánto necesitas trabajar para llegar a una meta específica?'
  ],
  resumen: [
    '¿Quieres comparar con el mes pasado?',
    '¿Necesitas algún detalle más específico?',
    '¿Te gustaría que envíe esto por correo?'
  ],
  hola: [
    '¿Qué quieres saber hoy?',
    '¿Te ayudo con tu mes, tus ingresos o algo más?',
    'Dime, ¿cómo van los turnos?'
  ],
  descanso: [
    '¿Te gustaría que te recuerde cuándo fue tu último día libre?',
    '¿Quieres calcular cuánto has descansado este mes?'
  ],
  default: [
    '¿Necesitas algo más?',
    '¿Quieres profundizar en algún dato?',
    'Dime si quieres que calcule algo más.',
    '¿Te sirve esa info o necesitas otra cosa?'
  ]
};

function _aiPickFollowUp(intent) {
  var opts = _aiFollowUps[intent] || _aiFollowUps['default'];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── CONSTRUCCIÓN DE CONTEXTO ──────────────────────────────────

function buildContext(state) {
  var ahora = new Date();
  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  var diaActual = ahora.getDate();
  var vh = state.vh || 0;
  var salario = state.salario || SMIN;

  // Turnos del mes (state.turnos viene filtrado por mes)
  var turnosMes = (state.turnos || []).filter(function (t) {
    return new Date(t.inicio) >= iniMes && t.fin;
  });

  // Turnos absolutos (todos): usado para mes/semana pasados
  var turnosAll = state.turnosAll || state.turnos || [];

  // ── Mes actual ──
  var dias = calcPorDia(turnosMes, vh);
  var totalMins = state.calc.totalMins,
    totalCOP = state.calc.totalCOP;
  var diasTrab = dias.length;
  var prom = diasTrab > 0 ? totalCOP / diasTrab : 0;
  var promHoras = diasTrab > 0 ? totalMins / diasTrab / 60 : 0;
  var mejor =
    dias.length > 0
      ? dias.reduce(function (a, b) {
        return b.cop > a.cop ? b : a;
      }, dias[0])
      : null;
  var peor =
    dias.length > 0
      ? dias.reduce(function (a, b) {
        return b.cop < a.cop ? b : a;
      }, dias[0])
      : null;
  var festTrab = dias.filter(function (d) {
    return d.fest;
  });
  var bd = state.calc.bd;
  // Helper para acceso seguro a los recargos (evita TypeError)
  var _get = function (k, p) { return (bd[k] || {})[p] || 0; };

  var nocturnasMins =
    _get('noctOrd', 'mins') + _get('extraNoct', 'mins') +
    _get('noctFest', 'mins') + _get('extraFestNoct', 'mins');
  var nocturnasCOP =
    _get('noctOrd', 'cop') + _get('extraNoct', 'cop') +
    _get('noctFest', 'cop') + _get('extraFestNoct', 'cop');
  var festMins =
    _get('diurnaFest', 'mins') + _get('noctFest', 'mins') +
    _get('extraFestDiur', 'mins') + _get('extraFestNoct', 'mins');
  var festCOP =
    _get('diurnaFest', 'cop') + _get('noctFest', 'cop') +
    _get('extraFestDiur', 'cop') + _get('extraFestNoct', 'cop');
  var extraMins =
    _get('extraDiurna', 'mins') + _get('extraNoct', 'mins') +
    _get('extraFestDiur', 'mins') + _get('extraFestNoct', 'mins');
  var extraCOP =
    _get('extraDiurna', 'cop') + _get('extraNoct', 'cop') +
    _get('extraFestDiur', 'cop') + _get('extraFestNoct', 'cop');

  var diurnaOrdMins = _get('diurnaOrd', 'mins'),
    diurnaOrdCOP = _get('diurnaOrd', 'cop');

  var proy = diasTrab > 0 ? (totalCOP / diaActual) * diasMes : 0;
  var pctSalario = salario > 0 ? (totalCOP / salario) * 100 : 0;
  var falta = Math.max(0, salario - totalCOP);
  var horasParaMeta = vh > 0 ? falta / vh : 0;

  // ── Mes pasado ──
  var iniMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  finMesPasado.setHours(23, 59, 59, 999);
  var turnosMesPasado = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniMesPasado && d <= finMesPasado && t.fin;
  });
  var calcMesPasado =
    turnosMesPasado.length > 0
      ? doCalc(turnosMesPasado, null, finMesPasado, vh)
      : { totalMins: 0, totalCOP: 0, bd: {} };
  var diasTrabMesPasado = calcPorDia(turnosMesPasado, vh).length;

  // ── Semana actual (Lun-Dom) ──
  var iniSemana = semLun(ahora);
  var turnosSemana = turnosMes.filter(function (t) {
    return new Date(t.inicio) >= iniSemana;
  });
  var diasSemana = calcPorDia(turnosSemana, vh);
  var totalCOPSemana = diasSemana.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var totalMinsSemana = diasSemana.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Semana pasada ──
  var iniSemPas = new Date(iniSemana);
  iniSemPas.setDate(iniSemana.getDate() - 7);
  var finSemPas = new Date(iniSemana);
  finSemPas.setMilliseconds(-1);
  var turnosSemPas = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniSemPas && d <= finSemPas && t.fin;
  });
  var diasSemPas = calcPorDia(turnosSemPas, vh);
  var totalCOPSemPas = diasSemPas.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var totalMinsSemPas = diasSemPas.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Hoy / Ayer ──
  var hoyIni = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var ayerIni = new Date(hoyIni);
  ayerIni.setDate(hoyIni.getDate() - 1);
  var turnosHoy = turnosMes.filter(function (t) {
    return new Date(t.inicio) >= hoyIni;
  });
  var turnosAyer = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= ayerIni && d < hoyIni && t.fin;
  });
  var diasHoy = calcPorDia(turnosHoy, vh);
  var diasAyer = calcPorDia(turnosAyer, vh);
  var copHoy = diasHoy.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var minsHoy = diasHoy.reduce(function (a, d) {
    return a + d.mins;
  }, 0);
  var copAyer = diasAyer.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var minsAyer = diasAyer.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Turno más largo / corto ──
  var tLargo = null,
    tCorto = null;
  turnosMes.forEach(function (t) {
    var dur = (new Date(t.fin) - new Date(t.inicio)) / 60000;
    if (dur <= 0) return;
    if (!tLargo || dur > tLargo.dur) tLargo = { t: t, dur: dur };
    if (!tCorto || dur < tCorto.dur) tCorto = { t: t, dur: dur };
  });

  // ── Patrón día de semana y horas valle ──
  var dowMins = [0, 0, 0, 0, 0, 0, 0],
    dowCOP = [0, 0, 0, 0, 0, 0, 0],
    dowCount = [0, 0, 0, 0, 0, 0, 0];
  dias.forEach(function (d) {
    var dt = new Date(d.fecha + 'T12:00:00');
    var dow = (dt.getDay() + 6) % 7;
    var dMins = d.mins || 0;
    dowMins[dow] += dMins;
    dowCOP[dow] += d.cop;
    dowCount[dow]++;
  });
  var bestDow = 0,
    worstDow = -1;
  for (var i = 1; i < 7; i++) {
    if (dowCOP[i] > dowCOP[bestDow]) bestDow = i;
    if (dowCOP[i] > 0 && (worstDow < 0 || dowCOP[i] < dowCOP[worstDow])) worstDow = i;
  }
  if (worstDow < 0) worstDow = 0;

  // ── Próximos festivos del año ──
  var festSet = getColombianHolidays(ahora.getFullYear());
  var proxFests = [];
  var probe = new Date(ahora);
  probe.setHours(0, 0, 0, 0);
  probe.setDate(probe.getDate() + 1);
  for (var n = 0; n < 366 && proxFests.length < 5; n++) {
    var key = probe.getFullYear() + '-' + probe.getMonth() + '-' + probe.getDate();
    if (festSet.has(key) && probe.getDay() !== 0) proxFests.push(new Date(probe));
    probe.setDate(probe.getDate() + 1);
    if (probe.getFullYear() !== ahora.getFullYear()) break;
  }

  // ── Velocidad efectiva (COP por hora trabajada real) ──
  var copPorHoraReal = totalMins > 0 ? totalCOP / (totalMins / 60) : vh;

  // ── Racha actual (días consecutivos trabajando, contando hacia atrás) ──
  var rachaActual = 0;
  var probeR = new Date(ahora);

  for (var k = 0; k < diasMes; k++) {
    var keyR =
      probeR.getFullYear() +
      '-' +
      String(probeR.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(probeR.getDate()).padStart(2, '0');
    var trabajado = dias.some(function (d) {
      return d.fecha === keyR;
    });
    // La racha se rompe al primer día sin trabajo registrado
    if (!trabajado) break;
    rachaActual++;
    probeR.setDate(probeR.getDate() - 1);
  }

  // ── Estimación de Liquidación Proporcional (CST Colombia) ──
  var diasMesEfectivos = Math.max(1, diaActual);
  var estPrima = (salario * diasMesEfectivos) / 360;
  var estCesantias = (salario * diasMesEfectivos) / 360;
  var estIntereses = (estCesantias * diasMesEfectivos * 0.12) / 360;
  var estVacaciones = (salario * diasMesEfectivos) / 720;
  // Auxilio de transporte: usa la constante global definida en js/config/globals.js
  var estTransporte = totalCOP > (SMIN * 2) ? 0 : (AUX_TRANSPORTE_2026 * diasMesEfectivos / 30);
  var totalLiq = estPrima + estCesantias + estIntereses + estVacaciones + estTransporte;

  // Descuentos de ley (Salud 4% + Pensión 4% = 8%)
  var deducciones = totalCOP * 0.08;
  var sueldoNeto = totalCOP - deducciones + estTransporte;

  // ── Análisis de Bienestar ──
  // Alerta si el promedio semanal supera las 46h o si hay racha de 6+ días
  var hrsSemanales = (totalMins / 60) / (diaActual / 7);
  var alertaFatiga = hrsSemanales > 48 || rachaActual >= 6;

  // ── Días hábiles restantes (no domingos ni festivos del calendario laboral, contando todos) ──
  var diasRestantes = diasMes - diaActual;

  return {
    // Tiempo
    // 📚 Diccionario para Programar (Base de Conocimiento Admin)
    _dictionary: {
      // Anatomía y Estructura
      'html': 'HTML: Es el esqueleto. index.html es la puerta de entrada principal.',
      'css': 'CSS: Es la ropa y estilos. Tu app usa 38 archivos CSS para ser modular.',
      'js': 'JavaScript: El cerebro. 39 archivos JS manejan la lógica y Supabase.',
      'sw.js': 'Service Worker: Asistente fantasma. Maneja el modo offline y el caché persistente. ¡Cuidado con el caché viejo!',
      'manifest.json': 'Configura la instalación como PWA (icono, nombre, colores de tema).',
      'package.json': 'Lista de "ingredientes" y librerías del proyecto.',
      'estructura.md': 'Tu mapa interno que explica la fragmentación en 77 archivos.',
      'base': 'Carpeta css/base/: Reglas fundamentales (colores, reset, tipografía).',
      'layout': 'Carpeta css/layout/: Cómo se acomodan las cosas (header, scroll, botones de acción).',
      'components': 'Carpeta css/components/: Bloques reutilizables (tarjetas, botones, inputs).',
      'utils': 'Carpeta js/utils/: Funciones pequeñas (formato de moneda, haptic, red).',
      'sync-queue.js': 'Cola de sincronización: Guarda cambios offline y los sube a Supabase cuando hay conexión.',
      'services': 'Carpeta js/services/: Conexiones externas (Supabase, Calculadora, IA).',
      'tabs': 'Carpeta js/tabs/: Las 5 pantallas principales de la interfaz.',
      'app': 'Carpeta js/app/: Componentes de alto nivel (Root, Auth, AppMain).',

      // Conceptos Web
      'pwa': 'Progressive Web App: Web que se siente como app (instalable + offline).',
      'cache': 'Memoria temporal. El nivel de Service Worker es el más terco.',
      'cdn': 'Red de servidores que sirven librerías como React o Chart.js rápidamente.',
      '404': 'Error: No existe. El archivo no se encuentra en la ruta especificada.',
      '500': 'Error de servidor: Algo falló en la nube o en la lógica de Vercel.',
      'modular': 'Muchos archivos pequeños vs uno gigante. Facilita el mantenimiento.',
      'frontend': 'Lo que el usuario ve y toca (HTML/CSS/JS).',
      'backend': 'Lo que no se ve (Supabase: Base de datos y Auth).',
      'react': 'Librería de UI. Describe los componentes y React los actualiza automáticamente.',

      // Git y Vercel
      'git': 'Control de versiones. Commit (foto), Branch (rama), Push (subir), Pull (bajar).',
      'commit': 'Un "punto de guardado" en la historia de tu código.',
      'branch': 'Rama: Línea paralela de desarrollo (ej: ajustes, main).',
      'revert': 'Deshacer un cambio creando un commit nuevo que anula el anterior.',
      'reset': 'Mover la historia hacia atrás. Peligroso si ya hiciste Push.',
      'vercel': 'Donde vive tu app. Despliega automáticamente desde GitHub.',
      'deployment': 'Una versión publicada de tu app. Son inmutables.',
      'rollback': 'Volver a una versión anterior que funcionaba bien.',

      // DevTools
      'devtools': 'F12: Herramienta detective. Console (errores), Network (peticiones), Application (SW/Storage).',
      'console': 'Donde JavaScript grita sus errores. Mira aquí primero.',
      'network': 'Muestra qué archivos cargan. Rojo = Fallo (404 o red).',
      'application': 'Usa esta pestaña para borrar el Service Worker (Unregister) si nada actualiza.',
    },
    // Mapa Estructural para Consultas de Desarrollo
    _devMap: {
      'emoji': 'Lógica visual: js/tabs/home.js (botones) o js/utils/icons.js (SVG de navegación).',
      'luna': 'Modo oscuro: js/tabs/home.js (icono) y estilos en css/modals/dark-overrides.css.',
      'color': 'Modifica css/base/variables.css para temas globales o el CSS específico en css/components/.',
      'boton': 'Estilos: css/layout/action-button.css. Lógica de inicio: js/tabs/home.js.',
      'calculo': 'Toda la lógica matemática reside en js/services/calculator.js.',
      'supabase': 'Configuración en js/config.js y helpers en js/services/supabase.js.',
      'login': 'Pantalla de acceso en js/app/auth-screen.js y estilos en css/components/auth-screen.css.',
      'error': 'Logger en js/utils/error-logger.js y visor en js/modals/error-viewer.js.',
      'pdf': 'Generación de documentos en js/services/export-files.js.',
      'ia': 'Este motor reside en js/services/ai.js.',
      'infra': 'Verifica js/config.js. En Vercel, revisa las Env Variables. En Supabase, revisa las políticas RLS.',
      'vercel': 'Si la app no carga: 1. Revisa las "Environment Variables" en el dashboard de Vercel. 2. Verifica si el Service Worker (sw.js) está cacheando una versión vieja.',
      'red': 'Usa navigator.onLine para detectar cortes. Errores de "Failed to fetch" suelen ser CORS o falta de internet.'
    },
    // Guía de resolución de problemas técnicos
    _troubleshooting: {
      'supabase_auth': 'Si falla el login: Revisa si el email está confirmado en Supabase Auth o si las políticas de la tabla "perfiles" permiten la lectura.',
      'supabase_db': 'Si no guarda datos: Revisa la consola de errores (🐞). Si ves "PGRST116", es que el registro no existe. Si es "403", es un problema de RLS.',
      'vercel_deploy': 'Si ves un error 500 en Vercel: Revisa los logs de las Edge Functions en el dashboard. Suele ser una variable de entorno faltante.',
      'network_offline': 'La app detecta estado offline. Los cambios se guardarán en localStorage (js/utils/storage.js) y se sincronizarán al volver la red.',
      'cors': 'Si ves errores de CORS: Asegúrate de que el dominio de Vercel esté en la lista blanca de "Allowed Origins" en el dashboard de Supabase (API Settings).'
    },
    ahora: ahora,
    diasMes: diasMes,
    diaActual: diaActual,
    diasRestantes: diasRestantes,
    // Configuración
    salario: salario,
    vh: vh,
    // Mes actual
    turnosMes: turnosMes,
    dias: dias,
    totalMins: totalMins,
    totalCOP: totalCOP,
    diasTrab: diasTrab,
    prom: prom,
    promHoras: promHoras,
    mejor: mejor,
    peor: peor,
    bd: bd,
    diurnaOrdMins: diurnaOrdMins,
    diurnaOrdCOP: diurnaOrdCOP,
    nocturnasMins: nocturnasMins,
    nocturnasCOP: nocturnasCOP,
    festMins: festMins,
    festCOP: festCOP,
    festTrab: festTrab,
    extraMins: extraMins,
    extraCOP: extraCOP,
    proy: proy,
    pctSalario: pctSalario,
    falta: falta,
    horasParaMeta: horasParaMeta,
    // Mes pasado
    totalCOPMesPasado: calcMesPasado.totalCOP || 0,
    totalMinsMesPasado: calcMesPasado.totalMins || 0,
    diasMesPasado: diasTrabMesPasado,
    // Semana actual
    totalCOPSemana: totalCOPSemana,
    totalMinsSemana: totalMinsSemana,
    diasSemanaCount: diasSemana.length,
    // Semana pasada
    totalCOPSemPas: totalCOPSemPas,
    totalMinsSemPas: totalMinsSemPas,
    diasSemPasCount: diasSemPas.length,
    // Hoy / ayer
    copHoy: copHoy,
    minsHoy: minsHoy,
    turnosHoy: turnosHoy.length,
    copAyer: copAyer,
    minsAyer: minsAyer,
    turnosAyer: turnosAyer.length,
    // Turnos extremo
    tLargo: tLargo,
    tCorto: tCorto,
    // Patrones
    dowMins: dowMins,
    dowCOP: dowCOP,
    dowCount: dowCount,
    bestDow: bestDow,
    worstDow: worstDow,
    // Festivos / extras
    proxFests: proxFests,
    copPorHoraReal: copPorHoraReal,
    // Rachas
    rachaActual: rachaActual,
    // Finanzas y Salud
    totalLiq: totalLiq,
    estPrima: estPrima,
    estCesantias: estCesantias,
    estVacaciones: estVacaciones,
    estTransporte: estTransporte,
    deducciones: deducciones,
    sueldoNeto: sueldoNeto,
    burnout: alertaFatiga,
    hrsSemanales: hrsSemanales
  };
}

// ─── HELPERS DE FORMATO ────────────────────────────────────────

var _DOW = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function _fechaLarga(fechaISO) {
  var d = new Date(fechaISO + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function _bdLines(bd) {
  return Object.keys(bd)
    .filter(function (k) {
      return bd[k].mins > 0;
    })
    .map(function (k) {
      return '• ' + RC[k].label + ': ' + fCOP(bd[k].cop) + ' (' + fDur(bd[k].mins) + ')';
    })
    .join('\n');
}

function _trend(curr, prev) {
  if (prev <= 0) return curr > 0 ? '+∞%' : 'sin cambio';
  var pct = ((curr - prev) / prev) * 100;
  var sig = pct >= 0 ? '+' : '';
  return sig + pct.toFixed(1) + '%';
}

// ─── DESPACHADOR NLP (v76) ─────────────────────────────────────
// Mapea intents clasificados por ai-nlp.js a respuestas.
// Solo se invoca cuando la confianza del clasificador es ≥0.5.
// Si un intent no está mapeado, devuelve null → cae al sistema clásico.
function _aiDispatchNLP(intent, c, state, q, t) {
  // ── Conversacionales ──
  if (intent === 'saludo') {
    var h = c.ahora.getHours();
    var s = h < 12 ? '¡Buenos días' : h < 19 ? '¡Buenas tardes' : '¡Buenas noches';
    var nm = state.session && state.session.email ? state.session.email.split('@')[0] : '';
    var nombre = nm ? ', ' + nm.charAt(0).toUpperCase() + nm.slice(1) : '';
    return s + nombre + '! ☀️ Soy tu copiloto de turno. Puedo decirte cómo vas este mes, proyectar tus ingresos, calcular tu liquidación o avisarte si necesitás un descanso. ¿Qué querés mirar hoy?';
  }
  if (intent === 'despedida') {
    var despedidas = [
      '¡Nos vemos! Cuidate y descansá cuando puedas. ✦',
      'Chao, parce. Acá estoy cuando me necesités. 💪',
      '¡Hasta luego! Que te rinda el día. 🌟'
    ];
    return despedidas[Math.floor(Math.random() * despedidas.length)];
  }
  if (intent === 'agradecimiento') {
    var gracias = [
      '¡Con gusto! Para eso estoy. 🙌',
      'De nada, parce. Lo que necesités. ✨',
      'A la orden. ¿Algo más en que te ayude?'
    ];
    return gracias[Math.floor(Math.random() * gracias.length)];
  }
  if (intent === 'identidad') {
    return 'Soy tu asistente de nómina 100% local. Vivo en tu dispositivo, no envío tus datos a ningún lado. Conozco la Ley 2101/2021, los recargos colombianos, los festivos y tu historial de turnos. 🇨🇴';
  }
  if (intent === 'capacidades') {
    return 'Estas son mis capacidades:\n\n💰 **Finanzas:** sueldo neto, liquidación, proyección\n⚖️ **Legal:** Ley 2101, recargos, auxilio de transporte\n📊 **Estadísticas:** KPIs, comparativas, rachas\n🔮 **Simulaciones:** ¿cuánto si trabajo X horas más?\n📅 **Festivos:** próximos, cuántos este mes\n🧘 **Bienestar:** análisis de fatiga, recomendaciones\n📧 **Reportes:** envío de PDF/Excel por correo';
  }

  // ── Dinero ──
  if (intent === 'total_ganado') {
    return 'Este mes llevás **' + fCOP(c.totalCOP) + '** brutos, en ' + c.diasTrab + ' turnos.\n\n' +
      _bdLines(c.bd) + '\n\n' +
      '📊 Vas al ' + c.pctSalario.toFixed(1) + '% de tu salario base.\n' +
      '🔮 Proyección al cierre: **' + fCOP(c.proy) + '**\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('total_ganado') : '');
  }
  if (intent === 'hoy') {
    if (c.turnosHoy === 0) return 'Hoy no registraste turnos todavía. ¿Arrancamos? 🚀';
    return 'Hoy llevás **' + fCOP(c.copHoy) + '** en ' + fDur(c.minsHoy) + ' repartidos en ' + c.turnosHoy + ' turno' + (c.turnosHoy !== 1 ? 's' : '') + '.\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('hoy') : '');
  }
  if (intent === 'ayer') {
    if (c.turnosAyer === 0) return 'Ayer no tuviste turnos registrados.';
    return 'Ayer hiciste **' + fCOP(c.copAyer) + '** en ' + fDur(c.minsAyer) + ' con ' + c.turnosAyer + ' turno' + (c.turnosAyer !== 1 ? 's' : '') + '.';
  }
  if (intent === 'proyeccion') {
    return '🔮 Al cierre del mes proyectás **' + fCOP(c.proy) + '**.\n\n' +
      '• Días trabajados: ' + c.diasTrab + ' de ' + c.diasMes + '\n' +
      '• Promedio por turno: ' + fCOP(c.prom) + '\n' +
      '• Días restantes: ' + c.diasRestantes + '\n\n' +
      '💰 Eso es el ' + c.pctSalario.toFixed(1) + '% de tu salario base.\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('proyeccion') : '');
  }
  if (intent === 'horas_trabajadas') {
    return '⏱ Llevás **' + fDur(c.totalMins) + '** este mes (' + (c.totalMins / 60).toFixed(1) + ' horas).\n\n' +
      '• Promedio por turno: ' + (c.promHoras).toFixed(1) + 'h\n' +
      '• Horas nocturnas: ' + fDur(c.nocturnasMins) + '\n' +
      '• Horas festivas: ' + fDur(c.festMins) + '\n' +
      '• Horas extra: ' + fDur(c.extraMins);
  }
  if (intent === 'promedio') {
    return '📊 Tu promedio es de **' + fCOP(c.prom) + '** por turno (' + c.promHoras.toFixed(1) + 'h).\n\n' +
      '• Mejor día: ' + (c.mejor ? fCOP(c.mejor.cop) + ' el ' + _fechaLarga(c.mejor.fecha) : '—') + '\n' +
      '• COP por hora real: ' + fCOP(c.copPorHoraReal);
  }

  // ── Comparativas ──
  if (intent === 'comparativa_mes') {
    if (c.totalCOPMesPasado === 0) return 'No tengo datos del mes pasado para comparar.';
    return '📊 **Este mes vs mes pasado:**\n\n' +
      '• Este mes: ' + fCOP(c.totalCOP) + ' en ' + fDur(c.totalMins) + '\n' +
      '• Mes pasado: ' + fCOP(c.totalCOPMesPasado) + ' en ' + fDur(c.totalMinsMesPasado) + '\n' +
      '• Tendencia: ' + _trend(c.totalCOP, c.totalCOPMesPasado);
  }
  if (intent === 'comparativa_semana') {
    return '📊 **Esta semana vs pasada:**\n\n' +
      '• Esta semana: ' + fCOP(c.totalCOPSemana) + ' en ' + fDur(c.totalMinsSemana) + '\n' +
      '• Semana pasada: ' + fCOP(c.totalCOPSemPas) + ' en ' + fDur(c.totalMinsSemPas) + '\n' +
      '• Tendencia: ' + _trend(c.totalCOPSemana, c.totalCOPSemPas);
  }

  // ── Patrones ──
  if (intent === 'mejor_dia') {
    if (!c.mejor) return 'Aún no tengo datos para identificar tu mejor día.';
    return '🏆 Tu mejor día fue el **' + _fechaLarga(c.mejor.fecha) + '** con **' + fCOP(c.mejor.cop) + '**. ¡Qué jornada!';
  }
  if (intent === 'peor_dia') {
    if (!c.peor) return 'Aún no tengo datos para identificar tu peor día.';
    return 'Tu día más bajo fue el **' + _fechaLarga(c.peor.fecha) + '** con ' + fCOP(c.peor.cop) + '. Todos tenemos días así.';
  }
  if (intent === 'turno_largo') {
    if (!c.tLargo) return 'No tengo turnos cerrados todavía.';
    return 'Tu turno más largo duró **' + fDur(c.tLargo.dur) + '** el ' + _fechaLarga(c.tLargo.t.inicio) + '.';
  }
  if (intent === 'turno_corto') {
    if (!c.tCorto) return 'No tengo turnos cerrados todavía.';
    return 'Tu turno más corto duró **' + fDur(c.tCorto.dur) + '** el ' + _fechaLarga(c.tCorto.t.inicio) + '.';
  }
  if (intent === 'racha') {
    if (c.rachaActual <= 1) return 'No tenés racha activa. Tu última jornada fue ' + (c.rachaActual === 1 ? 'hoy.' : 'hace más de un día.');
    var rachaMsg = '🔥 Llevás **' + c.rachaActual + ' días consecutivos** trabajando. ';
    rachaMsg += c.rachaActual >= 7 ? '⚠️ ¿Consideraste tomarte un día de descanso?' : '¡Buen ritmo!';
    return rachaMsg;
  }
  if (intent === 'distribucion') {
    var lines = Object.keys(c.bd).filter(function (k) { return c.bd[k].mins > 0; }).map(function (k) {
      return '• ' + RC[k].label + ': ' + fCOP(c.bd[k].cop) + ' (' + fDur(c.bd[k].mins) + ')';
    }).join('\n');
    return '📊 **Distribución de tus ingresos:**\n\n' + lines;
  }
  if (intent === 'velocidad') {
    return '⚡ Tu velocidad es de **' + fCOP(c.copPorHoraReal) + ' por hora** trabajada.\n\n' +
      '• Valor hora base: ' + fCOP(c.vh) + '\n' +
      '• Efectiva (con recargos): ' + fCOP(c.copPorHoraReal);
  }

  // ── Simulación ──
  if (intent === 'simulacion') {
    var hrs = _aiNum(t);
    if (hrs === null) hrs = 4;
    return '🔮 Si trabajás **' + hrs + 'h adicionales**:\n\n' +
      '• Diurna ordinaria: +' + fCOP(hrs * c.vh * 1.0) + '\n' +
      '• Nocturna: +' + fCOP(hrs * c.vh * 1.35) + '\n' +
      '• Extra diurna: +' + fCOP(hrs * c.vh * 1.25) + '\n' +
      '• Festiva diurna: +' + fCOP(hrs * c.vh * 1.75) + '\n' +
      '• Festiva nocturna: +' + fCOP(hrs * c.vh * 2.1);
  }

  // ── Festivos ──
  if (intent === 'festivos') {
    if (!c.proxFests || !c.proxFests.length) return 'No hay más festivos este año.';
    var flist = c.proxFests.map(function (d) {
      return '• ' + d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    }).join('\n');
    return '📅 **Próximos festivos:**\n\n' + flist + '\n\n⚠️ Recordá: los festivos pagan con recargo del 75%.';
  }

  // ── Bienestar ──
  if (intent === 'bienestar') {
    var _fu = typeof aiFollowUp === 'function' ? '\n\n' + aiFollowUp('bienestar') : '';
    if (c.burnout) {
      return '⚠️ **Alerta de fatiga:** Tu ritmo (' + c.hrsSemanales.toFixed(1) + 'h/sem) y racha de ' + c.rachaActual + ' días sugieren que necesitás un descanso.\n\n' +
        '💡 **Recomendación:** Tomate al menos un día libre esta semana. Tu cuerpo y tu productividad te lo van a agradecer.' + _fu;
    }
    return '✅ **Estado:** Tu carga está dentro de lo saludable (' + c.hrsSemanales.toFixed(1) + 'h/sem).\n\n' +
      '💡 Mantené al menos un día de desconexión total a la semana.' + _fu;
  }

  // ── Liquidación ──
  if (intent === 'liquidacion') {
    return '💰 **Tu liquidación estimada (día ' + c.diaActual + '):**\n\n' +
      '**Neto a recibir: ' + fCOP(c.sueldoNeto) + '**\n' +
      '• Bruto: ' + fCOP(c.totalCOP) + '\n' +
      '• Salud + Pensión (8%): -' + fCOP(c.deducciones) + '\n' +
      '• Auxilio transporte: +' + fCOP(c.estTransporte) + '\n\n' +
      '📋 **Prestaciones acumuladas:**\n' +
      '• Prima: ' + fCOP(c.estPrima) + '\n' +
      '• Cesantías: ' + fCOP(c.estCesantias) + '\n' +
      '• Vacaciones: ' + fCOP(c.estVacaciones);
  }

  // ── Ley ──
  if (intent === 'ley') {
    var hsemActual = typeof getHSEM === 'function' ? getHSEM(c.ahora) : 46;
    return '⚖️ **Normativa laboral colombiana:**\n\n' +
      '• Jornada máxima actual: **' + hsemActual + 'h/semana** (Ley 2101/2021)\n' +
      '• Recargo nocturno (9pm-6am): **+35%**\n' +
      '• Recargo dominical/festivo: **+75%**\n' +
      '• Hora extra diurna: **+25%**\n' +
      '• Hora extra nocturna: **+75%**\n' +
      '• Extra festiva diurna: **+100%**\n' +
      '• Extra festiva nocturna: **+150%**\n\n' +
      '• Máximo 2h extra/día y 12h/semana\n' +
      '• Descanso obligatorio tras 6 días de trabajo';
  }

  // ── Ahorro ──
  if (intent === 'ahorro') {
    var meta = _aiNum(t);
    if (!meta || meta < 1000) meta = c.salario;
    var faltaMeta = Math.max(0, meta - c.totalCOP);
    if (faltaMeta === 0) return '🎉 ¡Ya alcanzaste la meta de ' + fCOP(meta) + '! Vas en ' + fCOP(c.totalCOP) + '.';
    var turnosNec = c.prom > 0 ? Math.ceil(faltaMeta / c.prom) : '—';
    return '🎯 Para llegar a **' + fCOP(meta) + '** te faltan **' + fCOP(faltaMeta) + '**.\n\n' +
      '• A tu ritmo: ~' + turnosNec + ' turnos más\n' +
      '• En horas base: ' + (faltaMeta / (c.vh || 1)).toFixed(1) + 'h';
  }

  // ── Stats ──
  if (intent === 'stats') {
    return '⚡ **Resumen rápido:**\n' +
      '• ' + c.diasTrab + ' turnos · ' + fDur(c.totalMins) + '\n' +
      '• ' + fCOP(c.totalCOP) + ' (' + c.pctSalario.toFixed(1) + '% de tu meta)\n' +
      '• Mejor día: ' + (c.mejor ? _fechaLarga(c.mejor.fecha) + ' ' + fCOP(c.mejor.cop) : '—') + '\n' +
      '• Proyección: ' + fCOP(c.proy);
  }

  // ── Email ──
  if (intent === 'email') {
    return '📧 Claro, puedo ayudarte a enviar tu reporte. Solo necesito que me digas:\n\n• ¿A qué correo lo mando?\n• ¿Preferís PDF o Excel?\n\nO si ya lo tenés claro, decime "enviá mi reporte a [correo]" y lo gestiono.';
  }
  if (intent === 'correo_formal') {
    return '📝 **Redacté este borrador para tu jefe:**\n\n' +
      '"Estimado/a,\n\nAdjunto el reporte de mis turnos del mes con el detalle de horas trabajadas, recargos aplicados y proyección al cierre. El total acumulado hasta hoy es de ' + fCOP(c.totalCOP) + '.\n\nQuedo atento/a a cualquier comentario.\nSaludos cordiales."\n\n¿Lo ajusto o así está bien?';
  }

  // ── Ayuda ──
  if (intent === 'ayuda_app') {
    return '📖 **¿Cómo usar Mi Turno?**\n\n' +
      '1. **Inicio:** tocá "Iniciar turno" al llegar y "Finalizar" al irte\n' +
      '2. **Análisis:** mirá tus KPIs, gráfico y proyección\n' +
      '3. **Asistente:** preguntame lo que quieras (¡estamos acá!)\n' +
      '4. **Historial:** revisá todos tus turnos pasados\n' +
      '5. **Ajustes:** configurá tu salario, PIN, modo quincena\n\n' +
      '💡 La app funciona sin internet. Tus datos se sincronizan cuando vuelve la conexión.';
  }

  // Intent no mapeado → devolver null para que el sistema clásico lo maneje
  return null;
}

// ─── MOTOR PRINCIPAL ───────────────────────────────────────────

function aiAnswer(question, state) {
  var q = question.toLowerCase().trim();
  var t = _aiNorm(question);
  if (!q) return 'Pregúntame algo sobre tu mes.';

  // Construcción del contexto garantizada
  var c = buildContext(state);
  var isAdmin = state.session && state.session.isAdmin;

  // ── MODO DESARROLLADOR Y DIAGNÓSTICO ──
  if (isAdmin && _aiHas(t, 'donde', 'archivo', 'modulo', 'cambio', 'eliminar', 'mover', 'codigo', 'error', 'falla', 'supabase', 'vercel', 'red', 'conexion', 'luna', 'oscuro', 'tema', 'que es', 'para que', 'significa', 'diccionario', 'reglas')) {
    var map = c._devMap;
    var fix = c._troubleshooting;
    var dict = c._dictionary;

    // 1. Prioridad: Reglas de Oro
    if (_aiHas(t, 'reglas', 'oro', 'lecciones')) {
      return '🌟 **Reglas de Oro del Proyecto:**\n\n' + [
        '1. Antes de borrar, haz backup manual de la carpeta.',
        '2. Si no ves cambios, sospecha del Service Worker (SW).',
        '3. F12 -> Console -> Network es tu primer paso.',
        '4. Vercel es una máquina del tiempo (Rollback).',
        '5. Los errores tienen mensajes: léelos, no los ignores.',
        '6. Modularizar temprano facilita la vida.'
      ].join('\n') + '\n\n💡 *Sigue estas pautas para un desarrollo profesional.*';
    }

    // 2. Prioridad: Diccionario de conceptos
    for (var term in dict) {
      if (_aiHas(t, term)) {
        return '📖 **Diccionario de Bolsillo:**\n\n' + dict[term] +
          '\n\n💡 *Esta definición es específica para tu proyecto Mi Turno.*';
      }
    }

    var respuesta = '🛠 **Sugerencia de Arquitectura:**\n\n';

    // Priorizar diagnósticos de infraestructura
    if (_aiHas(t, 'supabase')) {
      return '🛡 **Diagnóstico Supabase:**\n' + map.supabase + '\n\n💡 ' + fix.supabase_db;
    }
    if (_aiHas(t, 'vercel', 'despliegue', 'hosting')) {
      return '🚀 **Diagnóstico Vercel:**\n' + map.vercel + '\n\n💡 ' + fix.vercel_deploy;
    }
    if (_aiHas(t, 'red', 'conexion', 'internet', 'offline')) {
      var status = navigator.onLine ? '✅ Actualmente en línea' : '❌ Actualmente sin conexión';
      return '🌐 **Estado de Red:** ' + status + '\n\n' + fix.network_offline + '\n\nSi el servidor no responde: ' + fix.cors;
    }

    if (_aiHas(t, 'emoji', 'icono')) respuesta += '• ' + map.emoji + '\n';
    if (_aiHas(t, 'color', 'estilo', 'apariencia')) respuesta += '• ' + map.color + '\n';
    if (_aiHas(t, 'boton', 'click')) respuesta += '• ' + map.boton + '\n';
    if (_aiHas(t, 'calculo', 'nomina', 'plata', 'cuenta')) respuesta += '• ' + map.calculo + '\n';
    if (_aiHas(t, 'error', 'falla', 'bug')) respuesta += '• ' + map.error + '\n';

    respuesta += '\nBasado en `ESTRUCTURA.md`, este cambio requiere editar el módulo mencionado y recargar la app.';
    return respuesta;
  }

  // ── NLP MEJORADO (v76): clasificación inteligente de intenciones ──
  // Usa el motor ai-nlp.js para entender lenguaje natural con:
  // · Tolerancia a typos y variaciones conversacionales
  // · Sinónimos colombianos (plata=lucas=dinero, camello=trabajo)
  // · Contexto multi-turno ("¿y ayer?" después de "¿cuánto gané?")
  // · Detección de tono emocional para respuestas empáticas
  // Solo se activa con confianza ≥0.5; si no, cae al sistema clásico.
  var _nlp = typeof aiClassifyIntent === 'function'
    ? aiClassifyIntent(question, aiGetConversation(), c)
    : null;
  if (_nlp && _nlp.confidence >= 0.5) {
    aiUpdateConversation(_nlp.intent, _nlp.topic);
    var _mood = typeof aiAnalyzeMood === 'function'
      ? aiAnalyzeMood(question, c)
      : { mood: 'neutral' };
    var _pref = typeof aiEmpatheticPrefix === 'function'
      ? aiEmpatheticPrefix(_mood.mood)
      : '';
    var _suff = typeof aiEmpatheticSuffix === 'function'
      ? aiEmpatheticSuffix(_mood.mood)
      : '';
    var _resp = _aiDispatchNLP(_nlp.intent, c, state, q, t);
    if (_resp) {
      return _pref + _resp + _suff;
    }
  }

  // ── SLASH COMMANDS ──
  if (q === '/ayuda' || q === '/help' || q === '/?') {
    return '**Comandos disponibles:**\n• /ayuda · esta lista\n• /stats · resumen rápido\n• /liquidar · prestaciones y neto\n• /ley · normativa laboral Col.\n• /ahorro 1000000 · ¿cuánto debo trabajar?\n• /salud · bienestar';
  }
  if (q === '/capacidades' || q === '/skills') {
    return '**Capacidades Potenciadas:**\n\n💰 **Finanzas**\n• Sueldo Neto (menos salud/pensión)\n• Liquidación Proporcional\n\n⚖️ **Legal**\n• Ley 2101 (Reducción de jornada)\n• Auxilio de Transporte y Recargos\n\n🧠 **Salud**\n• Análisis de burnout y descanso';
  }

  // ── INTENT: LIQUIDACIÓN ──
  if (q === '/liquidar' || _aiHas(t, 'liquidacion', 'cuanto me deben', 'mis prestaciones', 'prima', 'cesantia')) {
    return '💰 **Proyección Financiera (Día ' + c.diaActual + '):**\n\n' +
      '**A recibir (Neto): ' + fCOP(c.sueldoNeto) + '**\n' +
      '• Bruto: ' + fCOP(c.totalCOP) + '\n' +
      '• Desc. Ley (8%): -' + fCOP(c.deducciones) + '\n' +
      '• Aux. Transp: +' + fCOP(c.estTransporte) + '\n\n' +
      '**Prestaciones Acumuladas:**\n' +
      '• Prima: ' + fCOP(c.estPrima) + '\n' +
      '• Cesantías: ' + fCOP(c.estCesantias) + '\n' +
      '• Vacaciones: ' + fCOP(c.estVacaciones) + '\n\n' +
      '*Nota: Cálculos informativos basados en el CST.*';
  }

  // ── INTENT: NORMATIVA LABORAL ──
  if (q === '/ley' || _aiHas(t, 'normativa', 'mis derechos', 'codigo sustantivo', 'cst', 'ley 2101', 'legal')) {
    return '⚖️ **Normativa Laboral Colombia 2026:**\n\n' +
      '• **Jornada Máxima:** 46 horas semanales (Ley 2101 de 2021).\n' +
      '• **Recargo Nocturno:** +35% (9:00 PM a 6:00 AM).\n' +
      '• **Auxilio Transporte:** Tienes derecho si ganas menos de 2 SMMLV ($' + fCOP(SMIN * 2) + ').\n' +
      '• **Día de Descanso:** Es obligatorio tras 6 días de trabajo.\n' +
      '• **Extras:** Máximo 2 horas diarias y 12 semanales.\n\n' +
      '¿Tienes dudas sobre algún recargo específico?';
  }

  // ── INTENT: AUXILIO DE TRANSPORTE ──
  if (_aiHas(t, 'auxilio', 'transporte', 'subsidio transporte')) {
    var tieneDerecho = c.totalCOP <= (SMIN * 2);
    return '🚌 **Auxilio de Transporte 2026:**\n\n' +
      '• Valor mensual: **' + fCOP(AUX_TRANSPORTE_2026) + '**.\n' +
      '• Requisito: Ganar hasta 2 SMMLV.\n' +
      (tieneDerecho
        ? '✅ Según tus ingresos actuales, **tienes derecho** a percibirlo.'
        : '⚠️ Tus ingresos superan los 2 SMMLV, por lo cual **no aplica** este auxilio.');
  }

  // ── INTENT: AHORRO / METAS ──
  if (_aiHas(t, 'ahorro', 'meta', 'quiero ganar', 'para llegar a')) {
    var meta = _aiNum(t);
    if (!meta || meta < 1000) meta = c.salario;
    var faltaMeta = Math.max(0, meta - c.totalCOP);
    if (faltaMeta === 0) return '¡Felicidades! Ya superaste la meta de ' + fCOP(meta) + '. Llevas ' + fCOP(c.totalCOP) + '.';
    var turnosNec = c.prom > 0 ? Math.ceil(faltaMeta / c.prom) : '—';
    return '🎯 **Análisis de Meta:**\n\n' +
      '• Para alcanzar ' + fCOP(meta) + ' te faltan **' + fCOP(faltaMeta) + '**.\n' +
      '• A tu ritmo actual, necesitas **' + turnosNec + ' turnos** adicionales.\n' +
      '• Eso equivale a ' + (faltaMeta / c.vh).toFixed(1) + ' horas base.';
  }

  // ── /STATS ──
  if (q === '/stats') {
    return (
      '⚡ **Stats exprés**\n• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n• ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% meta)\n• Mejor día: ' +
      (c.mejor ? _fechaLarga(c.mejor.fecha) : '—') +
      '\n• Proyección: ' +
      fCOP(c.proy)
    );
  }

  // ── INTENT: SALUD / FATIGA ──
  if (q === '/salud' || _aiHas(t, 'cansado', 'fatiga', 'descanso', 'bienestar', 'salud')) {
    var saludMsg = c.burnout
      ? '⚠️ **Alerta de Fatiga:** Tu ritmo actual (' + c.hrsSemanales.toFixed(1) + 'h/sem) o tu racha de ' + c.rachaActual + ' días sugieren que necesitas un descanso urgente para evitar el agotamiento.'
      : '✅ **Estado de Bienestar:** Tu carga laboral está dentro de los límites saludables. Mantienes un promedio de ' + c.hrsSemanales.toFixed(1) + 'h semanales.';

    return saludMsg + '\n\n**Recomendación:**\n' +
      (c.nocturnasMins > (c.totalMins * 0.4) ? '• Tienes mucha carga nocturna. Prioriza el sueño en total oscuridad.' : '• Intenta mantener al menos un día de desconexión total a la semana.');
  }

  // ── INTERACCIÓN HUMANA ──
  if (_aiHas(t, 'hola', 'buenas', 'hey', 'que tal', 'saludos', 'que hubo', 'holi', 'ola')) {
    var hora = c.ahora.getHours();
    var saludo = hora < 12 ? '¡Buenos días!' : hora < 19 ? '¡Buenas tardes!' : '¡Buenas noches!';
    return (
      saludo +
      ' Soy tu copiloto de turno 🤖✨ Puedo contarte cómo vas este mes, proyectar tus ingresos, calcular tu liquidación o avisarte si necesitas un descanso. También sé redactar correos para tu jefe. 🚀\n\n' +
      _aiPickFollowUp('hola')
    );
  }
  if (_aiHas(t, 'gracias', 'thanks', 'thx', 'genial', 'perfecto', 'excelente')) {
    return '¡Con gusto! 🙌 Si necesitas otro dato, aquí estoy.';
  }
  if (_aiHas(t, 'adios', 'chao', 'hasta luego', 'nos vemos', 'bye')) {
    return '¡Hasta luego! Trabaja con pilas y descansa cuando puedas. ✦';
  }
  if (
    _aiHas(
      t,
      'quien eres',
      'que eres',
      'de donde',
      'funcionas con internet',
      'offline',
      'online',
      'sin internet'
    )
  ) {
    return 'Soy un motor analítico 100% local. **No envío tus datos a ningún servidor**, todo se procesa en tu dispositivo. Conozco la Ley 2101/2021, los recargos colombianos, los festivos del año y tu historial completo.';
  }
  if (_aiHas(t, 'broma', 'chiste', 'divierteme')) {
    var chistes = [
      '¿Cómo se llama un turno nocturno que nunca termina? Hipotecario. 😅',
      '¿Por qué los recargos son tan honestos? Porque siempre te dan más de lo que pides.',
      'Mi jefe dice que no soy nada raro... aunque a las 3am, hasta los relojes lo dudan. ⏰'
    ];
    return chistes[Math.floor(Math.random() * chistes.length)];
  }

  // ── DATOS BASE: SIN TURNOS ──
  if (
    c.diasTrab === 0 &&
    !_aiHas(
      t,
      'recarg',
      'ley',
      'jornada',
      'festiv',
      'noctur',
      'extra',
      'salario',
      'meta',
      'ayuda',
      'funcion',
      'capacid',
      '/'
    )
  ) {
    return 'Aún no tienes turnos registrados este mes. ¡Pero no pasa nada! 💪 En la pestaña **Inicio** puedes empezar tu primer turno y yo me encargo del resto.\n\nMientras tanto ¿te explico sobre **recargos legales**, **jornada nocturna**, **horas extras** o **próximos festivos**?\n\n' +
      _aiPickFollowUp('default');
  }

  // ════════════════════════════════════════════════════════════
  //  PERIODOS ESPECÍFICOS
  // ════════════════════════════════════════════════════════════

  // Hoy
  if (_aiHas(t, 'hoy') && !_aiHas(t, 'mes', 'semana', 'ayer', 'llev')) {
    if (c.minsHoy === 0) return 'Hoy aún no has registrado turnos.';
    return (
      'Hoy llevas ' +
      fDur(c.minsHoy) +
      ' trabajados · ' +
      fCOP(c.copHoy) +
      '.' +
      (c.turnosHoy > 1 ? ' En ' + c.turnosHoy + ' turnos.' : '')
    );
  }
  // Ayer
  if (_aiHas(t, 'ayer', 'antier')) {
    if (c.minsAyer === 0) return 'No hay registros de ayer.';
    return 'Ayer trabajaste ' + fDur(c.minsAyer) + ' y ganaste ' + fCOP(c.copAyer) + '.';
  }
  // Esta semana
  if (
    _aiHas(t, 'esta semana', 'semana actual') ||
    (_aiHas(t, 'semana') && !_aiHas(t, 'pasad', 'anterior', 'que viene', 'sigui'))
  ) {
    if (c.diasSemanaCount === 0) return 'Esta semana aún no has trabajado.';
    return (
      'Esta semana llevas ' +
      c.diasSemanaCount +
      ' día' +
      (c.diasSemanaCount !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsSemana) +
      ' · ' +
      fCOP(c.totalCOPSemana) +
      '.'
    );
  }
  // Semana pasada
  if (_aiHas(t, 'semana pasad', 'semana anterior', 'semana previa')) {
    if (c.diasSemPasCount === 0) return 'No hay registros de la semana pasada.';
    return (
      'La semana pasada: ' +
      c.diasSemPasCount +
      ' día' +
      (c.diasSemPasCount !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsSemPas) +
      ' · ' +
      fCOP(c.totalCOPSemPas) +
      '.'
    );
  }
  // Mes pasado
  if (_aiHas(t, 'mes pasad', 'mes anterior', 'mes previo')) {
    if (c.diasMesPasado === 0) return 'No hay registros del mes pasado.';
    return (
      'El mes pasado: ' +
      c.diasMesPasado +
      ' día' +
      (c.diasMesPasado !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsMesPasado) +
      ' · ' +
      fCOP(c.totalCOPMesPasado) +
      '.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  COMPARATIVAS
  // ════════════════════════════════════════════════════════════

  // Mes actual vs mes pasado
  if (
    _aiHas(t, 'compar', 'vs', 'versus', 'contra') &&
    (_aiHas(t, 'mes pasad', 'anterior', 'mes previo') || _aiHas(t, 'mes'))
  ) {
    if (c.totalCOPMesPasado === 0) return 'No tengo datos del mes pasado para comparar.';
    var difCOP = c.totalCOP - c.totalCOPMesPasado;
    var tr = _trend(c.totalCOP, c.totalCOPMesPasado);
    var emoji = difCOP >= 0 ? '📈' : '📉';
    return (
      emoji +
      ' **Mes actual vs anterior:**\n• Ingresos: ' +
      fCOP(c.totalCOP) +
      ' vs ' +
      fCOP(c.totalCOPMesPasado) +
      ' (' +
      tr +
      ')\n• Horas: ' +
      fDur(c.totalMins) +
      ' vs ' +
      fDur(c.totalMinsMesPasado) +
      '\n• Días: ' +
      c.diasTrab +
      ' vs ' +
      c.diasMesPasado +
      '\n\n' +
      (difCOP >= 0
        ? 'Vas ' + fCOP(Math.abs(difCOP)) + ' por delante.'
        : 'Vas ' + fCOP(Math.abs(difCOP)) + ' por debajo, aún hay ' + c.diasRestantes + ' días.')
    );
  }

  // Esta semana vs semana pasada
  if (_aiHas(t, 'compar', 'vs') && _aiHas(t, 'semana')) {
    if (c.totalCOPSemPas === 0 && c.totalCOPSemana === 0)
      return 'No tengo registros recientes para comparar semanas.';
    var trS = _trend(c.totalCOPSemana, c.totalCOPSemPas);
    return (
      '📊 **Esta semana vs pasada:**\n• ' +
      fCOP(c.totalCOPSemana) +
      ' vs ' +
      fCOP(c.totalCOPSemPas) +
      ' (' +
      trS +
      ')\n• ' +
      fDur(c.totalMinsSemana) +
      ' vs ' +
      fDur(c.totalMinsSemPas)
    );
  }

  // Mejor que mes pasado?
  if (
    _aiHas(t, 'mejor que', 'peor que', 'superado', 'superar') &&
    _aiHas(t, 'mes pasad', 'anterior')
  ) {
    if (c.totalCOPMesPasado === 0) return 'No hay con qué comparar el mes pasado.';
    if (c.totalCOP > c.totalCOPMesPasado)
      return (
        '✅ Sí, ya vas ' + fCOP(c.totalCOP - c.totalCOPMesPasado) + ' por encima del mes pasado.'
      );
    var lf = c.totalCOPMesPasado - c.totalCOP;
    return (
      '⏳ Te faltan ' +
      fCOP(lf) +
      ' (' +
      (lf / c.vh).toFixed(1) +
      'h aprox.) para igualar el mes pasado. Aún tienes ' +
      c.diasRestantes +
      ' días.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PREDICCIONES Y SIMULACIONES
  // ════════════════════════════════════════════════════════════

  // Simulación: "si trabajo X horas más"
  if (
    _aiHas(t, 'si trabaj', 'si hago', 'si meto', 'cuanto si', 'cuanto ganaria', 'cuanto gano si') ||
    (_aiNum(t) !== null && _aiHas(t, 'mas', 'adicional', 'sumo', 'agreg'))
  ) {
    var hrs = _aiNum(t);
    if (hrs === null) hrs = 4;
    var addCOP = hrs * c.vh * 1.0; // diurna ord por defecto
    var addNoct = hrs * c.vh * 1.35;
    var addExtra = hrs * c.vh * 1.25;
    var addFest = hrs * c.vh * 1.75;
    return (
      'Si trabajas **' +
      hrs +
      'h adicionales** te suman:\n• Diurna ordinaria: ' +
      fCOP(addCOP) +
      '\n• Nocturna ordinaria: ' +
      fCOP(addNoct) +
      '\n• Extra diurna: ' +
      fCOP(addExtra) +
      '\n• Festiva diurna: ' +
      fCOP(addFest) +
      '\n• Festiva nocturna: ' +
      fCOP(hrs * c.vh * 2.1) +
      '\n\nTotal mes proyectado con extras diurnas: ' +
      fCOP(c.totalCOP + addExtra)
    );
  }

  // Cuándo llego a la meta
  if (
    _aiHas(t, 'cuando', 'cuando llego', 'cuanto falt', 'cuantas horas para', 'cuanto para llegar')
  ) {
    if (c.totalCOP >= c.salario)
      return '✅ Ya superaste tu salario base este mes en ' + fCOP(c.totalCOP - c.salario) + '.';
    if (c.prom <= 0) return 'Aún no tengo suficiente data para estimar cuándo llegas a la meta.';
    var diasFaltan = Math.ceil(c.falta / c.prom);
    return (
      'A tu ritmo actual (' +
      fCOP(c.prom) +
      '/turno) necesitas **aproximadamente ' +
      diasFaltan +
      ' turnos más** para llegar a ' +
      fCOP(c.salario) +
      '.\n\nEso equivale a unas ' +
      c.horasParaMeta.toFixed(1) +
      'h al valor hora base (' +
      fCOP(c.vh) +
      '/h).'
    );
  }

  // Mejor caso / peor caso
  if (
    _aiHas(t, 'mejor caso', 'peor caso', 'escenario', 'si todo sale bien', 'optimista', 'pesimista')
  ) {
    var optimista = c.totalCOP + (c.diasRestantes * ((c.mejor || {}).cop || 0));
    var pesimista = c.totalCOP + (c.diasRestantes * ((c.peor || {}).cop || 0));
    return (
      '🔮 **Escenarios al cierre del mes** (' +
      c.diasRestantes +
      ' días por delante):\n• Optimista (trabajas como tu mejor día): ' +
      fCOP(optimista) +
      '\n• Conservador (ritmo actual): ' +
      fCOP(c.proy) +
      '\n• Mínimo (solo turnos como el peor): ' +
      fCOP(pesimista)
    );
  }

  // Días hábiles / días que faltan
  if (
    _aiHas(
      t,
      'dias restant',
      'dias falta',
      'dias del mes',
      'cuantos dias quedan',
      'dias por delante'
    )
  ) {
    return (
      'Quedan **' +
      c.diasRestantes +
      ' días** del mes (' +
      c.diaActual +
      '/' +
      c.diasMes +
      '). Trabajaste ' +
      c.diasTrab +
      '.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  CORE INTENTS (mejorados)
  // ════════════════════════════════════════════════════════════

  // Total ganado
  if (
    _aiHas(
      t,
      'cuanto gan',
      'cuanto cobr',
      'cuanto llev',
      'cuanto ingr',
      'total ingres',
      'ingreso mes',
      'total mes'
    ) ||
    (_aiHas(t, 'total') && _aiHas(t, 'gan', 'cop', 'plata', 'dinero')) ||
    _aiAll(t, ['cuanto', 'mes'])
  ) {
    return (
      _aiPickPhrase('total') +
      '\n\nEste mes llevas **' +
      fCOP(c.totalCOP) +
      '** brutos, distribuidos así:\n\n' +
      _bdLines(c.bd) +
      '\n\nEso representa el ' +
      c.pctSalario.toFixed(1) +
      '% de tu salario base.\n\n' +
      _aiPickFollowUp('salario')
    );
  }

  // Horas trabajadas
  if (
    _aiHas(
      t,
      'cuantas horas',
      'horas mes',
      'horas llev',
      'tiempo trabajad',
      'tiempo regist',
      'cuanto trabaj'
    ) &&
    !_aiHas(t, 'extra', 'nocturn', 'festiv')
  ) {
    return (
      'Llevas **' +
      fDur(c.totalMins) +
      '** en ' +
      c.diasTrab +
      ' turno' +
      (c.diasTrab !== 1 ? 's' : '') +
      '. Promedio de ' +
      c.promHoras.toFixed(1) +
      'h por turno. La velocidad efectiva real es ' +
      fCOP(c.copPorHoraReal) +
      '/h (vs valor hora base ' +
      fCOP(c.vh) +
      ').'
    );
  }

  // Horas extras
  if (_aiHas(t, 'extra', 'sobretiempo', 'adicional', 'sobrejornad')) {
    if (c.extraMins === 0)
      return (
        'No tienes horas extras este mes. Las extras se generan al superar las **46h semanales**. Llevas ' +
        fDur(c.totalMinsSemana) +
        ' esta semana.'
      );
    var pctExtra = ((c.extraMins / c.totalMins) * 100).toFixed(0);
    return (
      'Tienes **' +
      fDur(c.extraMins) +
      '** en extras que suman **' +
      fCOP(c.extraCOP) +
      '** (' +
      pctExtra +
      '% de tu tiempo total).\n\nLas extras se reparten así:\n• Extra diurna (+25%): ' +
      fDur(c.bd.extraDiurna.mins) +
      ' · ' +
      fCOP(c.bd.extraDiurna.cop) +
      '\n• Extra nocturna (+75%): ' +
      fDur(c.bd.extraNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraNoct.cop) +
      '\n• Extra fest. diurna (+100%): ' +
      fDur(c.bd.extraFestDiur.mins) +
      ' · ' +
      fCOP(c.bd.extraFestDiur.cop) +
      '\n• Extra fest. nocturna (+150%): ' +
      fDur(c.bd.extraFestNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraFestNoct.cop)
    );
  }

  // Festivos
  if (_aiHas(t, 'festiv', 'domingo', 'fest') && !_aiHas(t, 'proxim', 'siguient', 'que viene')) {
    if (c.festMins === 0)
      return (
        'Aún no has trabajado en domingos ni festivos este mes.\n\n' +
        (c.proxFests.length > 0
          ? 'Próximo festivo: **' +
          c.proxFests[0].toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }) +
          '**.'
          : '')
      );
    return (
      'Has trabajado **' +
      fDur(c.festMins) +
      '** en ' +
      c.festTrab.length +
      ' día' +
      (c.festTrab.length !== 1 ? 's' : '') +
      ' festivos · **' +
      fCOP(c.festCOP) +
      '**.\n\nEsos pagan +75% (diurna) o +110% (nocturna). Si fueran extras, +100% / +150%.'
    );
  }

  // Nocturnas
  if (_aiHas(t, 'nocturn', 'noche', 'noct', 'madrugad', '21', '3am', 'de noche')) {
    if (c.nocturnasMins === 0)
      return 'No has trabajado horas nocturnas este mes. El recargo nocturno aplica de **9pm a 6am**.';
    var pctN = ((c.nocturnasMins / c.totalMins) * 100).toFixed(0);
    return (
      'Tienes **' +
      fDur(c.nocturnasMins) +
      '** nocturnas (' +
      pctN +
      '% de tu tiempo) · **' +
      fCOP(c.nocturnasCOP) +
      '**.\n\nEstas horas tienen recargo del **+35% mínimo** (ordinaria) hasta **+150%** (extra festiva nocturna).'
    );
  }

  // Mejor día
  if (_aiHas(t, 'mejor dia', 'mejor día', 'dia max', 'mas gane', 'top dia') && c.mejor) {
    return (
      '🏆 Tu mejor día fue el **' +
      _fechaLarga(c.mejor.fecha) +
      '** con **' +
      fCOP(c.mejor.cop) +
      '** en ' +
      fDur(c.mejor.mins) +
      '.' +
      (c.mejor.fest ? ' (Fue festivo, por eso pagó tan bien)' : '')
    );
  }

  // Peor día
  if (
    _aiHas(
      t,
      'peor dia',
      'peor día',
      'dia min',
      'menos gane',
      'dia mas bajo',
      'dia mas corto productiv'
    ) &&
    c.peor
  ) {
    return (
      'Tu día más bajo fue el **' +
      _fechaLarga(c.peor.fecha) +
      '** con ' +
      fCOP(c.peor.cop) +
      ' en ' +
      fDur(c.peor.mins) +
      '. Cada día cuenta. 💪'
    );
  }

  // Promedio
  if (_aiHas(t, 'promedio', 'media', 'promedi', 'prom diario', 'prom turno')) {
    return (
      'Promedio por turno: **' +
      fCOP(c.prom) +
      '** · **' +
      c.promHoras.toFixed(1) +
      'h**.\nVelocidad efectiva (COP/hora real): **' +
      fCOP(c.copPorHoraReal) +
      '/h**.'
    );
  }

  // Proyección
  if (
    _aiHas(
      t,
      'proyecc',
      'ritmo',
      'al cierr',
      'fin de mes',
      'fin mes',
      'cuanto llegar',
      'cuanto cierr',
      'estim',
      'prono'
    )
  ) {
    return (
      'A tu ritmo actual (' +
      fCOP(c.prom) +
      '/turno · ' +
      c.diasTrab +
      ' turnos en ' +
      c.diaActual +
      ' días) podrías cerrar el mes en **' +
      fCOP(c.proy) +
      '**.\n\n' +
      (c.proy >= c.salario
        ? '✅ Eso superaría tu salario base en ' + fCOP(c.proy - c.salario)
        : '⏳ Te faltarían ' + fCOP(c.salario - c.proy) + ' para llegar al salario base.')
    );
  }

  // Salario / Meta
  if (_aiHas(t, 'salario', 'meta', 'base', 'sueldo', 'objetivo')) {
    return (
      'Salario base: **' +
      fCOP(c.salario) +
      '** · valor hora **' +
      fCOP(c.vh) +
      '**.\nLlevas ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '%) · te faltan **' +
      fCOP(c.falta) +
      '** (' +
      c.horasParaMeta.toFixed(1) +
      'h al valor base).'
    );
  }

  // Días trabajados
  if (_aiHas(t, 'cuantos dias', 'cuantos turn', 'dias trab', 'turnos llev')) {
    return (
      'Has trabajado **' +
      c.diasTrab +
      ' día' +
      (c.diasTrab !== 1 ? 's' : '') +
      '** (' +
      c.turnosMes.length +
      ' turnos) este mes. Quedan **' +
      c.diasRestantes +
      ' días** por delante.\n\nRacha actual: **' +
      c.rachaActual +
      ' día' +
      (c.rachaActual !== 1 ? 's' : '') +
      ' consecutivo' +
      (c.rachaActual !== 1 ? 's' : '') +
      '**.'
    );
  }

  // Recargos legales
  if (
    _aiHas(
      t,
      'recarg',
      'porcentaje',
      'por que paga',
      'como calcul',
      'ley',
      'ley 2101',
      'jornada legal'
    ) &&
    !_aiHas(t, 'extra', 'noctur', 'jornada nocturn')
  ) {
    return (
      '⚖️ **Ley 2101/2021 (Colombia)** · factores sobre valor hora base (' +
      fCOP(c.vh) +
      '):\n\n• Diurna ord. (6am-9pm) = ×1.00\n• Nocturna ord. (9pm-6am) = ×1.35 (+35%)\n• Festiva diurna = ×1.75 (+75%)\n• Festiva nocturna = ×2.10 (+110%)\n• Extra diurna = ×1.25 (+25%)\n• Extra nocturna = ×1.75 (+75%)\n• Extra fest. diurna = ×2.00 (+100%)\n• Extra fest. nocturna = ×2.50 (+150%)\n\n**Las extras** arrancan al superar 46h semanales (jornada máxima legal).'
    );
  }

  // Jornada nocturna legal
  if (_aiHas(t, 'jornada nocturn', 'que es nocturn', 'horario nocturn', 'desde que hora nocturn')) {
    return 'La **jornada nocturna** en Colombia va de **9:00pm a 6:00am**. Cualquier minuto trabajado en esa franja recibe recargo del **+35%** sobre el valor hora base (Ley 2101/2021).';
  }

  // Qué cuenta como hora extra
  if (_aiHas(t, 'que es extra', 'cuando es extra', 'desde cuando extra', 'que cuenta como extra')) {
    return 'Las **horas extras** son las que superan la **jornada máxima legal de 46h semanales** (Ley 2101/2021, vigente desde 2023). Mi motor las suma por semana (lunes a domingo) y todo lo que pase de 46h se cuenta como extra. El recargo varía: +25% diurna, +75% nocturna, +100% festiva diurna, +150% festiva nocturna.';
  }

  // Máximo legal de horas
  if (
    _aiHas(
      t,
      'maximo legal',
      'jornada maxima',
      'horas maxim',
      'cuantas horas semana',
      'cuanto puedo trabaj'
    )
  ) {
    return (
      'Jornada máxima legal: **46h semanales** (Ley 2101/2021). Esta semana llevas ' +
      fDur(c.totalMinsSemana) +
      ' de ' +
      fDur(46 * 60) +
      '.\n\nTodo lo que pase de 46h se paga como **hora extra** con sus respectivos recargos.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PATRONES / ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════

  // Día de la semana más rentable
  if (
    _aiHas(
      t,
      'dia de la semana',
      'que dia gano mas',
      'que dia mejor',
      'dia mas product',
      'dia mas rent'
    )
  ) {
    if (c.dowCount[c.bestDow] === 0) return 'Aún no tengo datos suficientes por día de semana.';
    var best = _DOW[c.bestDow],
      worst = _DOW[c.worstDow];
    return (
      '📅 **Patrón semanal:**\n• Mejor día: **' +
      best +
      '** (' +
      fCOP(c.dowCOP[c.bestDow]) +
      ' acumulado · ' +
      c.dowCount[c.bestDow] +
      ' veces)\n• Día más bajo: ' +
      worst +
      ' (' +
      fCOP(c.dowCOP[c.worstDow]) +
      ')\n\nDistribución:\n' +
      _DOW
        .map(function (d, i) {
          return (
            '• ' +
            d +
            ': ' +
            (c.dowCount[i] > 0 ? fCOP(c.dowCOP[i]) + ' · ' + c.dowCount[i] + '×' : 'sin registros')
          );
        })
        .join('\n')
    );
  }

  // Turno más largo
  if (_aiHas(t, 'turno mas largo', 'jornada larga', 'turno mas extens', 'dia mas largo')) {
    if (!c.tLargo) return 'Aún no tienes turnos cerrados este mes.';
    var dt = new Date(c.tLargo.t.inicio);
    return (
      'Tu turno más largo del mes fue el **' +
      dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '** con **' +
      fDur(c.tLargo.dur) +
      '**. ' +
      (c.tLargo.dur > 720 ? '⚠️ Más de 12h: cuídate y respeta los descansos.' : '')
    );
  }

  // Turno más corto
  if (_aiHas(t, 'turno mas corto', 'turno mas breve', 'jornada corta')) {
    if (!c.tCorto) return 'Aún no tienes turnos cerrados.';
    var dtc = new Date(c.tCorto.t.inicio);
    return (
      'Tu turno más corto fue el **' +
      dtc.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '** con ' +
      fDur(c.tCorto.dur) +
      '.'
    );
  }

  // Velocidad / COP por hora
  if (_aiHas(t, 'velocid', 'cop por hora', 'copporhora', 'cop/h', 'valor real', 'plata por hora')) {
    return (
      'Velocidad efectiva: **' +
      fCOP(c.copPorHoraReal) +
      '/h** (vs valor hora base ' +
      fCOP(c.vh) +
      ').\n\nDiferencia: ' +
      (c.copPorHoraReal > c.vh
        ? '+' +
        fCOP(c.copPorHoraReal - c.vh) +
        ' por encima del base — los recargos están sumando bien.'
        : 'aún por debajo del base, normal si llevas pocas horas con recargo.')
    );
  }

  // Racha
  if (_aiHas(t, 'racha', 'dias seguidos', 'dias consecut', 'sin descansar')) {
    if (c.rachaActual <= 1)
      return (
        'No tienes racha activa. Tu última jornada fue ' +
        (c.rachaActual === 1 ? 'hoy.' : 'hace más de un día.')
      );
    return (
      '🔥 Llevas **' +
      c.rachaActual +
      ' días consecutivos** trabajando. ' +
      (c.rachaActual >= 6 ? '⚠️ Considera un día de descanso pronto.' : '¡Muy buen ritmo!')
    );
  }

  // Distribución porcentual / "donde se va mi tiempo"
  if (
    _aiHas(
      t,
      'distribuci',
      'porcentaje recarg',
      'donde va',
      'desglose',
      'porcent tiempo',
      'por categ'
    )
  ) {
    var lines = Object.keys(c.bd)
      .filter(function (k) {
        return c.bd[k].mins > 0;
      })
      .map(function (k) {
        var pctM = ((c.bd[k].mins / c.totalMins) * 100).toFixed(1);
        var pctC = ((c.bd[k].cop / c.totalCOP) * 100).toFixed(1);
        return '• ' + RC[k].label + ': ' + pctM + '% tiempo · ' + pctC + '% ingreso';
      })
      .join('\n');
    return (
      '📊 **Distribución porcentual:**\n\n' +
      lines +
      '\n\nNocturnas + festivas + extras representan el ' +
      (
        ((c.nocturnasMins +
          c.festMins +
          c.extraMins -
          c.bd.noctFest.mins -
          c.bd.extraNoct.mins -
          c.bd.extraFestNoct.mins) /
          c.totalMins) *
        100
      ).toFixed(0) +
      '% del tiempo pero pagan mucho más por su recargo.'
    );
  }

  // Diurna vs nocturna comparativa
  if (_aiAll(t, ['diurn', 'noctur']) || _aiHas(t, 'gano mas de dia', 'gano mas de noche')) {
    var copDia =
      c.diurnaOrdCOP + c.bd.diurnaFest.cop + c.bd.extraDiurna.cop + c.bd.extraFestDiur.cop;
    var copNoche = c.nocturnasCOP;
    return (
      '☀ Diurnas: ' +
      fCOP(copDia) +
      '\n☾ Nocturnas: ' +
      fCOP(copNoche) +
      '\n\n' +
      (copNoche > copDia
        ? 'Estás ganando más en la **noche** este mes. El recargo +35% pega fuerte.'
        : 'Las diurnas dominan tus ingresos. Pero un par de turnos nocturnos suben rápido por el +35%.')
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PRÓXIMOS FESTIVOS
  // ════════════════════════════════════════════════════════════

  if (_aiHas(t, 'proxim', 'siguient', 'que viene', 'prox') && _aiHas(t, 'festiv', 'fest')) {
    if (c.proxFests.length === 0) return 'No quedan festivos en lo que resta del año.';
    var lf = c.proxFests
      .slice(0, 3)
      .map(function (d) {
        var dias = Math.ceil((d - c.ahora) / (1000 * 60 * 60 * 24));
        return (
          '• **' +
          d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
          '** (en ' +
          dias +
          ' día' +
          (dias !== 1 ? 's' : '') +
          ')'
        );
      })
      .join('\n');
    return (
      '📅 **Próximos festivos:**\n\n' +
      lf +
      '\n\nEn festivos el recargo arranca en +75% (diurna). Si además son nocturnos o extras, puede llegar a +150%.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  OPTIMIZACIÓN / RECOMENDACIONES
  // ════════════════════════════════════════════════════════════

  // Qué jornada me conviene
  if (
    _aiHas(
      t,
      'que jornada conviene',
      'jornada mas rent',
      'jornada paga mas',
      'cual paga mas',
      'mas rentable'
    )
  ) {
    return (
      '💰 **Ranking de rentabilidad** (sobre tu valor hora ' +
      fCOP(c.vh) +
      '):\n\n1️⃣ Extra fest. nocturna: ' +
      fCOP(c.vh * 2.5) +
      '/h (+150%)\n2️⃣ Festiva nocturna: ' +
      fCOP(c.vh * 2.1) +
      '/h (+110%)\n3️⃣ Extra fest. diurna: ' +
      fCOP(c.vh * 2.0) +
      '/h (+100%)\n4️⃣ Festiva diurna: ' +
      fCOP(c.vh * 1.75) +
      '/h (+75%)\n5️⃣ Extra nocturna: ' +
      fCOP(c.vh * 1.75) +
      '/h (+75%)\n6️⃣ Nocturna ordinaria: ' +
      fCOP(c.vh * 1.35) +
      '/h (+35%)\n7️⃣ Extra diurna: ' +
      fCOP(c.vh * 1.25) +
      '/h (+25%)\n8️⃣ Diurna ordinaria: ' +
      fCOP(c.vh) +
      '/h\n\n👉 Un turno **nocturno en festivo** paga **2.1×** un turno diurno normal.'
    );
  }

  // ¿Debería tomar extras?
  if (_aiHas(t, 'debo tomar extra', 'conviene extra', 'vale la pena extra', 'hago extras')) {
    if (c.totalMinsSemana < 46 * 60) {
      var faltaPara46 = 46 * 60 - c.totalMinsSemana;
      return (
        'Esta semana llevas ' +
        fDur(c.totalMinsSemana) +
        '. Te faltan **' +
        fDur(faltaPara46) +
        '** para llegar al límite de 46h. Hasta ese punto trabajas como ordinaria. Después, **toda hora vale +25% mínimo**.'
      );
    }
    return 'Esta semana ya superaste las 46h, así que cada hora extra se está pagando con recargo (+25% mín). Cuídate del cansancio igual.';
  }

  // Descanso
  if (
    _aiHas(
      t,
      'descanso',
      'descansar',
      'cuanto descanso',
      'necesito descans',
      'fatig',
      'cansad',
      'agotad'
    )
  ) {
    if (c.rachaActual >= 6)
      return (
        '⚠️ Llevas **' +
        c.rachaActual +
        ' días consecutivos** trabajando. El cuerpo lo nota. Considera **un día completo de descanso** esta semana.'
      );
    if (c.tLargo && c.tLargo.dur >= 720)
      return (
        'Tu jornada más larga del mes fue de ' +
        fDur(c.tLargo.dur) +
        '. Si vas a hacer un turno largo, asegura un buen descanso después.'
      );
    return 'Vas bien. Te recomiendo siempre un descanso mínimo de 8h entre turnos y al menos 1 día libre semanal.';
  }

  // ════════════════════════════════════════════════════════════
  //  AYUDA APP
  // ════════════════════════════════════════════════════════════

  if (
    _aiHas(
      t,
      'como registr',
      'como iniciar turno',
      'como uso',
      'como funciona',
      'como inicio',
      'iniciar turno'
    )
  ) {
    return '✦ **Cómo usar Mi Turno:**\n1. Tab **Inicio** → toca el botón **Iniciar** para arrancar un turno.\n2. El cronómetro corre en tiempo real con cálculo de recargos.\n3. Toca **Parar** al terminar — se guarda en tu historial.\n4. Tab **Análisis** ve tu desempeño · Tab **Historial** exporta a PDF/Excel.';
  }
  if (_aiHas(t, 'como export', 'exportar pdf', 'exportar excel', 'generar reporte')) {
    return 'Tab **Historial** (icono reloj) → en la parte superior tienes **Exportar PDF** y **Exportar Excel**. Generan reportes mensuales con desglose por recargo, firmados con tu cuenta.';
  }
  if (_aiHas(t, 'como cambio salario', 'cambiar salario', 'editar salario', 'configur salario')) {
    return 'Tab **Ajustes** (engranaje) → toca el campo de **Salario base** y escribe el nuevo valor. Se aplica al instante a todos los cálculos.';
  }

  // ════════════════════════════════════════════════════════════
  //  RESUMEN EJECUTIVO
  // ════════════════════════════════════════════════════════════

  if (_aiHas(t, 'resumen', 'analisis', 'como voy', 'panorama', 'estado', 'dame todo', 'reporte')) {
    var tip = '';
    if (c.pctSalario >= 100) tip = '\n\n💪 Ya superaste tu salario base este mes.';
    else if (c.pctSalario >= 80) tip = '\n\n📈 Vas muy bien, cerca de la meta mensual.';
    else if (c.pctSalario >= 50) tip = '\n\n⚖️ Vas a buen ritmo, mitad de mes ideal.';
    else if (c.diaActual > 15) tip = '\n\n⚡ Vas un poco atrás, aprovecha festivos y nocturnas.';
    else tip = '\n\n📅 Aún estás en la primera mitad del mes.';
    var rachaLine =
      c.rachaActual > 0
        ? '\n• Racha: ' +
        c.rachaActual +
        ' día' +
        (c.rachaActual !== 1 ? 's' : '') +
        ' seguido' +
        (c.rachaActual !== 1 ? 's' : '')
        : '';
    var compLine = '';
    if (c.totalCOPMesPasado > 0) {
      compLine = '\n• vs mes pasado: ' + _trend(c.totalCOP, c.totalCOPMesPasado);
    }
    return (
      _aiPickPhrase('total') +
      '\n\n📋 **Resumen ejecutivo:**\n\n• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n• Ingreso bruto: ' +
      fCOP(c.totalCOP) +
      '\n• Promedio por turno: ' +
      fCOP(c.prom) +
      '\n• Proyección al cierre: ' +
      fCOP(c.proy) +
      '\n• Avance vs salario base: ' +
      c.pctSalario.toFixed(1) +
      '%' +
      rachaLine +
      compLine +
      tip +
      '\n\n' +
      _aiPickFollowUp('resumen')
    );
  }

  // ════════════════════════════════════════════════════════════
  //  COMPOSICIÓN DE CORREO (acción real, no solo texto)
  // ════════════════════════════════════════════════════════════

  if (_aiIsEmailIntent(t)) {
    var emailAction = _aiBuildEmail(question, t, c, state);
    return {
      text: emailAction.preview,
      action: { type: 'email_compose', data: emailAction.data }
    };
  }

  // ════════════════════════════════════════════════════════════
  //  FALLBACK
  // ════════════════════════════════════════════════════════════

  return '🤔 No estoy seguro de qué buscas. Algunas cosas que puedo responder:\n\n• "¿Cuánto gané hoy?" · "¿Y ayer?"\n• "Compara con mes pasado"\n• "¿Cuándo llego a la meta?"\n• "¿Cuánto si trabajo 4h más?"\n• "Mejor día de la semana"\n• "Próximos festivos"\n• "Mi racha"\n• **"Envía mi reporte por correo a juan@empresa.com"**\n• **"Redacta un correo formal para mi jefe"**\n\n💡 O simplemente pregúntame algo con tus palabras, ¡soy más conversacional ahora!\n\n' +
    _aiPickFollowUp('default');
}

// ════════════════════════════════════════════════════════════════
//  COMPOSICIÓN DE EMAIL · detección y plantillas
// ════════════════════════════════════════════════════════════════

function _aiIsEmailIntent(t) {
  // Verbo de envío
  var hasVerbo = _aiHas(
    t,
    'enviar',
    'envia',
    'envía',
    'manda',
    'mandar',
    'mandame',
    'envíame',
    'enviame',
    'redacta',
    'redactar',
    'compon',
    'componer',
    'escribe un',
    'escribir un'
  );
  // Sustantivo
  var hasSust = _aiHas(
    t,
    'correo',
    'email',
    'mail',
    'mensaje',
    'reporte por correo',
    'reporte al mail'
  );
  return hasVerbo && hasSust;
}

function _aiBuildEmail(raw, t, c, state) {
  // ── Destinatario ──
  var emailMatch = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  var to = emailMatch ? emailMatch[0].toLowerCase() : '';
  if (!to && state.session && state.session.email) to = state.session.email;
  if (!to && _aiHas(t, 'mi correo', 'mi email', 'a mi', 'para mi', 'mi propio')) {
    to = (state.session && state.session.email) || '';
  }

  // ── Formato ──
  var format = _aiHas(t, 'excel', 'xlsx', 'xls', 'hoja', 'spreadsheet', 'planilla')
    ? 'xlsx'
    : 'pdf';

  // ── Adjuntar reporte ──
  var attach = !_aiHas(
    t,
    'sin adjunto',
    'sin archivo',
    'sin pdf',
    'sin reporte',
    'solo texto',
    'sin anex'
  );

  // ── Tipo de email (define plantilla) ──
  var tipo = 'resumen';
  if (
    _aiHas(
      t,
      'jefe',
      'supervisor',
      'rrhh',
      'empleador',
      'patron',
      'recursos humanos',
      'gerente',
      'jefa',
      'contador'
    )
  )
    tipo = 'formal';
  if (_aiHas(t, 'extra', 'sobretiempo')) tipo = 'extras';
  if (_aiHas(t, 'festiv', 'domingo')) tipo = 'festivos';
  if (_aiHas(t, 'nocturn', 'noche')) tipo = 'nocturnas';
  if (_aiHas(t, 'reporte', 'informe', 'completo', 'detallad')) tipo = 'reporte';
  if (_aiHas(t, 'justific', 'explic')) tipo = 'justificacion';

  var mesNombre = c.ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  var mesCap = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

  var subject = '',
    body = '';

  if (tipo === 'formal') {
    subject = 'Reporte de turnos · ' + mesCap;
    body =
      'Buenos días,\n\n' +
      'Adjunto mi reporte oficial de turnos correspondiente a ' +
      mesNombre +
      '.\n\n' +
      'Resumen ejecutivo:\n' +
      '• Días trabajados: ' +
      c.diasTrab +
      ' (' +
      c.turnosMes.length +
      ' turnos)\n' +
      '• Total de horas: ' +
      fDur(c.totalMins) +
      '\n' +
      '• Horas extras: ' +
      fDur(c.extraMins) +
      (c.extraMins > 0 ? ' · ' + fCOP(c.extraCOP) : '') +
      '\n' +
      '• Horas festivas: ' +
      fDur(c.festMins) +
      (c.festMins > 0 ? ' · ' + fCOP(c.festCOP) : '') +
      '\n' +
      '• Horas nocturnas: ' +
      fDur(c.nocturnasMins) +
      (c.nocturnasMins > 0 ? ' · ' + fCOP(c.nocturnasCOP) : '') +
      '\n\n' +
      'El detalle completo día por día, con los recargos calculados según la Ley 2101 de 2021 y el CST (Arts. 168-171), ' +
      'se encuentra en el archivo adjunto.\n\n' +
      'Quedo atento a cualquier consulta o ajuste.\n\n' +
      'Cordialmente.';
  } else if (tipo === 'extras') {
    var lineasExt =
      Object.keys(c.bd)
        .filter(function (k) {
          return c.bd[k].mins > 0 && k.indexOf('extra') === 0;
        })
        .map(function (k) {
          return '• ' + RC[k].label + ': ' + fDur(c.bd[k].mins) + ' · ' + fCOP(c.bd[k].cop);
        })
        .join('\n') || '• Sin horas extras en este período.';
    subject = 'Detalle de horas extras · ' + mesCap;
    body =
      'Buenas tardes,\n\n' +
      'Comparto el detalle de mis horas extras del mes de ' +
      mesNombre +
      ':\n\n' +
      lineasExt +
      '\n\n' +
      'Total extras: ' +
      fDur(c.extraMins) +
      ' · ' +
      fCOP(c.extraCOP) +
      '\n\n' +
      'Recuerdo que las horas extras se generan al superar las 46 horas semanales (jornada máxima legal, Ley 2101/2021). ' +
      'Los recargos aplicados son: +25% diurna, +75% nocturna, +100% festiva diurna y +150% festiva nocturna sobre el valor hora base.\n\n' +
      'Adjunto el reporte completo con la trazabilidad por turno.\n\n' +
      'Quedo atento.\n\nSaludos.';
  } else if (tipo === 'festivos') {
    var lineasFest =
      c.festTrab
        .map(function (d) {
          return '• ' + _fechaLarga(d.fecha) + ' · ' + fDur(d.mins) + ' · ' + fCOP(d.cop);
        })
        .join('\n') || '• Sin días festivos trabajados en este período.';
    subject = 'Turnos en festivos · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Detalle de turnos trabajados en días festivos / dominicales durante ' +
      mesNombre +
      ':\n\n' +
      lineasFest +
      '\n\n' +
      'Total festivos: ' +
      c.festTrab.length +
      ' día' +
      (c.festTrab.length !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.festMins) +
      ' · ' +
      fCOP(c.festCOP) +
      '\n\n' +
      'Recargos aplicados: +75% (diurna festiva), +110% (nocturna festiva), ' +
      'según la Ley 2101 de 2021.\n\n' +
      'Adjunto el reporte completo.\n\n' +
      'Saludos.';
  } else if (tipo === 'nocturnas') {
    subject = 'Detalle de jornada nocturna · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Comparto el detalle de mis horas nocturnas (9pm-6am) trabajadas en ' +
      mesNombre +
      ':\n\n' +
      '• Nocturna ordinaria: ' +
      fDur(c.bd.noctOrd.mins) +
      ' · ' +
      fCOP(c.bd.noctOrd.cop) +
      '\n' +
      '• Nocturna festiva: ' +
      fDur(c.bd.noctFest.mins) +
      ' · ' +
      fCOP(c.bd.noctFest.cop) +
      '\n' +
      '• Extra nocturna: ' +
      fDur(c.bd.extraNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraNoct.cop) +
      '\n' +
      '• Extra fest. nocturna: ' +
      fDur(c.bd.extraFestNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraFestNoct.cop) +
      '\n\n' +
      'Total: ' +
      fDur(c.nocturnasMins) +
      ' · ' +
      fCOP(c.nocturnasCOP) +
      '\n\n' +
      'El recargo nocturno mínimo es del +35% sobre el valor hora base (Ley 2101/2021).\n\n' +
      'Adjunto el reporte detallado.\n\n' +
      'Saludos.';
  } else if (tipo === 'justificacion') {
    subject = 'Justificación de turnos · ' + mesCap;
    body =
      'Buen día,\n\n' +
      'Adjunto la justificación de mis turnos trabajados durante ' +
      mesNombre +
      ':\n\n' +
      '• ' +
      c.diasTrab +
      ' días con turno · ' +
      fDur(c.totalMins) +
      '\n' +
      '• Distribución por jornada:\n' +
      _bdLines(c.bd).replace(/\n/g, '\n  ') +
      '\n\n' +
      'Cada turno está registrado con hora de inicio, hora de fin y duración exacta. Los recargos se aplican según la legislación laboral colombiana (Ley 2101/2021, CST Arts. 168-171).\n\n' +
      'El documento adjunto contiene la trazabilidad completa.\n\n' +
      'Atento a cualquier comentario.\n\nCordialmente.';
  } else if (tipo === 'reporte') {
    subject = 'Mi reporte de turnos · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Adjunto mi reporte de turnos de ' +
      mesNombre +
      '.\n\n' +
      'Resumen rápido:\n' +
      '• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n' +
      '• Ingreso bruto: ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% del salario base)\n' +
      '• Promedio: ' +
      fCOP(c.prom) +
      ' por turno\n' +
      (c.proy > 0 ? '• Proyección al cierre: ' + fCOP(c.proy) + '\n' : '') +
      '\nEl detalle completo está en el archivo adjunto.\n\nSaludos.';
  } else {
    // resumen (default)
    var mejorLine = c.mejor
      ? '🏆 Mejor día: ' + _fechaLarga(c.mejor.fecha) + ' · ' + fCOP(c.mejor.cop) + '\n'
      : '';
    subject = 'Resumen del mes · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Este es mi resumen de turnos del mes:\n\n' +
      '📊 ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n' +
      '💰 Ingresos: ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% del salario base)\n' +
      (c.extraMins > 0 ? '⚡ Extras: ' + fDur(c.extraMins) + ' · ' + fCOP(c.extraCOP) + '\n' : '') +
      (c.nocturnasMins > 0 ? '☾ Nocturnas: ' + fDur(c.nocturnasMins) + '\n' : '') +
      (c.festMins > 0 ? '✦ Festivas: ' + fDur(c.festMins) + '\n' : '') +
      (c.proy > 0 ? '📈 Proyección: ' + fCOP(c.proy) + '\n' : '') +
      '\n' +
      mejorLine +
      '\nReporte completo en el adjunto.\n\nSaludos.';
  }

  // Sin destinatario detectado → IA pide que el usuario complete
  var preview;
  if (!to) {
    preview =
      'Preparé un correo. Solo me falta a quién enviarlo — completa el destinatario en la tarjeta:';
  } else {
    preview =
      'He redactado este correo para **' +
      to +
      '**. Revísalo, edítalo si quieres y pulsa **Enviar**:';
  }

  return {
    preview: preview,
    data: {
      to: to,
      subject: subject,
      body: body,
      format: format,
      attach: attach
    }
  };
}


// ── js/services/export-files.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-files.js
//  Exportar PDF y Excel locales
// ════════════════════════════════════════════════════════════════
function exportPDF(turnos, calc, salario) {
  if (!window.jspdf) {
    alert('PDF no disponible');
    return;
  }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  var ahora = new Date();
  var mes = ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  doc.setFontSize(18);
  doc.text('Mi Turno · Reporte', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Período: ' + mes, 14, 27);
  doc.text('Generado: ' + ahora.toLocaleString('es-CO'), 14, 32);

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Resumen del mes', 14, 44);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Total: ' + fCOP(calc.totalCOP), 14, 52);
  doc.text('Horas: ' + fDur(calc.totalMins), 14, 58);
  doc.text(
    'Salario base: ' +
      fCOP(salario) +
      ' · Avance: ' +
      ((calc.totalCOP / salario) * 100).toFixed(1) +
      '%',
    14,
    64
  );

  var rows = Object.keys(calc.bd)
    .filter(function (k) {
      return calc.bd[k].mins > 0;
    })
    .map(function (k) {
      return [
        RC[k].label,
        fDur(calc.bd[k].mins),
        '×' + RC[k].factor.toFixed(2),
        fCOP(calc.bd[k].cop)
      ];
    });
  doc.autoTable({
    startY: 72,
    head: [['Tipo', 'Horas', 'Factor', 'Pago']],
    body: rows,
    headStyles: {
      fillColor: [184, 150, 90],
      textColor: [255, 255, 255],
      fontSize: 10,
      halign: 'left'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' } },
    theme: 'striped'
  });

  var fy = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Detalle de turnos', 14, fy + 12);

  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var turnosMes = turnos.filter(function (t) {
    return new Date(t.inicio) >= iniMes;
  });
  var turnoRows = turnosMes.map(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    var mins = Math.round((fin - ini) / 60000);
    return [
      ini.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      fDur(mins),
      esFest(ini) ? 'Fest' : '—'
    ];
  });
  doc.autoTable({
    startY: fy + 16,
    head: [['Fecha', 'Entrada', 'Salida', 'Dur.', 'Tipo']],
    body: turnoRows,
    headStyles: { fillColor: [184, 150, 90], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    theme: 'striped'
  });

  doc.save('mi-turno-' + ahora.toISOString().slice(0, 10) + '.pdf');
}

function exportExcel(turnos, calc, salario) {
  if (!window.XLSX) {
    alert('Excel no disponible');
    return;
  }
  var ahora = new Date();
  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var turnosMes = turnos.filter(function (t) {
    return new Date(t.inicio) >= iniMes;
  });

  var detalle = turnosMes.map(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    var mins = Math.round((fin - ini) / 60000);
    return {
      Fecha: ini.toLocaleDateString('es-CO'),
      Entrada: ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      Salida: fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      Duracion: fDur(mins),
      Horas: Number((mins / 60).toFixed(2)),
      Festivo: esFest(ini) ? 'Sí' : 'No',
      Nocturno: esNoct(ini) ? 'Sí' : 'No'
    };
  });

  var desglose = Object.keys(calc.bd)
    .filter(function (k) {
      return calc.bd[k].mins > 0;
    })
    .map(function (k) {
      return {
        Tipo: RC[k].label,
        Horas: Number((calc.bd[k].mins / 60).toFixed(2)),
        Factor: RC[k].factor,
        Pago: Math.round(calc.bd[k].cop)
      };
    });

  detalle.push(
    {},
    {
      Fecha: 'TOTAL',
      Duracion: fDur(calc.totalMins),
      Horas: Number((calc.totalMins / 60).toFixed(2))
    }
  );

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Turnos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desglose), 'Desglose');
  XLSX.writeFile(wb, 'mi-turno-' + ahora.toISOString().slice(0, 10) + '.xlsx');
}


// ── js/services/export-email.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-email.js
//  Exportar a base64 y enviar por email
// ════════════════════════════════════════════════════════════════
function exportPDFBase64(turnos, calc, salario) {
  // Generar el PDF en memoria sin descargar, devolver base64
  var doc = new jspdf.jsPDF();
  var hoy = new Date();
  var mes = hoy.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  doc.setFontSize(18);
  doc.setTextColor(82, 127, 204);
  doc.text('Mi Turno · Colombia', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Reporte de turnos · ' + mes, 14, 28);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Salario base mensual: ' + fCOP(salario), 14, 42);
  doc.text('Total devengado: ' + fCOP(calc.total), 14, 50);
  doc.text('Horas trabajadas: ' + fDur(calc.totalMin), 14, 58);
  doc.text('Días con turno: ' + (turnos ? turnos.length : 0), 14, 66);

  if (turnos && turnos.length) {
    var rows = turnos
      .slice()
      .reverse()
      .map(function (t) {
        var ini = new Date(t.inicio);
        var fin = t.fin ? new Date(t.fin) : null;
        var dur = fin ? Math.round((fin - ini) / 60000) : 0;
        return [
          ini.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fin ? fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
          fDur(dur),
          fCOP(t.pago || 0)
        ];
      });
    doc.autoTable({
      head: [['Fecha', 'Inicio', 'Fin', 'Duración', 'Pago']],
      body: rows,
      startY: 76,
      theme: 'striped',
      headStyles: { fillColor: [82, 127, 204] },
      styles: { fontSize: 9 }
    });
  }

  // Output como base64 (sin el prefijo "data:application/pdf;base64,")
  var pdfBase64 = doc.output('datauristring').split(',')[1];
  return pdfBase64;
}

function exportExcelBase64(turnos, calc, salario) {
  var wb = XLSX.utils.book_new();
  var hoy = new Date();

  var rows = [
    ['Mi Turno · Colombia'],
    ['Reporte: ' + hoy.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })],
    [],
    ['Salario base mensual', salario],
    ['Total devengado', calc.total],
    ['Horas trabajadas', fDur(calc.totalMin)],
    ['Días con turno', turnos ? turnos.length : 0],
    [],
    ['Fecha', 'Inicio', 'Fin', 'Duración (min)', 'Pago (COP)']
  ];

  if (turnos && turnos.length) {
    turnos
      .slice()
      .reverse()
      .forEach(function (t) {
        var ini = new Date(t.inicio);
        var fin = t.fin ? new Date(t.fin) : null;
        var dur = fin ? Math.round((fin - ini) / 60000) : 0;
        rows.push([
          ini.toLocaleDateString('es-CO'),
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fin ? fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
          dur,
          t.pago || 0
        ]);
      });
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

  // Exportar como base64
  var xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  return xlsxBase64;
}

async function enviarReportePorEmail(opts) {
  // opts: {to, format, filename, fileBase64, subject?, message?}
  if (!SUPA || !CLOUD_MODE) {
    throw new Error('Sin conexión a la nube');
  }

  // Obtener sesión actual; si expiró, intentar refresh antes de fallar
  var sessionRes = await SUPA.auth.getSession();
  if (!sessionRes.data.session) {
    var refreshRes = await SUPA.auth.refreshSession();
    if (!refreshRes.data.session) {
      throw new Error('Tu sesión expiró. Cerrá y volvé a entrar para enviar el reporte.');
    }
    sessionRes = refreshRes;
  }

  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-report';

  var response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      apikey: window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });

  var data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error enviando correo');
  }

  return data;
}

async function enviarPINPorEmail(opts) {
  // opts: {to, pin, userName?}
  if (!SUPA || !CLOUD_MODE) {
    throw new Error('Sin conexión a la nube');
  }
  var sessionRes = await SUPA.auth.getSession();
  if (!sessionRes.data.session) {
    var refreshRes = await SUPA.auth.refreshSession();
    if (!refreshRes.data.session) {
      throw new Error('Tu sesión expiró. Cerrá y volvé a entrar para enviar el reporte.');
    }
    sessionRes = refreshRes;
  }
  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-pin';
  var response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      apikey: window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });
  var data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error enviando correo');
  }
  return data;
}


// ── js/services/ai-history.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-history.js
//  Historial de conversación del asistente + formato Markdown ligero.
//  Extraído de tabs/assistant.js en v48 (refactor por tamaño).
// ════════════════════════════════════════════════════════════════

// ── Historial de conversación, persistido por usuario ──────────
function _getAiKey(uid) {
  return 'mt_ai_his_' + (uid || 'guest');
}

function _aiLoadHistory(uid) {
  try {
    var s = localStorage.getItem(_getAiKey(uid));
    return s ? JSON.parse(s) : [];
  } catch (_) {
    return [];
  }
}

function _aiSaveHistory(uid, msgs) {
  if (!uid) return;
  try {
    // Solo las últimas 30 entradas; las acciones pendientes no se persisten.
    var trim = msgs.slice(-30).map(function (m) {
      if (m.action) return { role: m.role, content: m.content, _actionDone: true };
      return m;
    });
    localStorage.setItem(_getAiKey(uid), JSON.stringify(trim));
  } catch (_) {
    /* almacenamiento lleno o no disponible */
  }
}

function _aiClearHistory(uid) {
  try {
    localStorage.removeItem(_getAiKey(uid));
  } catch (e) {}
}

// ── Markdown ligero → HTML para las burbujas de la IA ──────────
function _aiFormat(text) {
  return String(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code style="padding:1px 6px;border-radius:6px;background:var(--accent-dim);color:var(--accent);font-size:0.92em">$1</code>'
    )
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}


// ── js/services/ai-greeting.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-greeting.js
//  Helpers de saludo, nombre personal del usuario, y frases del hero.
//  Compartidos entre el asistente (tabs/assistant.js) y el historial
//  (tabs/history.js). Extraídos de tabs/assistant.js en v48.
// ════════════════════════════════════════════════════════════════

// ── Helper compartido: saludo según hora ──
// Fuente única de verdad usada por el asistente y por el historial,
// para que ambos digan lo mismo a la misma hora (sin desfases tipo
// "Buenos días" en uno y "Buenas noches" en el otro a las 3 AM).
function _saludoHora(d) {
  var h = (d && typeof d.getHours === 'function' ? d : new Date()).getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Helper interno: nombre/apodo personal del usuario ──
// Lee el alias guardado en localStorage (mt_<uid>_pname); cae al
// primer nombre del email; finalmente vacío.
function _aiNombrePersonal(props) {
  try {
    var s = props && props.session;
    var uid = s && s.uid ? s.uid : null;
    if (uid && typeof leer === 'function') {
      var n = leer(typeof dk === 'function' ? dk(uid, 'pname') : 'mt_pname_' + uid, '');
      if (n && String(n).trim()) return String(n).trim();
    }
    if (s && s.email && !s.guest) {
      var primero = String(s.email).split('@')[0].split('.')[0];
      if (primero && primero.length <= 16) {
        return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
      }
    }
  } catch (_) {}
  return '';
}

// ── Micro-reconocimiento psicológico laboral con personalización ──
// Frases contextuales basadas en evidencia: reconocimiento específico
// (qué hiciste), refuerza el esfuerzo, mezcla condicional + incondicional.
// Cuando hay un nombre personal disponible, lo intercala de forma natural
// — no en todas las frases, para no parecer cliché.
function _aiHeroPhrases(props) {
  var c = props.calc || {};
  var bd = c.bd || {};
  var totalMins = c.totalMins || 0;
  var totalCOP = c.totalCOP || 0;
  var salario = props.salario || 0;
  var pct = salario > 0 ? Math.round((totalCOP / salario) * 100) : 0;
  var ahora = props.ahora || new Date();
  var activo = props.activo || null;
  var turnos = props.turnos || [];
  var hora = ahora.getHours();

  var isNoche = hora >= 21 || hora < 6;
  var isMadrugada = hora >= 0 && hora < 5;
  var isFestivo = typeof esFest === 'function' && esFest(ahora);
  var diaSemana = ahora.getDay();
  var isFinDeSemana = diaSemana === 0 || diaSemana === 6;
  var isDomingo = diaSemana === 0;
  var isLunes = diaSemana === 1;
  var isViernes = diaSemana === 5;

  // Nombre personal (puede ser vacío)
  var nm = _aiNombrePersonal(props);
  // Helper: prefija el nombre con coma si existe ("Pipe, ..."), si no devuelve la frase tal cual
  function n(frase) {
    return nm ? nm + ', ' + frase : frase.charAt(0).toUpperCase() + frase.slice(1);
  }
  // Helper: saludo natural — "Hola pipe" o "Hola"
  function hola() {
    return nm ? 'Hola ' + nm : 'Hola';
  }

  // Duración del turno activo en minutos
  var durActualMins = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;

  // Horas semanales acumuladas
  var minsSemana = 0;
  if (typeof semLun === 'function') {
    var iniSem = semLun(ahora);
    turnos.forEach(function (t) {
      var ini = new Date(t.inicio);
      if (ini >= iniSem) {
        var fin = t.fin ? new Date(t.fin) : ahora;
        minsSemana += (fin - ini) / 60000;
      }
    });
    if (activo && new Date(activo.inicio) >= iniSem) minsSemana += durActualMins;
  }
  var horasSemana = minsSemana / 60;

  function _mins(k) {
    return (bd[k] && bd[k].mins) || 0;
  }
  var extraMins =
    _mins('extraDiurna') + _mins('extraNoct') + _mins('extraFestDiur') + _mins('extraFestNoct');
  var festMins =
    _mins('diurnaFest') + _mins('noctFest') + _mins('extraFestDiur') + _mins('extraFestNoct');
  var noctMins = _mins('noctOrd') + _mins('extraNoct') + _mins('noctFest') + _mins('extraFestNoct');

  // Días trabajados del mes (turnos cerrados, días únicos)
  var diasSet = {};
  turnos.forEach(function (t) {
    if (t.fin) {
      var d = new Date(t.inicio);
      diasSet[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = true;
    }
  });
  var diasTrab = Object.keys(diasSet).length;

  // ── Racha consecutiva de días trabajados (anti-burnout) ──
  // Cuenta hacia atrás desde ayer (o hoy si ya hubo turno) cuántos
  // días seguidos hay un turno cerrado, hasta que aparezca un día vacío.
  function _diaKey(d) {
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }
  var rachaSeguidos = 0;
  var cursor = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  while (true) {
    if (diasSet[_diaKey(cursor)]) {
      rachaSeguidos++;
      cursor.setDate(cursor.getDate() - 1);
      if (rachaSeguidos > 30) break; // tope de seguridad
    } else {
      break;
    }
  }

  // ── Mejor día del mes (récord personal de COP en un día) ──
  // Solo lo calculamos si hay calcPorDia disponible globalmente.
  var mejorDiaCOP = 0;
  var mejorDiaEsHoy = false;
  try {
    if (typeof calcPorDia === 'function') {
      var vh = props.vh || (salario ? salario / 240 : 0);
      var dxd = calcPorDia(turnos, vh) || [];
      var hoyKey =
        ahora.getFullYear() +
        '-' +
        String(ahora.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(ahora.getDate()).padStart(2, '0');
      dxd.forEach(function (d) {
        if (d.cop > mejorDiaCOP) {
          mejorDiaCOP = d.cop;
          mejorDiaEsHoy = d.fecha === hoyKey;
        }
      });
    }
  } catch (_) {}

  // ── Sin datos aún → frases de arranque
  if (totalMins <= 0 && !activo) {
    if (nm) {
      return [
        hola() + '. Cuando estés listo, toca Iniciar y empezamos juntos. ✦',
        n('aquí empieza todo. Tu primer turno está a un toque.'),
        nm + ', cada turno que registres se calcula automático — sin Excel, sin cuentas.',
        'Listos cuando vos digás, ' + nm.toLowerCase() + '. El primer paso es el más importante.'
      ];
    }
    return [
      'Aquí empieza todo. Toca Iniciar y el resto corre por mi cuenta.',
      'Listo para calcular tus recargos en tiempo real, turno a turno.',
      'Tu primer registro está a un toque. Cuando quieras, arrancamos.'
    ];
  }

  var f = [];

  // ══════ 1. SALUDO POR HORA + DÍA (incondicional, cálido) ══════
  if (isMadrugada) {
    if (activo)
      f.push(
        n(
          'a esta hora hay pocos como vos. Llevás ' +
            fDur(durActualMins) +
            ' — gracias por estar acá.'
        )
      );
    else
      f.push(
        nm
          ? hola() + '. Madrugada acompañándote. Lo que registres ahora vale más.'
          : 'Madrugada. A esta hora cada minuto cuenta el doble.'
      );
  } else if (hora >= 5 && hora < 9) {
    f.push(
      nm
        ? hola() + ', buenos días ☀️. El día apenas arranca y vos ya estás acá.'
        : 'Buenos días. El día apenas arranca y vos ya estás acá.'
    );
  } else if (hora >= 9 && hora < 12) {
    f.push(
      nm
        ? n('buen día. La mañana avanza y tu esfuerzo también.')
        : 'Buen día. La mañana avanza y tu esfuerzo también.'
    );
  } else if (hora >= 12 && hora < 14) {
    f.push(
      nm
        ? hola() + '. Mediodía — recordá comer algo, eso también cuenta.'
        : 'Mediodía. Recordá comer algo, eso también cuenta.'
    );
  } else if (hora >= 14 && hora < 18) {
    if (activo)
      f.push(n('buenas tardes. Llevás ' + fDur(durActualMins) + ' en este turno — buen ritmo.'));
    else
      f.push(
        nm
          ? hola() + ', buenas tardes. Tu día de hoy ya quedó registrado.'
          : 'Buenas tardes. Tu día de hoy ya quedó registrado.'
      );
  } else if (hora >= 18 && hora < 21) {
    f.push(
      nm
        ? n('el atardecer y vos seguís dándole. Eso se llama disciplina.')
        : 'El atardecer y vos seguís dándole. Eso se llama disciplina.'
    );
  } else {
    // 21–23
    f.push(
      nm
        ? hola() + '. Trabajar a esta hora pesa — el +35% nocturno ya está corriendo.'
        : 'Buenas noches. Trabajar a esta hora pesa — el +35% nocturno ya está corriendo.'
    );
  }

  // ══════ 2. DURACIÓN DEL TURNO ACTIVO (refuerzo específico) ══════
  if (activo && durActualMins > 0) {
    if (durActualMins < 30) {
      f.push(n('recién arrancás. Cada minuto desde ahora queda registrado.'));
    } else if (durActualMins < 60) {
      f.push('Turno en marcha. Vamos juntos en esto' + (nm ? ', ' + nm.toLowerCase() : '') + '.');
    } else if (durActualMins < 180) {
      var hA = Math.floor(durActualMins / 60);
      f.push(
        (hA === 1 ? '1 hora' : hA + ' horas') +
          ' seguidas' +
          (nm ? ', ' + nm.toLowerCase() : '') +
          ' — el foco está ahí.'
      );
    } else if (durActualMins < 300) {
      f.push(
        nm
          ? nm + ', llevás ' + fDur(durActualMins) + ' sin parar. Eso es constancia pura.'
          : 'Llevás ' + fDur(durActualMins) + ' sin parar. Eso es constancia pura.'
      );
    } else if (durActualMins < 480) {
      f.push(
        n('llevás ' + fDur(durActualMins) + '. Si necesitás un respiro, tomalo — te lo merecés.')
      );
    } else if (durActualMins < 600) {
      f.push(n('8 horas en este turno. Jornada completa. Lo que sigue ya se paga como extra. 💪'));
    } else if (durActualMins < 720) {
      f.push(
        nm
          ? nm +
              ', ' +
              fDur(durActualMins) +
              ' seguidas… esto es de otro nivel. Cuidate también, ¿sí?'
          : fDur(durActualMins) + ' seguidas. Esto es de otro nivel. Cuidate también, ¿sí?'
      );
    } else {
      f.push(
        n(
          'más de 12 horas en este turno. Por favor, descansá pronto. Tu cuerpo te lo va a agradecer.'
        )
      );
    }
  }

  // ══════ 3. HORAS SEMANALES ══════
  var hsemActual = typeof getHSEM === 'function' ? getHSEM(ahora) : 46;
  if (horasSemana >= hsemActual) {
    f.push(
      Math.round(horasSemana) +
        'h esta semana' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — completaste las ' +
        hsemActual +
        'h legales. Todo lo que sumes es extra. 🎯'
    );
  } else if (horasSemana >= hsemActual - 8) {
    f.push(
      nm
        ? nm +
            ', llevás ' +
            Math.round(horasSemana) +
            'h esta semana. Falta poquito para las ' +
            hsemActual +
            'h.'
        : 'Llevás ' +
            Math.round(horasSemana) +
            'h esta semana. Falta poquito para las ' +
            hsemActual +
            'h.'
    );
  } else if (horasSemana >= 20) {
    f.push(
      Math.round(horasSemana) +
        'h acumuladas esta semana' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — vas más de la mitad.'
    );
  } else if (horasSemana >= 10) {
    f.push(
      (nm ? nm + ', ' : '') + Math.round(horasSemana) + 'h registradas esta semana. Buen arranque.'
    );
  }

  // ══════ 4. DÍAS ESPECIALES Y CONTEXTO ══════
  if (isFestivo && isNoche) {
    f.push(
      (nm ? nm + ', festivo nocturno' : 'Festivo nocturno') +
        '. Tu recargo llega al +110% — ese compromiso tiene peso. 🔥'
    );
  } else if (isFestivo) {
    f.push(
      (nm ? 'Trabajando en festivo, ' + nm.toLowerCase() : 'Trabajando en festivo') +
        '. Ese esfuerzo tiene +75% a tu favor.'
    );
  }
  if (isDomingo && !isFestivo && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'domingo trabajando. Cuando otros descansan, vos sumás. Eso no es poco.'
    );
  } else if (isFinDeSemana && !isFestivo && !isDomingo) {
    f.push(
      (nm ? 'Sábado, ' + nm.toLowerCase() + ', ' : 'Sábado: ') +
        'lo que hagas hoy se va a notar en la próxima nómina.'
    );
  }
  if (isLunes && totalMins > 0 && hora < 12) {
    f.push(
      (nm ? nm + ', ' : '') + 'arrancando lunes con turno. La semana empieza con vos al volante.'
    );
  } else if (isViernes && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'viernes y dándole. El fin de semana se va a sentir mejor sabiendo que cumpliste.'
    );
  }

  // ══════ 5. TURNO NOCTURNO ══════
  if (isNoche && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'turno nocturno en curso — el +35% ya corre a tu favor en cada minuto.'
    );
  } else if (isNoche && !activo && totalMins > 0) {
    f.push(
      (nm ? nm + ', ' : '') + 'trabajando hasta tarde. Tu dedicación a esta hora habla sola. 🌙'
    );
  }

  // ══════ 6. HITOS DE META MENSUAL ══════
  if (totalMins > 0) {
    if (pct >= 100) {
      f.push(
        (nm ? '¡' + nm + ', meta superada' : '¡Meta mensual superada') +
          '! Llevás ' +
          fCOP(totalCOP) +
          ' — descansá cuando puedas. 🎉'
      );
    } else if (pct >= 90) {
      f.push((nm ? nm + ', ' : '') + 'al ' + pct + '% de tu meta. Estás a un suspiro de llegar.');
    } else if (pct >= 75) {
      f.push((nm ? nm + ', ' : '') + 'vas en el ' + pct + '%. Con este ritmo, llegás sobrado.');
    } else if (pct >= 50) {
      f.push(
        (nm ? nm + ', ' : '') +
          'llevás el ' +
          pct +
          '%. Mitad del camino — exactamente donde tenés que estar.'
      );
    } else if (pct >= 25) {
      f.push((nm ? nm + ', ' : '') + fCOP(totalCOP) + ' acumulados. Cada turno suma al total.');
    } else {
      f.push(
        (nm ? nm + ', ' : '') +
          'el mes recién arranca. ' +
          fCOP(totalCOP) +
          ' por ahora — paso a paso.'
      );
    }
  }

  // ══════ 7. RECARGOS Y ESPECIALES DEL MES ══════
  if (extraMins > 0 && extraMins >= 60) {
    f.push(
      (nm ? nm + ', ' : '') +
        'tenés ' +
        fDur(extraMins) +
        ' en horas extra este mes — entre +25% y +150% sobre tu valor hora. 💰'
    );
  }
  if (festMins > 0 && !isFestivo) {
    f.push(
      'Has trabajado ' +
        fDur(festMins) +
        ' en festivos este mes' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        '. Ese esfuerzo extra se nota en el bolsillo.'
    );
  }
  if (noctMins > 60 * 10) {
    f.push((nm ? nm + ', ' : '') + 'más de 10h nocturnas este mes — turnero de verdad. 🌙');
  }

  // ══════ 8. RECONOCIMIENTOS POR PATRONES ══════
  if (diasTrab >= 20) {
    f.push((nm ? nm + ', ' : '') + diasTrab + ' días trabajados este mes. Constancia que se ve.');
  } else if (diasTrab >= 10) {
    f.push((nm ? nm + ', ' : '') + 'llevás ' + diasTrab + ' días trabajados. Vas firme.');
  }

  // ══════ 9-A. ANTI-BURNOUT (racha de días seguidos) ══════
  if (rachaSeguidos >= 12) {
    f.push(
      (nm ? nm + ', ' : '') +
        rachaSeguidos +
        ' días seguidos. Sos una máquina — pero las máquinas también descansan. Buscá un día libre pronto. 🙏'
    );
  } else if (rachaSeguidos >= 7) {
    f.push(
      (nm ? nm + ', ' : '') +
        rachaSeguidos +
        ' días seguidos trabajando. Una pausa esta semana te haría bien.'
    );
  } else if (rachaSeguidos >= 5) {
    f.push(
      'Llevás ' +
        rachaSeguidos +
        ' días seguidos' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — muy buena constancia.'
    );
  }

  // ══════ 9-B. ANTI-CULPA (semanas/días bajos) ══════
  if (totalMins > 0 && horasSemana > 0 && horasSemana < 20 && diaSemana >= 5) {
    f.push(
      (nm ? nm + ', ' : '') +
        'una semana más liviana no define tu mes. Lo que viene sigue siendo tuyo.'
    );
  }
  if (diasTrab > 0 && diasTrab < 5 && ahora.getDate() > 20) {
    f.push((nm ? nm + ', ' : '') + 'tu ritmo es tuyo. Cada turno cuenta — no hace falta comparar.');
  }

  // ══════ 9-C. SOLEDAD A HORAS RARAS (compañía emocional) ══════
  if (isMadrugada && activo && durActualMins >= 60) {
    f.push(
      (nm ? nm + ', ' : '') +
        'a esta hora hay pocos despiertos. Yo estoy acá, no estás solo en este turno. 🌙'
    );
  }
  if (hora >= 23 && activo) {
    f.push(
      (nm ? nm + ', ' : '') + 'la noche se hace más corta cuando alguien la registra con vos.'
    );
  }

  // ══════ 9-D. RÉCORD PERSONAL DEL MES ══════
  if (mejorDiaEsHoy && totalMins > 60) {
    f.push(
      (nm ? '¡' + nm + ', ' : '¡') +
        'hoy es tu mejor día del mes! ' +
        fCOP(mejorDiaCOP) +
        ' — récord personal. 🏆'
    );
  } else if (mejorDiaCOP > 0 && totalMins > 60 && hora >= 14) {
    var hoyCOP = 0;
    try {
      if (typeof calcPorDia === 'function') {
        var vhh = props.vh || (salario ? salario / 240 : 0);
        var dxdh = calcPorDia(turnos, vhh) || [];
        var hkey =
          ahora.getFullYear() +
          '-' +
          String(ahora.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(ahora.getDate()).padStart(2, '0');
        for (var i = 0; i < dxdh.length; i++) {
          if (dxdh[i].fecha === hkey) {
            hoyCOP = dxdh[i].cop;
            break;
          }
        }
      }
    } catch (_) {}
    if (hoyCOP > 0 && hoyCOP > mejorDiaCOP * 0.85 && !mejorDiaEsHoy) {
      f.push(
        (nm ? nm + ', ' : '') + 'vas muy cerca de tu mejor día del mes. Si seguís así, lo rompés.'
      );
    }
  }

  // ══════ 9-E. NUDGES SUAVES DE SALUD (sin ser moralista) ══════
  if (activo && durActualMins >= 300 && durActualMins < 360) {
    f.push((nm ? nm + ', ' : '') + 'llevás 5h. ¿Tomaste agua hace rato? Es un buen momento.');
  } else if (activo && durActualMins >= 420 && durActualMins < 480) {
    f.push(
      (nm ? nm + ', ' : '') + 'si podés estirar un poco antes de seguir, tu espalda lo va a notar.'
    );
  }

  // ══════ 9. MENSAJES CÁLIDOS DE CIERRE / TRANSICIÓN ══════
  if (!activo && totalMins > 0 && hora >= 18) {
    f.push(
      (nm ? nm + ', ' : '') + 'turno cerrado por hoy. Lo que hiciste ya quedó. Descansá bien. ✨'
    );
  }
  if (!activo && totalMins > 0 && isMadrugada) {
    f.push((nm ? nm + ', ' : '') + 'descansá. Mañana también vamos a estar acá para vos.');
  }

  // ══════ 10. FALLBACKS CÁLIDOS ══════
  if (f.length < 3) {
    f.push(
      (nm ? nm + ', ' : '') +
        'llevás ' +
        fDur(totalMins) +
        ' registradas este mes. Cada minuto cuenta.'
    );
  }
  if (f.length < 3) {
    f.push(
      (nm ? nm + ', tocame ' : 'Tocame ') + 'si querés revisar algo de tu nómina. Estoy acá. ✦'
    );
  }

  return f;
}


// ── js/tabs/home.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/home.js
//  Tab Inicio: turno activo y controles
// ════════════════════════════════════════════════════════════════

// ── Saldo ordinario semanal restante (turnos cerrados) ───────
// Devuelve los minutos ordinarios que quedan en la semana actual
// antes de contar el turno activo. Usa la misma lógica min(8h, semanal).
function _semOrdRestante(ahora, turnos) {
  var lun = semLun(ahora);
  var semOrd = getHSEM(lun) * 60;
  if (!turnos) return semOrd;
  var ts = turnos
    .filter(function (t) {
      return t.fin && new Date(t.inicio) >= lun;
    })
    .sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
  ts.forEach(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return;
    var mOrd = Math.min(8 * 60, semOrd);
    var cats = calcCats(ini, fin, mOrd);
    var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
    semOrd = Math.max(0, semOrd - ord);
  });
  return semOrd;
}

// ── Helper: tipo de hora actual ──────────────────────────────
// limiteT = min(8h del día, saldo semanal restante) calculado en HomeTab
function getTipoHoraActual(ahora, durMins, limiteT) {
  var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
  var isHoliday = esFest(ahora);
  var isExtra = durMins >= limiteT;

  if (isHoliday) {
    if (isExtra) return isNight ? RC.extraFestNoct : RC.extraFestDiur;
    return isNight ? RC.noctFest : RC.diurnaFest;
  } else {
    if (isExtra) return isNight ? RC.extraNoct : RC.extraDiurna;
    return isNight ? RC.noctOrd : RC.diurnaOrd;
  }
}

function HomeTab(props) {
  var prefs =
    props.prefs ||
    (typeof QUINCENA_PREFS_DEFAULT !== 'undefined'
      ? QUINCENA_PREFS_DEFAULT
      : { auxTransp: false, prestaciones: false, quincenaMode: false });
  var modoQuincena = !!prefs.quincenaMode && props.quincena;
  // Si el modo quincenal está activo usamos el cálculo filtrado al rango,
  // si no, el cálculo mensual estándar.
  var calc = modoQuincena ? props.quincena.calc : props.calc;
  var activo = props.activo,
    ahora = props.ahora,
    vh = props.vh,
    turnos = props.turnos;

  // Onboarding del primer turno: tooltip sobre el botón INICIAR.
  // Se muestra solo cuando no hay turnos ni turno activo, y no fue descartado antes.
  var ob = useState(function () {
    if (activo) return false;
    if (turnos && turnos.length > 0) return false;
    return !leer('mt_ob_done', false);
  });
  var showOb = ob[0],
    setShowOb = ob[1];

  // Ocultar el tooltip en cuanto el usuario inicia su primer turno
  useEffect(
    function () {
      if (activo && showOb) {
        grabar('mt_ob_done', true);
        setShowOb(false);
      }
      if (turnos && turnos.length > 0 && showOb) {
        grabar('mt_ob_done', true);
        setShowOb(false);
      }
    },
    [activo, turnos]
  );

  function dismissOb() {
    grabar('mt_ob_done', true);
    setShowOb(false);
  }

  // Frase IA rotativa (misma fuente y ritmo que el hero del Asistente)
  var moodPhrases = _aiHeroPhrases(props);
  var mp = useState(0);
  var moodIdx = mp[0],
    setMoodIdx = mp[1];
  useEffect(function () {
    var t = setInterval(function () {
      setMoodIdx(function (n) {
        return n + 1;
      });
    }, 7000);
    return function () {
      clearInterval(t);
    };
  }, []);

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;
  // Límite ordinario del turno activo: el menor entre 8h diarias y el saldo semanal de 46h
  var limiteActivo = Math.min(8 * 60, _semOrdRestante(ahora, turnos));
  var liveDelta = 0;
  if (activo && vh) {
    var nowMs = ahora.getTime();
    var minuteStart = Math.floor(nowMs / 60000) * 60000;
    var fracSec = (nowMs - minuteStart) / 1000;
    var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
    var isHoliday = esFest(ahora);
    var isExtra = durActual >= limiteActivo;
    // Matriz completa: noche × festivo × extra
    var factor = isExtra
      ? isHoliday
        ? isNight
          ? 2.5
          : 2.0
        : isNight
          ? 1.75
          : 1.25
      : isHoliday
        ? isNight
          ? 2.1
          : 1.75
        : isNight
          ? 1.35
          : 1.0;
    var perSec = (vh / 3600) * factor;
    liveDelta = perSec * fracSec;
  }
  // El "tick" en vivo se cuenta solo si el turno activo cae dentro de la quincena
  var aplicaLive = true;
  if (modoQuincena && activo) {
    var iniAct = new Date(activo.inicio);
    aplicaLive = iniAct >= props.quincena.rango.ini && iniAct < props.quincena.rango.fin;
  }
  var subTotal = calc.totalCOP + (aplicaLive ? liveDelta : 0);
  // Proporción para los extras: en modo quincenal sumamos la mitad
  var propExtras = modoQuincena ? 0.5 : 1;
  var extras =
    typeof calcularExtras === 'function'
      ? calcularExtras(props.salario, prefs, propExtras)
      : { aux: 0, prest: 0, total: 0 };
  var displayAmount = subTotal + extras.total;
  // Meta: salario completo o medio salario en modo quincena
  var metaSalario = modoQuincena ? props.salario / 2 : props.salario;
  var pctMes = metaSalario > 0 ? Math.min(100, (displayAmount / metaSalario) * 100) : 0;
  var tipos = Object.keys(calc.bd).filter(function (k) {
    return calc.bd[k].mins > 0;
  });

  // Aviso si el usuario nunca confirmó su salario en Ajustes.
  // Si props.salarioConfigured no viene (app-main viejo en caché),
  // caemos al heurístico viejo (<= SMIN) para compatibilidad.
  var salarioSinConfig =
    typeof props.salarioConfigured === 'boolean' ? !props.salarioConfigured : props.salario <= SMIN;

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Inicio' },
    // Aviso de salario no configurado
    salarioSinConfig
      ? h(
          'div',
          {
            className: 'card',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--warn-dim)',
              border: '1.5px solid var(--warn)',
              borderRadius: '18px',
              padding: '14px 16px',
              marginBottom: '4px'
            }
          },
          h('span', { style: { fontSize: '20px', flexShrink: 0 } }, '⚠️'),
          h(
            'div',
            { style: { flex: 1 } },
            h(
              'div',
              {
                style: {
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: 'var(--warn)',
                  marginBottom: '2px'
                }
              },
              'Salario no configurado'
            ),
            h(
              'div',
              { style: { fontSize: '12.5px', color: 'var(--text-2)' } },
              'Estás usando el salario mínimo legal. El estimado podría estar muy por debajo de tu salario real.'
            )
          ),
          h(
            'button',
            {
              style: {
                flexShrink: 0,
                background: 'var(--warn)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              },
              onClick: function () {
                haptic();
                if (props.onOpenConfig) props.onOpenConfig();
              }
            },
            'Ajustar'
          )
        )
      : null,
    // Tarjeta 1: Estimado (mes o quincena)
    h(
      'div',
      {
        className: 'card',
        style: { textAlign: 'center', borderRadius: '32px' },
        'aria-label': 'Estimado de ganancia: ' + fCOP(displayAmount)
      },
      h(
        'div',
        { className: 'hero-eyebrow' },
        modoQuincena
          ? 'Estimado ' +
              props.quincena.rango.label +
              ' · ' +
              formatRangoCorto(props.quincena.rango)
          : 'Estimado este mes'
      ),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'center', margin: '12px 0 16px' } },
        h(
          'div',
          { className: 'num-glass-card' + (activo && aplicaLive ? ' hero-amount-live' : '') },
          h('div', { className: 'hero-amount' }, fCOP(displayAmount))
        )
      ),
      h(
        'div',
        { className: 'hero-sub' },
        // Mensaje amable cuando la quincena recién arranca y no hay turnos
        // todavía: evita el susto de leer "0h 00m registradas" como si la
        // app hubiera perdido datos. Solo aplica en modo quincenal.
        modoQuincena && calc.totalMins === 0
          ? h(
              'span',
              null,
              'Sin turnos en ' +
                (props.quincena && props.quincena.rango && props.quincena.rango.label
                  ? props.quincena.rango.label
                  : 'esta quincena') +
                ' todavía'
            )
          : h('span', null, fDur(calc.totalMins) + ' registradas'),
        h('span', { className: 'hero-sub-dot' }),
        h('span', null, 'meta ' + fCOP(metaSalario))
      ),
      extras.total > 0
        ? h(
            'div',
            {
              className: 'hero-sub',
              style: { marginTop: '6px', fontSize: '11.5px', opacity: 0.78 }
            },
            'Incluye ',
            extras.aux > 0 ? h('span', null, 'aux. transporte ' + fCOP(extras.aux)) : null,
            extras.aux > 0 && extras.prest > 0 ? h('span', { className: 'hero-sub-dot' }) : null,
            extras.prest > 0 ? h('span', null, 'prestaciones ' + fCOP(extras.prest)) : null
          )
        : null
    ),

    // Frase IA · texto limpio, rota cada 7 s, abre el Asistente al tocar
    h(
      'div',
      {
        className: 'mood-line',
        'aria-label': 'Consejo del asistente IA',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        onClick: function () {
          haptic();
          if (props.onOpenAssistant) props.onOpenAssistant();
        }
      },
      h('span', { className: 'mood-spark' }, '✦'),
      h(
        'span',
        { className: 'mood-phrase', key: moodIdx },
        moodPhrases[moodIdx % moodPhrases.length]
      )
    ),

    // Control de turno · botón flotante (sin tarjeta que lo encajone)
    h(
      'div',
      { className: 'action-stage', style: { marginTop: 0 } },
      h(
        'button',
        {
          className: 'action-btn ' + (activo ? 'action-btn-stop' : 'action-btn-go'),
          'aria-label': activo ? 'Detener turno' : 'Iniciar turno',
          onClick: function () {
            haptic();
            activo ? props.onFin() : props.onIni();
          }
        },
        activo
          ? h(
              'svg',
              {
                className: 'action-icon',
                viewBox: '0 0 24 24',
                width: 30,
                height: 30,
                'aria-hidden': 'true'
              },
              h('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 3, fill: 'currentColor' })
            )
          : h(
              'svg',
              {
                className: 'action-icon',
                viewBox: '0 0 24 24',
                width: 34,
                height: 34,
                'aria-hidden': 'true'
              },
              h('path', {
                d: 'M14.5 2.5 L5.5 13 L11 13 L9.5 21.5 L18.5 11 L13 11 Z',
                fill: 'currentColor'
              })
            ),
        h('div', { className: 'action-lbl' }, activo ? 'Parar' : 'Iniciar')
      ),
      activo
        ? h(
            'div',
            { className: 'active-box' },
            h(
              'div',
              { className: 'active-tag' },
              (function () {
                var tipo = getTipoHoraActual(ahora, durActual, limiteActivo);
                return h(
                  'span',
                  {
                    className: 'active-tipo',
                    style: { color: tipo.color }
                  },
                  tipo.icon + ' ' + tipo.label
                );
              })()
            ),
            h(
              'div',
              { style: { margin: '8px 0' } },
              h(
                'div',
                { className: 'num-glass-card', style: { padding: '6px 20px' } },
                h(
                  'div',
                  { className: 'active-timer', style: { fontSize: '42px' } },
                  fDur(durActual)
                )
              )
            ),
            h(
              'div',
              { className: 'active-since' },
              'Desde ' +
                new Date(activo.inicio).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
            ),
            durActual >= U12H / 60000 - 60
              ? h('div', { className: 'active-warn' }, '⚠ Próximo recordatorio de 12h')
              : null
          )
        : null
    ),

    // Tarjeta 3: Avance del Salario Base
    h(
      'div',
      { className: 'card' },
      h(
        'div',
        { className: 'prog-row' },
        h(
          'span',
          { className: 'prog-lbl' },
          modoQuincena ? 'Avance de la quincena' : 'Avance del salario base'
        ),
        h(
          'span',
          {
            className: 'prog-val',
            style: {
              color: pctMes >= 100 ? 'var(--success)' : activo ? 'var(--accent)' : 'var(--text)'
            }
          },
          pctMes.toFixed(1) + '%'
        )
      ),
      h(
        'div',
        { className: 'bar-track' },
        h('div', {
          className:
            'bar-fill' + (pctMes >= 100 ? ' bar-fill-over' : '') + (activo ? ' bar-fill-live' : ''),
          style: { width: pctMes + '%' }
        })
      )
    ),

    // Tooltip onboarding — debajo del botón, flujo normal, no tapado por el header
    showOb &&
      h(
        'div',
        {
          style: {
            textAlign: 'center',
            animation: 'ob-float 2.4s ease-in-out infinite',
            marginBottom: '8px'
          }
        },
        // Flecha apuntando hacia arriba (al botón)
        h('div', {
          style: {
            width: 0,
            height: 0,
            margin: '0 auto 6px',
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '10px solid var(--accent-deep)'
          }
        }),
        // Burbuja
        h(
          'div',
          {
            style: {
              display: 'inline-block',
              background: 'var(--accent-deep)',
              color: '#fff',
              borderRadius: '16px',
              padding: '11px 18px',
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: 1.4,
              boxShadow: '0 4px 20px rgba(79,115,248,0.35)',
              cursor: 'pointer'
            },
            onClick: dismissOb
          },
          'Tocá para iniciar tu primer turno ⚡'
        )
      ),

    tipos.length > 0 ? h('div', { className: 'sec-lbl' }, 'Desglose por tipo') : null,
    tipos.length === 0
      ? h(
          'div',
          { className: 'empty' },
          h('div', { className: 'empty-ico' }, '⏱'),
          h('div', { className: 'empty-txt' }, 'Presiona INICIAR para comenzar'),
          h('div', { className: 'empty-sub' }, 'Tu turno se registra automáticamente')
        )
      : tipos.map(function (tipo) {
          var val = calc.bd[tipo],
            r = RC[tipo];
          return h(
            'div',
            { key: tipo, className: 'brk-row', style: { '--brk-color': r.color } },
            h(
              'div',
              { className: 'brk-l' },
              h(
                'div',
                {
                  className: 'brk-chip',
                  style: { '--chip-bg': r.bg, '--chip-bd': r.bd, color: r.color }
                },
                r.icon
              ),
              h(
                'div',
                { className: 'brk-meta' },
                h('div', { className: 'brk-name' }, r.label),
                h(
                  'div',
                  { className: 'brk-detail' },
                  h('span', null, fDur(val.mins)),
                  h('span', { className: 'brk-detail-sep' }),
                  h('span', null, '×' + r.factor.toFixed(2))
                )
              )
            ),
            h('div', { className: 'brk-amount' }, fCOP(val.cop))
          );
        })
  );
}


// ── js/tabs/dashboard.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/dashboard.js
//  Tab Análisis: proyección y KPIs
// ════════════════════════════════════════════════════════════════
/* global h, useState, useRef, useMemo, useEffect, RC, window, document */

function DashboardTab(props) {
  var calc = props.calc,
    turnos = props.turnos,
    salario = props.salario,
    vh = props.vh,
    ahora = props.ahora;

  var prefs = props.prefs || { auxTransp: false, prestaciones: false, quincenaMode: false };
  var modoQuincena = !!prefs.quincenaMode && props.quincenasMes;
  var canvasRef = useRef(null);
  var chartRef = useRef(null);

  var ctx = useMemo(
    function () {
      var ini = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      var diaActual = ahora.getDate();
      var turnosMes = turnos.filter(function (t) {
        return new Date(t.inicio) >= ini;
      });
      var dias = calcPorDia(turnosMes, vh);
      var diasTrab = dias.length;
      var totalMins = calc.totalMins,
        totalCOP = calc.totalCOP;
      var prom = diasTrab > 0 ? totalCOP / diasTrab : 0;
      var promHoras = diasTrab > 0 ? totalMins / diasTrab / 60 : 0;
      var mejor =
        dias.length > 0
          ? dias.reduce(function (a, b) {
              return b.cop > a.cop ? b : a;
            }, dias[0])
          : null;
      var festMins =
        ((calc.bd.diurnaFest || {}).mins || 0) +
        ((calc.bd.noctFest || {}).mins || 0) +
        ((calc.bd.extraFestDiur || {}).mins || 0) +
        ((calc.bd.extraFestNoct || {}).mins || 0);
      var noctMins =
        ((calc.bd.noctOrd || {}).mins || 0) +
        ((calc.bd.extraNoct || {}).mins || 0) +
        ((calc.bd.noctFest || {}).mins || 0) +
        ((calc.bd.extraFestNoct || {}).mins || 0);
      var proy = diaActual > 0 ? (totalCOP / diaActual) * diasMes : 0;
      var pctSalario = (totalCOP / salario) * 100;
      return {
        dias: dias,
        diasTrab: diasTrab,
        diasMes: diasMes,
        diaActual: diaActual,
        prom: prom,
        promHoras: promHoras,
        mejor: mejor,
        festMins: festMins,
        noctMins: noctMins,
        proy: proy,
        pctSalario: pctSalario,
        totalMins: totalMins,
        totalCOP: totalCOP,
        turnosMes: turnosMes
      };
    },
    [calc, turnos, salario, vh, ahora.getMonth(), ahora.getDate()]
  );

  useEffect(
    function () {
      if (!canvasRef.current || !window.Chart) return;
      var tipos = Object.keys(calc.bd).filter(function (k) {
        return calc.bd[k].mins > 0;
      });
      if (tipos.length === 0) {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
        return;
      }
      var labels = tipos.map(function (k) {
        return RC[k].short;
      });
      var data = tipos.map(function (k) {
        return Math.round(calc.bd[k].cop);
      });
      var colors = tipos.map(function (k) {
        return RC[k].color;
      });
      if (chartRef.current) chartRef.current.destroy();
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 10 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateScale: true, duration: 900, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: isDark ? '#7a7a8a' : '#7a7a7a',
                font: { size: 10, family: 'DM Sans', weight: '600' },
                padding: 10,
                usePointStyle: true,
                boxWidth: 7
              }
            },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return ' ' + c.label + ': ' + fCOP(c.raw);
                }
              },
              backgroundColor: 'rgba(20,20,24,0.94)',
              titleColor: '#d4ae74',
              bodyColor: '#fff',
              padding: 10,
              cornerRadius: 10
            }
          },
          cutout: '68%'
        }
      });
      return function () {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    },
    [calc, props.themeKey]
  );

  if (ctx.diasTrab === 0) {
    return h(
      'div',
      { className: 'fadeUp' },
      h(
        'div',
        { className: 'dash-hero' },
        h('div', { className: 'dash-hero-label' }, 'Proyección al cierre del mes'),
        h('div', { className: 'dash-hero-amount' }, fCOP(0)),
        h('div', { className: 'dash-hero-sub' }, 'Sin turnos registrados aún')
      ),
      h(
        'div',
        { className: 'empty' },
        h('div', { className: 'empty-ico' }, '📊'),
        h('div', { className: 'empty-txt' }, 'Sin datos para mostrar'),
        h('div', { className: 'empty-sub' }, 'Registra tu primer turno para ver el análisis')
      )
    );
  }

  var ritmoBadge = '';
  if (ctx.pctSalario >= (ctx.diaActual / ctx.diasMes) * 100 * 1.1)
    ritmoBadge = '↑ Por encima del ritmo';
  else if (ctx.pctSalario >= (ctx.diaActual / ctx.diasMes) * 100 * 0.9) ritmoBadge = '✓ Buen ritmo';
  else ritmoBadge = '↓ Por debajo del ritmo';

  var tip = '';
  if (ctx.festMins > 0)
    tip =
      'Has trabajado <strong>' +
      fDur(ctx.festMins) +
      '</strong> en festivos, esos turnos pagan con recargo del 75% al 150%.';
  else if (ctx.noctMins > ctx.totalMins * 0.4)
    tip =
      'El ' +
      ((ctx.noctMins / ctx.totalMins) * 100).toFixed(0) +
      '% de tus horas son <strong>nocturnas</strong>, eso eleva tu salario.';
  else
    tip =
      'Con tu promedio de <strong>' +
      fCOP(ctx.prom) +
      '</strong> por turno, vas camino a <strong>' +
      fCOP(ctx.proy) +
      '</strong>.';

  var maxVal = Math.max.apply(
    null,
    ctx.dias
      .map(function (d) {
        return d.cop;
      })
      .concat([1])
  );
  var CH = 124;

  // Q1 / Q2 cards (solo cuando el modo quincenal está activo)
  var quincenaBlock = null;
  if (modoQuincena) {
    var qs = props.quincenasMes;
    var extQ =
      typeof calcularExtras === 'function' ? calcularExtras(salario, prefs, 0.5) : { total: 0 };
    var ahoraMs = ahora.getTime();
    function qStatus(q) {
      if (ahoraMs < q.rango.ini.getTime()) return 'Próxima';
      if (ahoraMs >= q.rango.fin.getTime()) return 'Cerrada';
      return 'En curso';
    }
    quincenaBlock = h(
      'div',
      { className: 'dash-kpi-grid', style: { marginBottom: '16px' } },
      [qs.q1, qs.q2].map(function (q) {
        var total = q.calc.totalCOP + extQ.total;
        return h(
          'div',
          { key: q.rango.label, className: 'kpi-card' },
          h('div', { className: 'kpi-label' }, q.rango.label + ' · ' + qStatus(q)),
          h('div', { className: 'kpi-val accent' }, fCOP(total)),
          h(
            'div',
            { className: 'kpi-sub' },
            formatRangoCorto(q.rango) + ' · ' + fDur(q.calc.totalMins)
          )
        );
      })
    );
  }

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Análisis y proyección' },
    quincenaBlock,
    h(
      'div',
      {
        className: 'dash-hero',
        'aria-label': 'Proyección: ' + fCOP(ctx.proy) + ' al cierre del mes'
      },
      h('div', { className: 'dash-hero-label' }, 'Proyección al cierre del mes'),
      h('div', { className: 'dash-hero-amount' }, fCOP(ctx.proy)),
      h(
        'div',
        { className: 'dash-hero-sub' },
        'Basado en ' +
          ctx.diasTrab +
          ' día' +
          (ctx.diasTrab !== 1 ? 's' : '') +
          ' · promedio ' +
          fCOP(ctx.prom)
      ),
      h(
        'div',
        { className: 'ritmo-badge', 'aria-label': 'Estado de ritmo: ' + ritmoBadge },
        ritmoBadge
      )
    ),

    h(
      'div',
      { className: 'dash-kpi-grid' },
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Días trabajados: ' + ctx.diasTrab + ' de ' + ctx.diasMes
        },
        h('div', { className: 'kpi-label' }, 'Días Trabajados'),
        h('div', { className: 'kpi-val accent' }, ctx.diasTrab),
        h('div', { className: 'kpi-sub' }, 'de ' + ctx.diasMes + ' del mes')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Horas totales: ' + (ctx.totalMins / 60).toFixed(1) + ' horas'
        },
        h('div', { className: 'kpi-label' }, 'Horas Totales'),
        h('div', { className: 'kpi-val' }, (ctx.totalMins / 60).toFixed(1) + 'h'),
        h('div', { className: 'kpi-sub' }, ctx.promHoras.toFixed(1) + 'h promedio')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Promedio por turno: ' + fCOP(ctx.prom)
        },
        h('div', { className: 'kpi-label' }, 'Promedio'),
        h('div', { className: 'kpi-val' }, fCOP(ctx.prom)),
        h('div', { className: 'kpi-sub' }, 'por turno')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label':
            'Mejor día: ' +
            (ctx.mejor
              ? fCOP(ctx.mejor.cop) +
                ' el ' +
                new Date(ctx.mejor.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short'
                })
              : 'Sin datos')
        },
        h('div', { className: 'kpi-label' }, 'Mejor Día'),
        h('div', { className: 'kpi-val accent' }, ctx.mejor ? fCOP(ctx.mejor.cop) : '—'),
        h(
          'div',
          { className: 'kpi-sub' },
          ctx.mejor
            ? new Date(ctx.mejor.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short'
              })
            : '—'
        )
      )
    ),

    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Ingreso por día trabajado'),
      h(
        'div',
        { className: 'bar-chart-wrap' },
        ctx.dias.map(function (d) {
          var hh = Math.max(Math.round((d.cop / maxVal) * CH), 4);
          var cls = d.fest ? 'bf-fest' : d.noct ? 'bf-noc' : '';
          return h(
            'div',
            { key: d.fecha, className: 'bar-col' },
            h('div', {
              className: 'bar-fill-v ' + cls,
              style: { height: hh + 'px' },
              title: d.fecha + ': ' + fCOP(d.cop)
            }),
            h('div', { className: 'bar-label' }, d.fecha.slice(8))
          );
        })
      )
    ),

    Object.keys(calc.bd).filter(function (k) {
      return calc.bd[k].mins > 0;
    }).length > 0
      ? h(
          'div',
          { className: 'card' },
          h('div', { className: 'card-ttl' }, 'Distribución por recargo'),
          h('div', { className: 'chart-wrap' }, h('canvas', { ref: canvasRef }))
        )
      : null,

    h('div', { className: 'tip-box', dangerouslySetInnerHTML: { __html: tip } })
  );
}


// ── js/tabs/assistant.js ──
// ═══════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Pestaña Asistente IA — solo el componente AsistenteTab.
//  Los helpers viven en archivos separados desde v48:
//    · services/ai-history.js       historial + formato markdown
//    · services/ai-greeting.js      saludo + nombre + frases del hero
//    · modals/email-compose-card.js EmailComposeCard (inline en chat)
//  Globales usadas: useState, useEffect, useCallback, useRef, h,
//  haptic, aiAnswer, CLOUD_MODE, EmailComposeCard, _aiLoadHistory,
//  _aiSaveHistory, _aiClearHistory, _aiFormat, _aiHeroPhrases.
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA ASISTENTE
// ═══════════════════════════════════════════════════════════════
function AsistenteTab(props) {
  var uid = (props.session && props.session.uid) || 'guest';

  var ms = useState(function () {
    return _aiLoadHistory(uid);
  });
  var msgs = ms[0],
    setMsgs = ms[1];
  var is = useState('');
  var input = is[0],
    setInput = is[1];
  var bs = useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var cs = useState(null);
  var openCat = cs[0],
    setOpenCat = cs[1];
  var hi = useState(0);
  var heroIdx = hi[0],
    setHeroIdx = hi[1];
  var endRef = useRef(null);
  var inputRef = useRef(null);

  var tieneConversacion = msgs.length > 0;

  // Recargar el historial al cambiar de usuario
  useEffect(
    function () {
      setMsgs(_aiLoadHistory(uid));
    },
    [uid]
  );

  // Guardar el historial cuando cambian los mensajes
  useEffect(
    function () {
      _aiSaveHistory(uid, msgs);
    },
    [msgs, uid]
  );

  // Auto-scroll al último mensaje
  useEffect(
    function () {
      if (endRef.current) {
        requestAnimationFrame(function () {
          if (endRef.current) endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        });
      }
    },
    [msgs, busy]
  );

  // Auto-grow del textarea
  useEffect(
    function () {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + 'px';
      }
    },
    [input]
  );

  // Rotación de la frase del hero (cada 7 s, solo sin conversación)
  useEffect(
    function () {
      if (tieneConversacion) return;
      var t = setInterval(function () {
        setHeroIdx(function (n) {
          return n + 1;
        });
      }, 7000);
      return function () {
        clearInterval(t);
      };
    },
    [tieneConversacion]
  );

  var clearChat = useCallback(
    function () {
      haptic();
      setMsgs([]);
      setOpenCat(null);
      _aiClearHistory(uid);
      if (typeof aiResetConv === 'function') aiResetConv();
    },
    [uid]
  );

  // Marca una acción (correo) como resuelta: enviada o descartada
  var resolveAction = useCallback(function (idx, result) {
    setMsgs(function (prev) {
      var copy = prev.slice();
      var msg = copy[idx];
      if (msg && msg.action) {
        copy[idx] = Object.assign({}, msg, {
          action: null,
          actionResult: result.ok
            ? { ok: true, msg: '✓ Correo enviado a ' + result.to }
            : { ok: false, msg: '✗ Borrador descartado' }
        });
      }
      return copy;
    });
  }, []);

  var send = useCallback(
    function (text) {
      var q = (text || input).trim();
      if (!q || busy) return;
      haptic();
      setInput('');
      setOpenCat(null);

      if (q === '/limpiar' || q === '/clear' || q === '/reset') {
        clearChat();
        return;
      }

      setMsgs(function (p) {
        return p.concat([{ role: 'user', content: q }]);
      });
      setBusy(true);
      setTimeout(
        function () {
          var resp = aiAnswer(q, {
            turnos: props.turnos,
            turnosAll: props.turnosAll || props.turnos,
            calc: props.calc,
            salario: props.salario,
            vh: props.vh,
            session: props.session
          });
          var newMsg;
          if (resp && typeof resp === 'object' && resp.action) {
            newMsg = { role: 'ai', content: resp.text, action: resp.action };
          } else if (resp && typeof resp === 'object') {
            newMsg = { role: 'ai', content: resp.text || String(resp) };
          } else {
            newMsg = { role: 'ai', content: String(resp) };
          }
          setMsgs(function (p) {
            return p.concat([newMsg]);
          });
          setBusy(false);
        },
        350 + Math.random() * 250
      );
    },
    [input, busy, props, clearChat]
  );

  // Saludo según la hora del día (mismo helper que usa el historial)
  var saludo = _saludoHora(new Date());

  // Categorías: lista expandible (una abierta a la vez), nada de botonera
  var categorias = [
    {
      id: 'ingresos',
      icono: '$',
      titulo: 'Ingresos',
      desc: 'Cuánto llevas, tu mejor día y proyecciones',
      preguntas: [
        '¿Cuánto gané este mes?',
        'Mi mejor día',
        'Proyección de fin de mes',
        'Envía mi reporte por correo'
      ]
    },
    {
      id: 'tiempo',
      icono: '◷',
      titulo: 'Tiempo',
      desc: 'Horas trabajadas, ritmo y descansos',
      preguntas: [
        '¿Cuántas horas llevo?',
        '¿Cómo voy de ritmo?',
        'Días trabajados este mes',
        '¿Cuánto descanso he tenido?'
      ]
    },
    {
      id: 'analisis',
      icono: '✦',
      titulo: 'Análisis',
      desc: 'Festivos, horas extras y recargos',
      preguntas: [
        'Festivos trabajados',
        'Horas extras',
        'Resumen general',
        'Distribución por recargo'
      ]
    },
    {
      id: 'ayuda',
      icono: '?',
      titulo: 'Cómo funciona',
      desc: 'Entiende cómo calculo todo',
      preguntas: [
        '¿Cómo se calculan los recargos?',
        '¿Qué es el recargo nocturno?',
        '¿Cómo cuentan los festivos?',
        '¿Qué incluye el sueldo base?'
      ]
    }
  ];

  var phrases = _aiHeroPhrases(props);

  return h(
    'section',
    { className: 'fadeUp asistente-wrap', 'aria-label': 'Asistente AI' },

    // ═══ HERO iOS STYLE: orb izq + texto der (siempre visible) ═══
    h(
      'div',
      { className: 'asistente-hero' },
      h(
        'div',
        { className: 'asistente-hero-orb' },
        h('div', { className: 'asistente-hero-orb-symbol' }, '✦')
      ),
      h(
        'div',
        { className: 'asistente-hero-txt' },
        h('h1', { className: 'asistente-greeting' }, saludo + '.'),
        h('div', { className: 'asistente-phrase', key: heroIdx }, phrases[heroIdx % phrases.length])
      )
    ),

    // ═══ ABOUT: puente entre el saludo y la casilla (desaparece al conversar) ═══
    !tieneConversacion &&
      h(
        'p',
        { className: 'asistente-about' },
        'Soy tu asistente. Conozco tus turnos, recargos y movimientos del mes — ' +
          'pregúntame en tus palabras o explorá las categorías.'
      ),

    // ═══ CHAT (visible solo si hay conversación) ═══
    tieneConversacion
      ? h(
          'div',
          {
            className: 'asistente-chat',
            role: 'region',
            'aria-live': 'polite',
            'aria-atomic': 'false',
            'aria-label': 'Conversación con asistente'
          },
          msgs.map(function (m, i) {
            if (m.role === 'ai') {
              return h(
                'div',
                { key: i, className: 'asistente-msg ai', 'aria-label': 'Mensaje del asistente' },
                h('div', { className: 'asistente-msg-orb' }, '✦'),
                h(
                  'div',
                  { className: 'asistente-col' },
                  h('div', {
                    className: 'asistente-bubble ai',
                    dangerouslySetInnerHTML: { __html: _aiFormat(m.content) }
                  }),
                  m.action && m.action.type === 'email_compose'
                    ? h(EmailComposeCard, {
                        data: m.action.data,
                        parent: props,
                        onResolved: function (r) { resolveAction(i, r); }
                      })
                    : null,
                  m.actionResult
                    ? h('div', { className: 'email-result-badge ' + (m.actionResult.ok ? 'ok' : 'bad') }, m.actionResult.msg)
                    : null
                )
              );
            }
            return h(
              'div',
              { key: i, className: 'asistente-msg user' },
              h('div', { className: 'asistente-bubble user' }, m.content)
            );
          }),
          busy &&
            h(
              'div',
              { className: 'asistente-msg ai' },
              h('div', { className: 'asistente-msg-orb' }, '✦'),
              h(
                'div',
                { className: 'asistente-bubble ai typing' },
                h('span', { className: 'asistente-dot' }),
                h('span', { className: 'asistente-dot' }),
                h('span', { className: 'asistente-dot' })
              )
            ),
          h('div', { ref: endRef })
        )
      : null,

    // ═══ COMPOSER ═══
    h(
      'div',
      { className: 'asistente-composer' },
      h('textarea', {
        ref: inputRef,
        className: 'asistente-input',
        'aria-label': 'Tu mensaje al asistente',
        placeholder: tieneConversacion ? 'Seguí preguntando…' : 'Escribime tu pregunta…',
        value: input,
        onChange: function (e) { setInput(e.target.value); },
        onKeyDown: function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        },
        rows: 1
      }),
      h(
        'button',
        {
          className: 'asistente-send' + (input.trim() && !busy ? ' active' : ''),
          onClick: function () { send(); },
          disabled: !input.trim() || busy,
          'aria-label': 'Enviar'
        },
        '↑'
      )
    ),

    // ═══ Reanudar / nueva conversación ═══
    tieneConversacion &&
      h(
        'button',
        { className: 'asistente-reset', onClick: clearChat, 'aria-label': 'Nueva conversación' },
        'Nueva conversación'
      ),

    // ═══ CATEGORÍAS PRECARGADAS (siempre visibles, al final) ═══
    h(
      'div',
      { className: 'asistente-cats' },
      categorias.map(function (cat) {
        var abierta = openCat === cat.id;
        return h(
          'div',
          {
            key: cat.id,
            className: 'asistente-cat' + (abierta ? ' open' : '')
          },
          h(
            'button',
            {
              className: 'asistente-cat-head',
              'aria-label': cat.titulo + (abierta ? ' (abierto)' : ' (cerrado)'),
              'aria-expanded': abierta,
              onClick: function () {
                haptic();
                setOpenCat(abierta ? null : cat.id);
              }
            },
            h('div', { className: 'asistente-cat-ico' }, cat.icono),
            h(
              'div',
              { className: 'asistente-cat-txt' },
              h('div', { className: 'asistente-cat-ttl' }, cat.titulo),
              h('div', { className: 'asistente-cat-dsc' }, cat.desc)
            ),
            h('div', { className: 'asistente-cat-chev' }, abierta ? '−' : '+')
          ),
          abierta &&
            h(
              'div',
              { className: 'asistente-cat-body' },
              cat.preguntas.map(function (q, i) {
                return h(
                  'button',
                  {
                    key: i,
                    className: 'asistente-cat-q',
                    'aria-label': 'Preguntar: ' + q,
                    onClick: function () {
                      send(q);
                    }
                  },
                  h('span', { className: 'asistente-cat-q-txt' }, q),
                  h('span', { className: 'asistente-cat-q-arr' }, '→')
                );
              })
            )
        );
      })
    )
  );
}


// ── js/tabs/history.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/history.js
//  Tab Historial
// ════════════════════════════════════════════════════════════════
/* global h, useState, useMemo, haptic, esFest, fDur, fCOP, doCalcPerTurno, RC, _saludoHora, _aiNombrePersonal */

function HistoryTab(props) {
  var activo = props.activo,
    turnos = props.turnos,
    durActual = props.durActual;

  var cs = useState(false);
  var conf = cs[0],
    setConf = cs[1];
  var ds = useState(null);
  var delId = ds[0],
    setDelId = ds[1];

  // Turno seleccionado para ver detalle en bottom sheet
  var dts = useState(null);
  var detail = dts[0],
    setDetail = dts[1];

  // Formato seleccionado del exportador (segmented control estilo iOS)
  var ff = useState('pdf');
  var fmt = ff[0],
    setFmt = ff[1];

  function doDel() {
    if (delId !== null) {
      haptic();
      props.onBorrarUno(delId);
      setDelId(null);
    }
  }
  function doExport() {
    haptic();
    if (fmt === 'pdf') props.onExportPDF();
    else props.onExportExcel();
  }

  // ── Datos para el hero (peso visual al estilo IA) ─────────
  var ahora = props.ahora || new Date();
  var session = props.session || {};
  // Nombre personal: mismo helper usado en el asistente
  var nm = typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: session }) : '';
  // Mismo helper que el asistente — fuente única de verdad
  var saludo = typeof _saludoHora === 'function' ? _saludoHora(ahora) : 'Hola';
  var saludoCompleto = nm ? saludo + ', ' + nm : saludo;

  // Stats del mes en curso (turnos cerrados de este mes)
  var mesActual = ahora.getMonth();
  var anioActual = ahora.getFullYear();
  var minsMes = 0;
  var turnosMes = 0;
  var diasSetMes = {};
  turnos.forEach(function (t) {
    if (!t.fin) return;
    var ini = new Date(t.inicio);
    if (ini.getMonth() === mesActual && ini.getFullYear() === anioActual) {
      var fin = new Date(t.fin);
      minsMes += (fin - ini) / 60000;
      turnosMes++;
      diasSetMes[ini.getDate()] = true;
    }
  });
  var diasMes = Object.keys(diasSetMes).length;
  var horasMes = Math.round(minsMes / 60);
  var nombreMes = ahora.toLocaleDateString('es-CO', { month: 'long' });
  nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  // Ingreso por turno con atribución marginal (mismo algoritmo semanal que
  // doCalc), así la suma coincide con el total. Se calcula sobre TODOS los
  // turnos (no solo los visibles) para que el agrupado por semana sea
  // correcto en los bordes. No depende de `ahora`: los turnos cerrados no
  // cambian, evitando recálculos en cada tick del reloj.
  var vh = props.vh || 0;
  var visibles = turnos.slice(0, 60);
  var perTurno = useMemo(
    function () {
      if (!vh) return { byId: {} };
      try {
        return doCalcPerTurno(turnos, vh);
      } catch (_) {
        return { byId: {} };
      }
    },
    [turnos, vh]
  );
  function copDe(t, idx) {
    var key = t.id != null ? t.id : 'idx_' + idx;
    var e = perTurno.byId[key];
    return e && e.cop ? e.cop : 0;
  }
  var maxCop = useMemo(
    function () {
      var m = 1;
      visibles.forEach(function (t, i) {
        var c = copDe(t, i);
        if (c > m) m = c;
      });
      return m;
    },
    [perTurno, turnos]
  );

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Historial de turnos' },
    delId !== null
      ? h(
          'div',
          {
            className: 'ovl',
            onClick: function (ev) {
              if (ev.target === ev.currentTarget) setDelId(null);
            }
          },
          h(
            'div',
            {
              className: 'modal-card',
              style: { textAlign: 'center' },
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': 'Confirmación para eliminar turno'
            },
            h('div', { style: { fontSize: 30, marginBottom: 12, opacity: 0.85 } }, '🗑'),
            h(
              'div',
              { style: { fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 } },
              '¿Eliminar turno?'
            ),
            h(
              'div',
              { style: { fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 } },
              'Esta acción no se puede deshacer.'
            ),
            h(
              'div',
              { className: 'confirm-row' },
              h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  onClick: function () {
                    haptic();
                    setDelId(null);
                  },
                  'aria-label': 'Cancelar eliminación'
                },
                'Cancelar'
              ),
              h(
                'button',
                {
                  className: 'btn btn-danger btn-block',
                  onClick: doDel,
                  style: { background: 'var(--danger)', color: '#fff' },
                  'aria-label': 'Confirmar eliminación de turno'
                },
                'Eliminar'
              )
            )
          )
        )
      : null,

    // ═══ Bottom sheet de detalle del turno ═══
    detail
      ? (function () {
          var t = detail.t;
          var ini = new Date(t.inicio),
            fin = new Date(t.fin);
          var mins = Math.round((fin - ini) / 60000);
          var fest = esFest(ini);
          var key = t.id != null ? t.id : 'idx_' + detail.idx;
          var entry = perTurno.byId[key] || { bd: {} };
          var bd = entry.bd || {};
          var cats = Object.keys(bd).filter(function (k) {
            return bd[k].mins > 0;
          });
          var fechaLarga = ini.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          function cerrar() {
            setDetail(null);
          }
          return h(
            'div',
            {
              className: 'mol-ov',
              onClick: function (ev) {
                if (ev.target === ev.currentTarget) cerrar();
              }
            },
            h(
              'div',
              {
                className: 'mol-sh',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Detalle del turno del ' + fechaLarga
              },
              h('div', { className: 'mol-hdl' }),
              h(
                'div',
                { className: 'td-head' },
                h(
                  'div',
                  { className: 'td-fecha' },
                  fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)
                ),
                fest ? h('span', { className: 'bdg-fest' }, 'Festivo') : null
              ),
              detail.cop > 0 ? h('div', { className: 'td-monto' }, fCOP(detail.cop)) : null,
              h(
                'div',
                { className: 'td-grid' },
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Entrada'),
                  h(
                    'div',
                    { className: 'td-cell-val' },
                    ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                  )
                ),
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Salida'),
                  h(
                    'div',
                    { className: 'td-cell-val' },
                    fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                  )
                ),
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Duración'),
                  h('div', { className: 'td-cell-val' }, fDur(mins))
                )
              ),
              cats.length > 0
                ? h(
                    'div',
                    { className: 'td-bd' },
                    h('div', { className: 'td-bd-ttl' }, 'Desglose por recargo'),
                    cats.map(function (k) {
                      var rc = RC[k] || { short: k, color: 'var(--accent)' };
                      return h(
                        'div',
                        { key: k, className: 'td-bd-row' },
                        h(
                          'div',
                          { className: 'td-bd-name' },
                          h('span', {
                            className: 'td-bd-dot',
                            style: { background: rc.color }
                          }),
                          rc.short
                        ),
                        h('div', { className: 'td-bd-mins' }, fDur(bd[k].mins)),
                        h('div', { className: 'td-bd-cop' }, fCOP(bd[k].cop))
                      );
                    })
                  )
                : null,
              h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  style: { marginTop: 16 },
                  onClick: function () {
                    haptic();
                    cerrar();
                  },
                  'aria-label': 'Cerrar detalle del turno'
                },
                'Cerrar'
              )
            )
          );
        })()
      : null,

    // ═══ HERO con peso visual (estilo IA) ═══
    h(
      'div',
      { className: 'hist-hero' },
      h('div', { className: 'hist-hero-eyebrow' }, nombreMes + ' · resumen'),
      h('h1', { className: 'hist-hero-greeting' }, saludoCompleto + '.'),
      h(
        'div',
        { className: 'hist-hero-stats', role: 'group', 'aria-label': 'Resumen de ' + nombreMes },
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': turnosMes + (turnosMes === 1 ? ' turno' : ' turnos')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, turnosMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            turnosMes === 1 ? 'turno' : 'turnos'
          )
        ),
        h('div', { className: 'hist-hero-sep', 'aria-hidden': 'true' }),
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': horasMes + (horasMes === 1 ? ' hora' : ' horas')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, horasMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            horasMes === 1 ? 'hora' : 'horas'
          )
        ),
        h('div', { className: 'hist-hero-sep', 'aria-hidden': 'true' }),
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': diasMes + (diasMes === 1 ? ' día' : ' días')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, diasMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            diasMes === 1 ? 'día' : 'días'
          )
        )
      )
    ),

    activo
      ? h(
          'div',
          {
            className: 'hist-cur',
            role: 'status',
            'aria-live': 'polite',
            'aria-label':
              'Turno en curso desde las ' +
              new Date(activo.inicio).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
              }) +
              '. Duración ' +
              fDur(durActual)
          },
          h(
            'div',
            { className: 'hist-cur-tag', 'aria-hidden': 'true' },
            h('div', { className: 'active-dot', style: { width: 5, height: 5 } }),
            'En curso'
          ),
          h(
            'div',
            {
              style: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
              'aria-hidden': 'true'
            },
            new Date(activo.inicio).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit'
            }) +
              ' → ahora · ' +
              fDur(durActual)
          )
        )
      : null,

    turnos.length === 0 && !activo
      ? h(
          'div',
          { className: 'empty' },
          h('div', { className: 'empty-ico' }, '📋'),
          h('div', { className: 'empty-txt' }, 'Sin turnos registrados'),
          h('div', { className: 'empty-sub' }, 'Los turnos aparecerán aquí')
        )
      : null,

    turnos.length > 0
      ? h(
          'div',
          { className: 'hist-export' },
          h('div', { className: 'hist-export-ttl' }, 'Exportar ' + nombreMes),
          // ── Segmented control estilo iOS ──
          h(
            'div',
            { className: 'hist-fmt-seg', role: 'tablist' },
            h(
              'button',
              {
                className: 'hist-fmt-opt' + (fmt === 'pdf' ? ' active' : ''),
                role: 'tab',
                'aria-selected': fmt === 'pdf',
                onClick: function () {
                  haptic();
                  setFmt('pdf');
                }
              },
              h('span', { className: 'hist-fmt-ico' }, '📄'),
              'PDF'
            ),
            h(
              'button',
              {
                className: 'hist-fmt-opt' + (fmt === 'excel' ? ' active' : ''),
                role: 'tab',
                'aria-selected': fmt === 'excel',
                onClick: function () {
                  haptic();
                  setFmt('excel');
                }
              },
              h('span', { className: 'hist-fmt-ico' }, '📊'),
              'Excel'
            )
          ),
          // ── CTA de exportación ──
          h(
            'button',
            {
              className: 'hist-export-cta',
              onClick: doExport,
              'aria-label': 'Exportar como ' + (fmt === 'pdf' ? 'PDF' : 'Excel')
            },
            h('span', { className: 'hist-export-cta-ico' }, '↓'),
            h(
              'span',
              { className: 'hist-export-cta-txt' },
              'Descargar ' + (fmt === 'pdf' ? 'PDF' : 'Excel')
            )
          )
        )
      : null,

    visibles.map(function (t, i) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return null;
      var mins = Math.round((fin - ini) / 60000),
        fest = esFest(ini);
      var cop = copDe(t, i);
      var pct = cop > 0 ? Math.max(Math.round((cop / maxCop) * 100), 6) : 0;
      var barCls = fest ? 'hist-bar-fill bf-fest' : 'hist-bar-fill';
      var fechaRow = ini.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      var rowLabel =
        'Turno del ' +
        fechaRow +
        (fest ? ', festivo' : '') +
        '. Duración ' +
        fDur(mins) +
        (cop > 0 ? '. Ingreso ' + fCOP(cop) : '') +
        '. Toca para ver el detalle.';
      return h(
        'div',
        {
          key: t.id || i,
          className: 'hist-row hist-row--tap',
          role: 'button',
          'aria-label': rowLabel,
          onClick: function () {
            haptic();
            setDetail({ t: t, cop: cop, idx: i });
          }
        },
        h(
          'div',
          { className: 'hist-head' },
          h(
            'div',
            { className: 'hist-date' },
            ini.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }),
            fest ? h('span', { className: 'bdg-fest' }, 'Fest') : null
          ),
          h(
            'div',
            { className: 'hist-right' },
            cop > 0 ? h('div', { className: 'hist-cop' }, fCOP(cop)) : null,
            h('div', { className: 'hist-dur' }, fDur(mins)),
            h(
              'button',
              {
                className: 'hist-del',
                'aria-label':
                  'Borrar turno del ' +
                  ini.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
                onClick: function (ev) {
                  ev.stopPropagation();
                  haptic();
                  setDelId(t.id || i);
                }
              },
              '✕'
            )
          )
        ),
        h(
          'div',
          { className: 'hist-detail' },
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) +
            ' → ' +
            fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        ),
        cop > 0
          ? h(
              'div',
              { className: 'hist-bar-track' },
              h('div', { className: barCls, style: { width: pct + '%' } })
            )
          : null
      );
    }),

    turnos.length > 0
      ? !conf
        ? h(
            'button',
            {
              className: 'btn btn-danger btn-block',
              onClick: function () {
                haptic();
                setConf(true);
              },
              style: { marginTop: 10 },
              'aria-label': 'Borrar todo el historial de turnos'
            },
            '🗑 Borrar todo el historial'
          )
        : h(
            'div',
            {
              className: 'confirm-row',
              style: { marginTop: 10 },
              role: 'group',
              'aria-label': 'Confirmar borrado de todo el historial'
            },
            h(
              'button',
              {
                className: 'btn btn-ghost btn-block',
                onClick: function () {
                  haptic();
                  setConf(false);
                },
                'aria-label': 'Cancelar borrado del historial'
              },
              'Cancelar'
            ),
            h(
              'button',
              {
                className: 'btn btn-danger btn-block',
                onClick: function () {
                  haptic();
                  props.onBorrar();
                  setConf(false);
                },
                style: { background: 'var(--danger)', color: '#fff' },
                'aria-label': 'Confirmar borrado de todo el historial'
              },
              'Sí, borrar'
            )
          )
      : null
  );
}


// ── js/tabs/config.js ──
// ═══════════════════════════════════════════════════════════════
// tabs/config.js · Ajustes (rediseño)
// ───────────────────────────────────────────────────────────────
// Sustituye la versión anterior. Mantiene la firma:
//   props = { salario, valorHora, session, onSalario, onSignOut,
//             theme, onThemeChange }
// Usa globales existentes: useState, h, haptic, fCOP, SMIN, RC,
// CLOUD_MODE, ManageAccountModal.
// ═══════════════════════════════════════════════════════════════

// Wrapper a prueba de fallos: si ConfigTabInner crashea por cualquier
// motivo (versión vieja de globals.js en caché, etc.) mostramos un
// estado mínimo y un botón para forzar recarga, en vez de pantalla blanca.
function ConfigTab(props) {
  try {
    return ConfigTabInner(props);
  } catch (err) {
    console.error('[MT] ConfigTab render error:', err);
    return h(
      'div',
      { className: 'fadeUp', style: { padding: '24px' } },
      h(
        'div',
        {
          className: 'card',
          style: {
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--warn-dim)',
            border: '1.5px solid var(--warn)'
          }
        },
        h(
          'div',
          { style: { fontSize: '15px', fontWeight: 700, marginBottom: '8px' } },
          '⚠ Ajustes no pudo cargar correctamente'
        ),
        h(
          'div',
          {
            style: {
              fontSize: '13px',
              color: 'var(--text-2)',
              marginBottom: '14px',
              lineHeight: 1.45
            }
          },
          'Tu app tiene una versión mezclada en caché. Tocá el botón para descargar la última versión completa.'
        ),
        h(
          'button',
          {
            style: {
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            },
            onClick: function () {
              try {
                if (window._mtHardReset) {
                  window._mtHardReset('Reiniciando app…');
                  return;
                }
                if (window._mtCheckUpdate) {
                  window._mtCheckUpdate(true);
                  return;
                }
              } catch (_) {}
              window.location.reload();
            }
          },
          'Reiniciar y aplicar última versión'
        ),
        h(
          'div',
          {
            style: {
              fontSize: '11px',
              color: 'var(--muted)',
              marginTop: '12px',
              textAlign: 'center'
            }
          },
          'Versión: ' + (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'desconocida')
        )
      )
    );
  }
}

function ConfigTabInner(props) {
  var salario = props.salario,
    vh = props.valorHora,
    session = props.session;

  var es = useState(false);
  var editSal = es[0],
    setEditSal = es[1];
  var st = useState('');
  var tempSal = st[0],
    setTempSal = st[1];
  var gs = useState(false);
  var showMgtAcct = gs[0],
    setShowMgtAcct = gs[1];
  var rs = useState(false);
  var openRec = rs[0],
    setOpenRec = rs[1];
  var su = useState(false);
  var showUsuarios = su[0],
    setShowUsuarios = su[1];
  var sp = useState(false);
  var showPins = sp[0],
    setShowPins = sp[1];
  var sd = useState(false);
  var showDiag = sd[0],
    setShowDiag = sd[1];
  var sv = useState(false);
  var showErrorViewer = sv[0],
    setShowErrorViewer = sv[1];
  var si = useState(false);
  var showInstall = si[0],
    setShowInstall = si[1];

  // Estado del acordeón del modo quincenal
  var oq = useState(false);
  var openQuincena = oq[0],
    setOpenQuincena = oq[1];

  // ── Perfil personal (foto + nombre/apodo) ─────────────────
  // Guardado por uid en localStorage. Local-only por ahora.
  var uid = session && session.uid ? session.uid : 'guest';
  var pp = useState(function () {
    return leer(dk(uid, 'photo'), null);
  });
  var photo = pp[0],
    setPhoto = pp[1];
  var pn = useState(function () {
    return leer(dk(uid, 'pname'), '');
  });
  var pname = pn[0],
    setPname = pn[1];
  var ne = useState(false);
  var editName = ne[0],
    setEditName = ne[1];
  var tn = useState('');
  var tempName = tn[0],
    setTempName = tn[1];
  var asp = useState(false);
  var showPhotoSheet = asp[0],
    setShowPhotoSheet = asp[1];
  var fileInputRef = useRef(null);

  function onPickPhoto(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('La foto es muy grande (máximo 8 MB)');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        try {
          var SIZE = 240;
          var canvas = document.createElement('canvas');
          canvas.width = SIZE;
          canvas.height = SIZE;
          var ctx = canvas.getContext('2d');
          // Recorte cuadrado centrado (cover)
          var sw = Math.min(img.width, img.height);
          var sx = (img.width - sw) / 2;
          var sy = (img.height - sw) / 2;
          ctx.drawImage(img, sx, sy, sw, sw, 0, 0, SIZE, SIZE);
          var dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          // Si localStorage está lleno, grabar() devuelve false: avisamos
          // en vez de fingir que guardó (la UI no debe mostrar una foto
          // que no persiste tras recargar).
          var okGuardado = grabar(dk(uid, 'photo'), dataUrl);
          if (!okGuardado) {
            // Reintento con más compresión por si fue tema de tamaño.
            var dataUrlSmall = canvas.toDataURL('image/jpeg', 0.5);
            okGuardado = grabar(dk(uid, 'photo'), dataUrlSmall);
            if (okGuardado) dataUrl = dataUrlSmall;
          }
          if (!okGuardado) {
            alert(
              'No se pudo guardar la foto: almacenamiento del dispositivo lleno. Liberá espacio e intentá de nuevo.'
            );
            return;
          }
          setPhoto(dataUrl);
          haptic();
        } catch (err) {
          alert('No se pudo procesar la imagen');
        }
      };
      img.onerror = function () {
        alert('No se pudo leer la imagen');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      alert('No se pudo abrir el archivo');
    };
    reader.readAsDataURL(file);
  }
  function eliminarFoto() {
    haptic();
    borrarKey(dk(uid, 'photo'));
    setPhoto(null);
    setShowPhotoSheet(false);
  }
  function abrirGaleria() {
    setShowPhotoSheet(false);
    setTimeout(function () {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 80);
  }
  function abrirEditName() {
    haptic();
    setTempName(pname || '');
    setEditName(true);
  }
  function guardarName() {
    haptic();
    var clean = String(tempName || '')
      .trim()
      .slice(0, 32);
    if (clean) {
      var okName = grabar(dk(uid, 'pname'), clean);
      if (!okName) {
        alert('No se pudo guardar el nombre: almacenamiento lleno.');
        return;
      }
      setPname(clean);
    } else {
      borrarKey(dk(uid, 'pname'));
      setPname('');
    }
    setEditName(false);
  }

  // Estado local de texto para los inputs Q1/Q2 — permite vaciar el
  // campo y reescribir sin que React lo fuerce a su valor previo.
  // Se sincroniza con prefs solo cuando el texto es un número válido.
  var q1t = useState('');
  var q1Text = q1t[0],
    setQ1Text = q1t[1];
  var q2t = useState('');
  var q2Text = q2t[0],
    setQ2Text = q2t[1];

  // Estado del chequeo manual de actualización
  // updStatus: 'idle' | 'checking' | 'uptodate' | 'available' | 'error'
  var us = useState({ status: 'idle', remote: null, checkedAt: null });
  var updState = us[0],
    setUpdState = us[1];

  function checkVersionNow() {
    haptic();
    setUpdState({ status: 'checking', remote: null, checkedAt: null });
    var local = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : '';
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('http ' + (r && r.status));
        return r.json();
      })
      .then(function (j) {
        var remote = j && j.v ? String(j.v) : null;
        if (!remote) throw new Error('formato inválido');
        var ts = new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        });
        if (remote === local) {
          setUpdState({ status: 'uptodate', remote: remote, checkedAt: ts });
        } else {
          setUpdState({ status: 'available', remote: remote, checkedAt: ts });
          // Pedimos al SW que se actualice en segundo plano para que el
          // botón "Actualizar ahora" sea instantáneo cuando lo toquen.
          try {
            if (window._mtCheckUpdate) window._mtCheckUpdate(false);
          } catch (_) {}
        }
      })
      .catch(function () {
        setUpdState({ status: 'error', remote: null, checkedAt: null });
      });
  }

  function applyUpdateNow() {
    haptic();
    try {
      if (window._mtCheckUpdate) {
        window._mtCheckUpdate(true);
        return;
      }
    } catch (_) {}
    window.location.reload();
  }

  var prefs =
    props.prefs ||
    (typeof QUINCENA_PREFS_DEFAULT !== 'undefined'
      ? QUINCENA_PREFS_DEFAULT
      : { auxTransp: false, prestaciones: false, quincenaMode: false, q1Day: 1, q2Day: 16 });
  function patchPrefs(p) {
    if (props.onPrefsChange) props.onPrefsChange(p);
  }

  // Constantes con fallback por si globals.js está en versión vieja en caché
  var AUX_VAL = typeof AUX_TRANSPORTE_2026 !== 'undefined' ? AUX_TRANSPORTE_2026 : 249095;
  var PRES_PCT = typeof PRESTACIONES_PCT !== 'undefined' ? PRESTACIONES_PCT : 0.218;

  // Sincroniza el texto local con los días reales de las prefs cuando
  // cambian desde fuera (carga inicial, preset, etc.)
  useEffect(
    function () {
      setQ1Text(String(prefs.q1Day));
    },
    [prefs.q1Day]
  );
  useEffect(
    function () {
      setQ2Text(String(prefs.q2Day));
    },
    [prefs.q2Day]
  );

  // Acepta texto libre; solo commitea cuando es un entero válido 1..28.
  function onDayTextChange(which, txt) {
    if (which === 'q1') setQ1Text(txt);
    else setQ2Text(txt);
    if (txt === '') return; // permite borrar sin forzar nada
    var v = parseInt(txt, 10);
    if (isNaN(v)) return;
    if (v < 1 || v > 28) return;
    if (which === 'q1') patchPrefs({ q1Day: v });
    else patchPrefs({ q2Day: v });
  }
  // Al perder el foco, si quedó vacío o inválido, snap al último valor válido.
  function onDayBlur(which) {
    if (which === 'q1') {
      var v1 = parseInt(q1Text, 10);
      if (isNaN(v1) || v1 < 1 || v1 > 28) setQ1Text(String(prefs.q1Day));
    } else {
      var v2 = parseInt(q2Text, 10);
      if (isNaN(v2) || v2 < 1 || v2 > 28) setQ2Text(String(prefs.q2Day));
    }
  }
  function applyPreset(a, b) {
    haptic();
    patchPrefs({ q1Day: a, q2Day: b });
  }

  function guardarSalario() {
    haptic();
    // Limpia formato colombiano "1.750.905" o "1,750,905" o "$ 1.750.905"
    // antes de parsear. Sin esto, parseFloat("1.750.905") devuelve 1.75.
    var raw = String(tempSal == null ? '' : tempSal).replace(/[^\d]/g, '');
    var v = parseInt(raw, 10);
    if (isNaN(v) || v <= 0) v = SMIN;
    props.onSalario(v);
    setEditSal(false);
  }

  // Datos de identidad
  var isGuest = !session || session.guest;
  var emailMostrar = isGuest ? 'Modo invitado' : session.email || 'Usuario';
  // El nombre mostrado: prioriza el alias personal, luego email/invitado
  var displayName = pname || emailMostrar;
  // Inicial: del nombre personal si existe, si no del email
  var inicial =
    pname && pname.length > 0
      ? pname[0].toUpperCase()
      : isGuest
        ? '?'
        : session.email
          ? session.email[0].toUpperCase()
          : 'U';
  var estado = isGuest
    ? 'Datos en este dispositivo'
    : typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE
      ? 'Sincronizado en la nube'
      : 'Datos locales';

  return h(
    'section',
    { className: 'fadeUp ajustes-wrap', 'aria-label': 'Ajustes' },

    // ══════ PERFIL · iOS STYLE ══════
    // Layout horizontal: foto a la izquierda, nombre + datos a la derecha.
    // Inspirado en la app nativa de Ajustes de iOS.
    h(
      'div',
      { className: 'ajustes-profile' },

      // ── Avatar con badge ──
      h(
        'button',
        {
          className: 'ajustes-profile-av' + (photo ? ' has-photo' : ''),
          onClick: function () {
            haptic();
            if (photo) setShowPhotoSheet(true);
            else if (fileInputRef.current) fileInputRef.current.click();
          },
          'aria-label': photo ? 'Cambiar o eliminar foto' : 'Elegir foto de perfil'
        },
        photo
          ? h('img', {
              src: photo,
              alt: '',
              className: 'ajustes-profile-av-img',
              draggable: false
            })
          : h('span', { className: 'ajustes-profile-av-ini' }, inicial),
        h(
          'span',
          { className: 'ajustes-profile-av-badge', 'aria-hidden': 'true' },
          photo ? '📷' : '+'
        )
      ),

      // ── Columna derecha: nombre + email + estado ──
      h(
        'div',
        { className: 'ajustes-profile-info' },

        // Nombre — edición inline
        editName
          ? h(
              'div',
              { className: 'ajustes-profile-name-edit' },
              h('input', {
                type: 'text',
                inputMode: 'text',
                maxLength: 32,
                className: 'ajustes-edit-input',
                'aria-label': 'Tu nombre o apodo',
                value: tempName,
                autoFocus: true,
                placeholder: 'Tu nombre o apodo',
                onChange: function (e) { setTempName(e.target.value); },
                onKeyDown: function (e) {
                  if (e.key === 'Enter') guardarName();
                  if (e.key === 'Escape') setEditName(false);
                }
              }),
              h('button', {
                className: 'ajustes-edit-save',
                onClick: guardarName,
                'aria-label': 'Guardar nombre'
              }, '✓')
            )
          : h(
              'button',
              {
                className: 'ajustes-profile-name',
                onClick: abrirEditName,
                'aria-label': 'Editar tu nombre o apodo'
              },
              h('span', { className: 'ajustes-profile-name-txt' }, displayName),
              h('span', { className: 'ajustes-profile-name-pen', 'aria-hidden': 'true' }, '✎')
            ),

        // Email (si hay alias personalizado o usuario registrado)
        !editName && !isGuest && session.email
          ? h('div', { className: 'ajustes-profile-email' },
              pname ? session.email : 'Tocá para poner tu nombre')
          : !editName && isGuest
            ? h('div', { className: 'ajustes-profile-email' }, 'Modo invitado')
            : null,

        // Estado de sincronización — tappable, muestra banner de conexión
        h(
          'button',
          {
            className: 'ajustes-profile-status',
            onClick: function () {
              if (props.onRevealConn) props.onRevealConn();
            },
            'aria-label': 'Estado: ' + estado + '. Tocá para ver detalles de conexión.',
            title: 'Tocá para ver el estado de conexión'
          },
          h('span', { className: 'ajustes-profile-dot' + (isGuest ? ' off' : '') }),
          estado
        )
      )
    ),

    // Input file oculto (visibility hidden para que .click() funcione)
    h('input', {
      ref: fileInputRef,
      type: 'file',
      accept: 'image/*',
      style: { position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' },
      onChange: function (e) {
        var f = e.target.files && e.target.files[0];
        if (f) onPickPhoto(f);
        e.target.value = '';
      }
    }),

    // ══════ ACTION SHEET FOTO (estilo iOS) ══════
    showPhotoSheet
      ? h(
          'div',
          {
            className: 'mol-ov',
            onClick: function (e) {
              if (e.target === e.currentTarget) setShowPhotoSheet(false);
            }
          },
          h(
            'div',
            { className: 'mol-sh ajustes-photo-sheet' },
            h('div', { className: 'mol-hdl' }),
            h('div', { className: 'ajustes-photo-sheet-ttl' }, 'Foto de perfil'),
            h(
              'div',
              { className: 'ajustes-photo-sheet-grp' },
              h(
                'button',
                {
                  className: 'ajustes-photo-sheet-btn',
                  onClick: abrirGaleria
                },
                h('span', { className: 'ajustes-photo-sheet-ico' }, '📷'),
                'Cambiar foto'
              ),
              h(
                'button',
                {
                  className: 'ajustes-photo-sheet-btn danger',
                  onClick: eliminarFoto
                },
                h('span', { className: 'ajustes-photo-sheet-ico' }, '🗑'),
                'Eliminar foto'
              )
            ),
            h(
              'button',
              {
                className: 'ajustes-photo-sheet-cancel',
                onClick: function () {
                  setShowPhotoSheet(false);
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    // ══════ APARIENCIA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Apariencia'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, props.theme === 'dark' ? '☾' : '☀'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h(
              'div',
              { className: 'ajustes-row-ttl' },
              props.theme === 'dark' ? 'Modo oscuro' : 'Modo claro'
            ),
            h('div', { className: 'ajustes-row-sub' }, 'Cambia el aspecto de la app')
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              role: 'switch',
              'aria-checked': props.theme === 'dark',
              'aria-label': 'Modo oscuro, ' + (props.theme === 'dark' ? 'activado' : 'desactivado'),
              checked: props.theme === 'dark',
              onChange: function () {
                haptic();
                props.onThemeChange(props.theme === 'dark' ? 'light' : 'dark');
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        )
      )
    ),

    // ══════ NÓMINA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Nómina'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Salario base (fila expandible inline)
        h(
          'div',
          { className: 'ajustes-row-group' + (editSal ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                if (editSal) {
                  setEditSal(false);
                } else {
                  haptic();
                  setTempSal(String(salario));
                  setEditSal(true);
                }
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '$'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Salario base mensual'),
              h('div', { className: 'ajustes-row-sub' }, fCOP(salario))
            ),
            h('div', { className: 'ajustes-row-chev' }, editSal ? '−' : '✎')
          ),
          editSal &&
            h(
              'div',
              { className: 'ajustes-row-body' },
              h(
                'div',
                { className: 'ajustes-edit' },
                h('span', { className: 'ajustes-edit-prefix' }, '$'),
                h('input', {
                  type: 'text',
                  inputMode: 'numeric',
                  pattern: '[0-9.,$ ]*',
                  className: 'ajustes-edit-input',
                  'aria-label': 'Salario base mensual en pesos',
                  value: tempSal,
                  onChange: function (e) {
                    setTempSal(e.target.value);
                  },
                  onKeyDown: function (e) {
                    if (e.key === 'Enter') guardarSalario();
                  },
                  autoFocus: true,
                  placeholder: '1.300.000'
                }),
                h(
                  'button',
                  {
                    className: 'ajustes-edit-save',
                    onClick: guardarSalario,
                    'aria-label': 'Guardar'
                  },
                  '✓'
                )
              ),
              h(
                'p',
                { className: 'ajustes-edit-hint' },
                'Se usa para calcular tu valor hora y todos los recargos.'
              )
            )
        ),

        // Valor hora (read-only)
        h(
          'div',
          { className: 'ajustes-row ajustes-row-static' },
          h('div', { className: 'ajustes-row-ico soft' }, '◷'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Valor hora base'),
            h('div', { className: 'ajustes-row-sub' }, 'Se calcula automáticamente')
          ),
          h('div', { className: 'ajustes-row-val' }, fCOP(vh))
        )
      )
    ),

    // ══════ ESTIMACIÓN AVANZADA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Estimación avanzada'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Toggle: auxilio de transporte
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '🚌'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Auxilio de transporte'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Suma ' + fCOP(AUX_VAL) + ' al estimado (fijo 2026)'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              role: 'switch',
              'aria-checked': !!prefs.auxTransp,
              'aria-label':
                'Auxilio de transporte, ' + (prefs.auxTransp ? 'activado' : 'desactivado'),
              checked: !!prefs.auxTransp,
              onChange: function () {
                haptic();
                patchPrefs({ auxTransp: !prefs.auxTransp });
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        ),

        // Toggle: prestaciones aproximadas
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '✦'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Prestaciones aproximadas'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Cesantías, prima y vacaciones (~' + Math.round(PRES_PCT * 100) + '% del salario)'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              role: 'switch',
              'aria-checked': !!prefs.prestaciones,
              'aria-label':
                'Prestaciones aproximadas, ' + (prefs.prestaciones ? 'activado' : 'desactivado'),
              checked: !!prefs.prestaciones,
              onChange: function () {
                haptic();
                patchPrefs({ prestaciones: !prefs.prestaciones });
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        )
      ),
      h(
        'p',
        { className: 'ajustes-legal', style: { padding: '0 4px' } },
        'Son valores estimados. Pueden variar según tu empleador y las deducciones legales.'
      )
    ),

    // ══════ MODO QUINCENAL ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Modo quincenal'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Toggle quincena
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '◑'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Calcular por quincena'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Separa el estimado en Q1 y Q2 según tus fechas de pago'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              role: 'switch',
              'aria-checked': !!prefs.quincenaMode,
              'aria-label':
                'Calcular por quincena, ' + (prefs.quincenaMode ? 'activado' : 'desactivado'),
              checked: !!prefs.quincenaMode,
              onChange: function () {
                haptic();
                var next = !prefs.quincenaMode;
                patchPrefs({ quincenaMode: next });
                if (next) setOpenQuincena(true);
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        ),

        // Acordeón: días de quincena
        h(
          'div',
          { className: 'ajustes-row-group' + (openQuincena ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              disabled: !prefs.quincenaMode,
              onClick: function () {
                haptic();
                setOpenQuincena(!openQuincena);
              },
              style: prefs.quincenaMode ? null : { opacity: 0.55, cursor: 'not-allowed' }
            },
            h('div', { className: 'ajustes-row-ico soft' }, '📅'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Días de inicio'),
              h(
                'div',
                { className: 'ajustes-row-sub' },
                'Q1: día ' + prefs.q1Day + '  ·  Q2: día ' + prefs.q2Day
              )
            ),
            h('div', { className: 'ajustes-row-chev' }, openQuincena ? '−' : '+')
          ),
          openQuincena && prefs.quincenaMode
            ? h(
                'div',
                { className: 'ajustes-row-body' },
                h(
                  'div',
                  { className: 'ajustes-quincena-grid' },
                  h(
                    'label',
                    { className: 'ajustes-quincena-fld' },
                    h('span', { className: 'ajustes-quincena-lbl' }, 'Inicio Q1'),
                    h('input', {
                      type: 'number',
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      min: 1,
                      max: 28,
                      className: 'ajustes-edit-input',
                      'aria-label': 'Día de inicio de la primera quincena, del 1 al 28',
                      value: q1Text,
                      onFocus: function (e) {
                        e.target.select();
                      },
                      onChange: function (e) {
                        onDayTextChange('q1', e.target.value);
                      },
                      onBlur: function () {
                        onDayBlur('q1');
                      }
                    })
                  ),
                  h(
                    'label',
                    { className: 'ajustes-quincena-fld' },
                    h('span', { className: 'ajustes-quincena-lbl' }, 'Inicio Q2'),
                    h('input', {
                      type: 'number',
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      min: 1,
                      max: 28,
                      className: 'ajustes-edit-input',
                      'aria-label': 'Día de inicio de la segunda quincena, del 1 al 28',
                      value: q2Text,
                      onFocus: function (e) {
                        e.target.select();
                      },
                      onChange: function (e) {
                        onDayTextChange('q2', e.target.value);
                      },
                      onBlur: function () {
                        onDayBlur('q2');
                      }
                    })
                  )
                ),
                // Presets de pago más comunes en Colombia
                h(
                  'div',
                  { className: 'ajustes-quincena-presets' },
                  h('span', { className: 'ajustes-quincena-presets-lbl' }, 'Presets:'),
                  [
                    [1, 16],
                    [10, 25],
                    [15, 30]
                  ].map(function (p) {
                    var active = prefs.q1Day === p[0] && prefs.q2Day === p[1];
                    return h(
                      'button',
                      {
                        key: p[0] + '-' + p[1],
                        className: 'ajustes-quincena-preset' + (active ? ' on' : ''),
                        onClick: function () {
                          applyPreset(p[0], p[1]);
                        }
                      },
                      p[0] + ' / ' + p[1]
                    );
                  })
                ),
                h(
                  'p',
                  { className: 'ajustes-edit-hint' },
                  'Q1 va desde el día indicado hasta el inicio de Q2. El estimado se filtra automáticamente por la quincena activa.'
                )
              )
            : null
        )
      )
    ),

    // ══════ CUENTA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Cuenta'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap',
            onClick: function () {
              haptic();
              setShowMgtAcct(true);
            }
          },
          h('div', { className: 'ajustes-row-ico' }, '⚙'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Gestionar cuenta'),
            h('div', { className: 'ajustes-row-sub' }, 'PIN, correo y contraseña')
          ),
          h('div', { className: 'ajustes-row-chev' }, '›')
        ),
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap danger',
            onClick: function () {
              haptic();
              props.onSignOut();
            }
          },
          h('div', { className: 'ajustes-row-ico danger' }, '↩'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl danger' }, 'Cerrar sesión'),
            h('div', { className: 'ajustes-row-sub' }, 'Volverás a la pantalla de entrada')
          ),
          h('div', { className: 'ajustes-row-chev' }, '›')
        )
      )
    ),

    // ══════ DATOS · RESPALDO Y RESTAURACIÓN ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Datos'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap',
            onClick: function () {
              haptic();
              if (typeof backupExport === 'function') {
                var ok = backupExport();
                if (ok) {
                  backupMarkExported();
                  showToast && showToast('Respaldo descargado 📦', 'success');
                }
              }
            },
            'aria-label': 'Respaldar datos'
          },
          h('div', { className: 'ajustes-row-ico' }, '📦'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Respaldar datos'),
            h('div', { className: 'ajustes-row-sub' }, 'Guardá una copia de tus turnos y ajustes')
          ),
          h('div', { className: 'ajustes-row-chev' }, '↓')
        ),
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap',
            onClick: function () {
              haptic();
              if (typeof backupImport === 'function') {
                backupImport(function (ok, msg) {
                  if (ok) {
                    alert(msg + '\n\nLa app se recargará para aplicar los cambios.');
                    window.location.reload();
                  } else if (msg) {
                    alert(msg);
                  }
                });
              }
            },
            'aria-label': 'Restaurar datos'
          },
          h('div', { className: 'ajustes-row-ico' }, '📂'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Restaurar datos'),
            h('div', { className: 'ajustes-row-sub' }, 'Recuperá un respaldo anterior')
          ),
          h('div', { className: 'ajustes-row-chev' }, '↑')
        )
      )
    ),

    // ══════ PANEL ADMINISTRADOR ══════
    session &&
      session.isAdmin &&
      h(
        'div',
        { className: 'ajustes-section' },
        h('div', { className: 'ajustes-section-ttl' }, 'Administrador'),
        h(
          'div',
          { className: 'ajustes-list' },

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowUsuarios(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '👥'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Usuarios'),
              h('div', { className: 'ajustes-row-sub' }, 'Ver y gestionar todos los usuarios')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowPins(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '🔑'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Asignar PINs'),
              h('div', { className: 'ajustes-row-sub' }, 'Gestionar PINs de acceso')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowDiag(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '🛠'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Diagnóstico'),
              h('div', { className: 'ajustes-row-sub' }, 'Estado de sesiones y datos')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowErrorViewer(true);
              }
            },
            h('div', { className: 'ajustes-row-ico danger' }, '🐞'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Consola Dev'),
              h('div', { className: 'ajustes-row-sub' }, 'Registro de errores y depuración')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          )
        )
      ),

    // ══════ CÓMO SE CALCULA TU PAGO (acordeón con recargos) ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Cómo se calcula tu pago'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'div',
          { className: 'ajustes-row-group' + (openRec ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setOpenRec(!openRec);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '✦'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Tabla de recargos'),
              h('div', { className: 'ajustes-row-sub' }, 'Ley 2101/2021 · Toca para ver')
            ),
            h('div', { className: 'ajustes-row-chev' }, openRec ? '−' : '+')
          ),
          openRec &&
            h(
              'div',
              { className: 'ajustes-row-body' },
              h(
                'div',
                { className: 'ajustes-recargos' },
                Object.keys(RC).map(function (k) {
                  var r = RC[k];
                  return h(
                    'div',
                    { key: k, className: 'ajustes-recargo' },
                    h(
                      'span',
                      {
                        className: 'ajustes-recargo-chip',
                        style: { background: r.bg, border: '1px solid ' + r.bd, color: r.color }
                      },
                      r.icon
                    ),
                    h('span', { className: 'ajustes-recargo-lbl' }, r.label),
                    h(
                      'span',
                      {
                        className: 'ajustes-recargo-pct',
                        style: { color: r.color }
                      },
                      '+' + Math.round((r.factor - 1) * 100) + '%'
                    )
                  );
                })
              ),
              h(
                'p',
                { className: 'ajustes-legal' },
                'CST Arts. 168–171 · Calculados sobre el valor hora base.'
              )
            )
        )
      )
    ),

    // ══════ ACERCA DE / VERSIÓN ══════
    (function () {
      var localV = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'desconocida';

      // Construcción dinámica de la fila del botón según estado del check
      var btnIcon, btnTtl, btnSub, btnCls, btnIcoCls, btnDisabled, btnOnClick;
      if (updState.status === 'checking') {
        btnIcon = '⟳';
        btnTtl = 'Buscando…';
        btnSub = 'Consultando el servidor';
        btnCls = 'ajustes-row';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = true;
        btnOnClick = function () {};
      } else if (updState.status === 'uptodate') {
        btnIcon = '✓';
        btnTtl = 'Ya estás al día';
        btnSub = 'Última versión (' + updState.remote + ') · ' + updState.checkedAt;
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      } else if (updState.status === 'available') {
        btnIcon = '↑';
        btnTtl = 'Nueva versión ' + updState.remote;
        btnSub = 'Tocá para actualizar (estás en ' + localV + ')';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = applyUpdateNow;
      } else if (updState.status === 'error') {
        btnIcon = '!';
        btnTtl = 'No se pudo verificar';
        btnSub = 'Revisá tu conexión y tocá de nuevo';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico danger';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      } else {
        btnIcon = '⟳';
        btnTtl = 'Buscar actualización';
        btnSub = 'Verifica si hay una versión más reciente';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      }

      return h(
        'div',
        { className: 'ajustes-section' },
        h('div', { className: 'ajustes-section-ttl' }, 'Acerca de'),
        h(
          'div',
          { className: 'ajustes-list' },
          // Versión instalada (estática)
          h(
            'div',
            { className: 'ajustes-row ajustes-row-static' },
            h('div', { className: 'ajustes-row-ico soft' }, 'ⓘ'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Versión instalada'),
              h('div', { className: 'ajustes-row-sub' }, localV)
            ),
            h('div', { className: 'ajustes-row-val' }, 'PWA')
          ),
          // Botón de chequeo dinámico
          h(
            'button',
            {
              className: btnCls,
              disabled: btnDisabled,
              onClick: btnOnClick,
              style: btnDisabled ? { opacity: 0.6, cursor: 'wait' } : null
            },
            h(
              'div',
              {
                className: btnIcoCls,
                style:
                  updState.status === 'checking' ? { animation: 'spin 1s linear infinite' } : null
              },
              btnIcon
            ),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, btnTtl),
              h('div', { className: 'ajustes-row-sub' }, btnSub)
            ),
            updState.status === 'available'
              ? h(
                  'div',
                  {
                    className: 'ajustes-row-val',
                    style: { color: 'var(--accent)', fontSize: '13px' }
                  },
                  'Actualizar'
                )
              : h('div', { className: 'ajustes-row-chev' }, '›')
          ),
          // Instalar como app — sección expandible inline
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowInstall(function (v) {
                  return !v;
                });
              }
            },
            h('div', { className: 'ajustes-row-ico soft' }, '📲'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Agregar a inicio'),
              h(
                'div',
                { className: 'ajustes-row-sub' },
                'Usala como app nativa · sin abrir el navegador'
              )
            ),
            h('div', { className: 'ajustes-row-chev' }, showInstall ? '↓' : '›')
          ),
          showInstall &&
            h(
              'div',
              {
                style: {
                  padding: '16px 16px 20px',
                  background: 'var(--surface)',
                  borderRadius: '0 0 16px 16px',
                  borderTop: '1px solid var(--border)',
                  marginTop: '-4px'
                }
              },
              // Por qué
              h(
                'div',
                {
                  style: {
                    fontSize: '14px',
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    marginBottom: '20px'
                  }
                },
                'Al agregarla a tu pantalla de inicio se abre sin el navegador, ocupa casi nada y funciona sin internet. Igual que una app de la tienda, pero gratis.'
              ),
              // Chips beneficios
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '24px'
                  }
                },
                [
                  '⚡ Abre al instante',
                  '📴 Sin internet',
                  '🔔 Sin distracciones',
                  '💾 Sin espacio extra'
                ].map(function (txt) {
                  return h(
                    'div',
                    {
                      key: txt,
                      style: {
                        padding: '10px 8px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-2)'
                      }
                    },
                    txt
                  );
                })
              ),
              // Pasos según plataforma
              (function () {
                var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
                var pasos = isIOS
                  ? [
                      { n: 1, ico: '⬆️', txt: 'Tocá el botón Compartir en la barra del navegador' },
                      { n: 2, ico: '➕', txt: 'Deslizá y elegí "Añadir a pantalla de inicio"' },
                      { n: 3, ico: '✅', txt: 'Tocá "Añadir" — ¡listo, ya aparece en tu inicio!' }
                    ]
                  : [
                      {
                        n: 1,
                        ico: '⋮',
                        txt: 'Tocá los tres puntos en la esquina superior derecha de Chrome'
                      },
                      {
                        n: 2,
                        ico: '➕',
                        txt: 'Tocá "Agregar a pantalla de inicio" o "Instalar app"'
                      },
                      {
                        n: 3,
                        ico: '✅',
                        txt: 'Confirmá — el ícono aparece en tu pantalla de inicio'
                      }
                    ];
                return h(
                  'div',
                  null,
                  h(
                    'div',
                    {
                      style: {
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--text-1)',
                        marginBottom: '14px'
                      }
                    },
                    isIOS ? '3 pasos en iPhone / iPad' : '3 pasos en Android'
                  ),
                  pasos.map(function (p) {
                    return h(
                      'div',
                      {
                        key: p.n,
                        style: {
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '14px'
                        }
                      },
                      h(
                        'div',
                        {
                          style: {
                            minWidth: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0
                          }
                        },
                        String(p.n)
                      ),
                      h(
                        'div',
                        { style: { paddingTop: '3px' } },
                        h('div', { style: { fontSize: '18px', marginBottom: '2px' } }, p.ico),
                        h(
                          'div',
                          { style: { fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.4 } },
                          p.txt
                        )
                      )
                    );
                  })
                );
              })()
            ),
          // Reinicio completo (limpia cache + SW) — fallback nuclear
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                if (
                  !window.confirm(
                    'Esto borrará el caché de la app y la recargará desde cero. ' +
                      'Tus turnos y configuración NO se pierden. ¿Continuar?'
                  )
                )
                  return;
                try {
                  if (window._mtHardReset) {
                    window._mtHardReset('Reiniciando app…');
                    return;
                  }
                } catch (_) {}
                window.location.reload();
              }
            },
            h('div', { className: 'ajustes-row-ico danger' }, '⟲'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Reiniciar app'),
              h(
                'div',
                { className: 'ajustes-row-sub' },
                'Borra el caché y descarga todo desde cero (no pierde datos)'
              )
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          )
        )
      );
    })(),

    // ══════ FOOTER ══════
    h(
      'div',
      { className: 'ajustes-footer' },
      h('div', { className: 'ajustes-footer-brand' }, 'Mi Turno'),
      h(
        'div',
        { className: 'ajustes-footer-sub' },
        'Colombia · Nómina inteligente · ' +
          (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : '')
      )
    ),

    // Modal Gestionar cuenta
    showMgtAcct &&
      typeof ManageAccountModal !== 'undefined' &&
      h(ManageAccountModal, {
        session: session,
        onSessionPatch: props.onSessionPatch,
        onClose: function () {
          setShowMgtAcct(false);
        }
      }),

    // Modales admin
    showUsuarios &&
      typeof UsuariosModal !== 'undefined' &&
      h(UsuariosModal, {
        session: session,
        onClose: function () {
          setShowUsuarios(false);
        }
      }),

    showPins &&
      typeof AsignarPINsModal !== 'undefined' &&
      h(AsignarPINsModal, {
        session: session,
        onClose: function () {
          setShowPins(false);
        }
      }),

    showDiag &&
      typeof DiagnosticoModal !== 'undefined' &&
      h(DiagnosticoModal, {
        session: session,
        onClose: function () {
          setShowDiag(false);
        }
      }),

    showErrorViewer &&
      typeof ErrorViewerModal !== 'undefined' &&
      h(ErrorViewerModal, {
        session: session,
        onClose: function () {
          setShowErrorViewer(false);
        }
      }),

    false // (install guide ahora es inline, no modal)
  );
}


// ── js/tabs/sync-queue.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/sync-queue.js
//  Cola de sincronización offline-first para Supabase
//
//  Patrón (web research 2026, ver "JS PWAs at Scale: Offline Sync"):
//   1. queueAction()  → encola Y dispara _scheduleFlush (debounced)
//   2. _scheduleFlush → setTimeout 250 ms para coalescer ráfagas
//                       (ej. parar turno = insertTurno + setActivo null)
//   3. processQueue   → IN_FLIGHT guard para evitar runs concurrentes
//   4. onOnline       → re-flush cuando la red vuelve
//   5. Errores permanentes (23505) se descartan; transitorios reintentan
// ════════════════════════════════════════════════════════════════

var _SYNC_QUEUE_KEY = 'mt_sync_queue';
var _flushTimers = {}; // uid → timeout id (debounce)
var _processingFlags = {}; // uid → bool (IN_FLIGHT)

// Carga la cola de sincronización para un UID específico
function _loadSyncQueue(uid) {
  try {
    var allQueues = leer(_SYNC_QUEUE_KEY, {});
    return allQueues[uid] || [];
  } catch (e) {
    console.error('[SyncQueue] Error al cargar cola:', e);
    return [];
  }
}

// Guarda la cola de sincronización para un UID específico
function _saveSyncQueue(uid, queue) {
  try {
    var allQueues = leer(_SYNC_QUEUE_KEY, {});
    allQueues[uid] = queue;
    grabar(_SYNC_QUEUE_KEY, allQueues);
    // Notificar al indicador de sync que la cola cambió
    if (typeof window.__updateQueueCount === 'function') {
      window.__updateQueueCount();
    }
  } catch (e) {
    console.error('[SyncQueue] Error al guardar cola:', e);
  }
}

// Añade una acción a la cola Y dispara un flush inmediato (debounced
// 250 ms) para que el dato llegue a Supabase ahora — no en el próximo
// reload. Sin esto las acciones quedaban estancadas en localStorage
// y los otros devices nunca veían el cambio (causa raíz de v39).
function queueAction(uid, actionType, payload) {
  if (!uid) {
    console.warn('[SyncQueue] UID no proporcionado para queueAction. Acción ignorada.');
    return;
  }
  var queue = _loadSyncQueue(uid);
  queue.push({ id: generateUUID(), timestamp: Date.now(), actionType, payload });
  _saveSyncQueue(uid, queue);
  console.log('[SyncQueue] Acción encolada:', actionType, payload);
  _scheduleFlush(uid);
}

// Debounce per-uid: si vienen varias acciones en menos de 250 ms (caso
// típico: parar turno encola insertTurno + setActivo null casi juntos)
// se procesan en una sola pasada.
function _scheduleFlush(uid) {
  if (!uid) return;
  if (_flushTimers[uid]) return; // ya hay uno agendado
  _flushTimers[uid] = setTimeout(function () {
    _flushTimers[uid] = null;
    processQueue(uid);
  }, 250);
}

// Procesa la cola de sincronización
async function processQueue(uid) {
  if (!uid || !isOnline() || !CLOUD_MODE || !SUPA) {
    return; // No hay UID, offline, o no hay Supabase
  }
  // IN_FLIGHT guard: evita que dos invocaciones concurrentes
  // (boot + queueAction + onOnline en milisegundos) procesen lo
  // mismo dos veces — fuente clásica de duplicados.
  if (_processingFlags[uid]) {
    console.log('[SyncQueue] Ya hay un flush en curso para', uid, '— saltando');
    return;
  }
  _processingFlags[uid] = true;

  // Auth-gate: si Supabase no tiene sesión autenticada (p. ej. se entró por
  // PIN sin restaurar tokens, o tras un logout) NO machacamos la cola contra
  // RLS en bucle — eso dejaba el LED ámbar pegado para siempre. La dejamos
  // intacta; se vacía cuando vuelve la auth (root.js dispara processQueue en
  // SIGNED_IN / TOKEN_REFRESHED) o cuando vuelve la red (onOnline).
  try {
    var _authed = await withTimeout(SUPA.auth.getSession(), 6000, 'auth-gate cola');
    if (!_authed || !_authed.data || !_authed.data.session) {
      _processingFlags[uid] = false;
      return;
    }
  } catch (_) {
    _processingFlags[uid] = false;
    return;
  }

  var queue = _loadSyncQueue(uid);
  if (queue.length === 0) {
    _processingFlags[uid] = false;
    return; // Cola vacía
  }

  console.log(
    '[SyncQueue] Procesando cola de sincronización para UID:',
    uid,
    '(',
    queue.length,
    'acciones)'
  );

  var successfulActions = [];
  for (var i = 0; i < queue.length; i++) {
    var action = queue[i];
    try {
      var result;
      switch (action.actionType) {
        case 'insertTurno':
          result = await supaInsertTurno(uid, action.payload);
          break;
        case 'setActivo':
          result = await supaSetActivo(uid, action.payload);
          break;
        case 'deleteTurno':
          result = await supaDeleteTurno(uid, action.payload.id);
          break;
        case 'deleteAllTurnos':
          result = await supaDeleteAllTurnos(uid);
          break;
        case 'setSalario':
          result = await supaSetSalario(uid, action.payload.salario);
          break;
        case 'updatePinLookup':
          result = await supaUpdatePinLookup(uid, action.payload);
          break;
        case 'propagateEmail':
          result = await supaPropagateEmail(uid, action.payload);
          break;
        default:
          console.warn('[SyncQueue] Tipo de acción desconocido:', action.actionType);
          result = { success: true }; // Para eliminar acciones desconocidas
      }
      if (result && result.success) {
        successfulActions.push(action.id);
        console.log('[SyncQueue] Acción sincronizada con éxito:', action.actionType);
      } else if (result && result.permanent) {
        // Errores permanentes (ej. PIN duplicado): descartar la acción
        // para no reintentarla eternamente. El usuario verá un toast
        // y deberá elegir otro PIN desde la UI.
        successfulActions.push(action.id);
        console.warn(
          '[SyncQueue] Acción descartada (error permanente):',
          action.actionType,
          result.error
        );
        try {
          var msg =
            action.actionType === 'updatePinLookup'
              ? 'Tu PIN nuevo ya estaba en uso por otra cuenta. Configurá otro desde Ajustes.'
              : 'Cambio rechazado por el servidor.';
          // Toast diferido para no chocar con otras notificaciones
          setTimeout(function () {
            if (typeof window.showToast === 'function') window.showToast(msg);
          }, 600);
        } catch (_) {}
      } else {
        console.warn(
          '[SyncQueue] Fallo al sincronizar acción:',
          action.actionType,
          result.error || 'Error desconocido'
        );
        // Si falla, no la eliminamos de la cola para reintentar más tarde
      }
    } catch (e) {
      console.error('[SyncQueue] Error al ejecutar acción de cola:', action.actionType, e);
      // Si hay un error, no la eliminamos de la cola para reintentar más tarde
    }
  }

  // Eliminar solo las acciones que fueron exitosas
  var newQueue = queue.filter(function (a) {
    return successfulActions.indexOf(a.id) === -1;
  });
  _saveSyncQueue(uid, newQueue);
  if (newQueue.length < queue.length) {
    console.log('[SyncQueue] Cola actualizada. Acciones restantes:', newQueue.length);
  }
  _processingFlags[uid] = false;
  // Si alguna acción falló pero es transitoria, re-agendamos otro
  // intento en 5 s. Sin esto la cola se quedaba estancada hasta el
  // próximo reload / cambio de red.
  if (newQueue.length > 0) {
    setTimeout(function () {
      _scheduleFlush(uid);
    }, 5000);
  }
}

// Limpia la cola de sincronización para un UID específico
function clearSyncQueue(uid) {
  if (!uid) return;
  var allQueues = leer(_SYNC_QUEUE_KEY, {});
  delete allQueues[uid];
  grabar(_SYNC_QUEUE_KEY, allQueues);
  console.log('[SyncQueue] Cola de sincronización limpiada para UID:', uid);
}


// ── js/modals/error-viewer.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/error-viewer.js
//  Modal para visualizar errores de runtime capturados
// ════════════════════════════════════════════════════════════════

function ErrorViewerModal(props) {
  var s1 = useState(getErrors());
  var errors = s1[0], setErrors = s1[1];
  var s2 = useState(null);
  var selectedError = s2[0], setSelectedError = s2[1];
  var s3 = useState(null);
  var sourceCode = s3[0], setSourceCode = s3[1];
  var s4 = useState(false);
  var loadingSource = s4[0], setLoadingSource = s4[1];
  var s5 = useState(null);
  var sourceError = s5[0], setSourceError = s5[1];
  var s6 = useState('');
  var devQuery = s6[0], setDevQuery = s6[1];
  var s7 = useState(null);
  var aiAdvice = s7[0], setAiAdvice = s7[1];

  var scrollRef = useRef(null);

  // Suscribirse a los cambios en el logger de errores
  useEffect(
    function () {
      function updateErrors(newErrors) {
        setErrors(newErrors);
        // Si el error seleccionado ya no existe, deseleccionarlo
        if (selectedError && !newErrors.some(function(e) { return e.id === selectedError.id; })) {
          setSelectedError(null);
          setSourceCode(null);
        }
      }
      addErrorListener(updateErrors);
      return function () {
        removeErrorListener(updateErrors);
      };
    },
    [selectedError]
  );

  // Cargar el código fuente cuando se selecciona un error
  useEffect(
    function () {
      if (
        !selectedError ||
        !selectedError.filename ||
        selectedError.filename === 'Promise Rejection' ||
        selectedError.filename === 'unknown'
      ) {
        setSourceCode(null);
        setSourceError(null);
        return;
      }

      setLoadingSource(true);
      setSourceError(null);
      setSourceCode(null);

      // Normalizar la URL del archivo
      var filename = selectedError.filename;
      // Eliminar el origen si es local para que fetch funcione correctamente
      if (filename.startsWith(window.location.origin)) {
        filename = filename.substring(window.location.origin.length);
      }
      // Asegurarse de que la ruta sea relativa y no absoluta si ya lo es
      if (filename.startsWith('/')) {
        filename = filename.substring(1);
      }

      fetch(filename)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('No se pudo cargar el archivo: ' + response.statusText);
          }
          return response.text();
        })
        .then(function (text) {
          setSourceCode(text.split('\n'));
        })
        .catch(function (e) {
          setSourceError('Error al cargar el código fuente: ' + e.message);
        })
        .finally(function () {
          setLoadingSource(false);
        });
    },
    [selectedError]
  );

  // Scroll al error seleccionado en el código fuente
  useEffect(
    function () {
      if (sourceCode && selectedError && selectedError.lineno > 0 && scrollRef.current) {
        // Pequeño retraso para asegurar que el DOM se haya renderizado
        setTimeout(function() {
          var lineElement = scrollRef.current.querySelector('.code-line-' + selectedError.lineno);
          if (lineElement) {
            lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    },
    [sourceCode, selectedError]
  );

  function handleClearAll() {
    haptic();
    if (confirm('¿Estás seguro de que quieres borrar todos los logs de errores?')) {
      clearErrors();
      setSelectedError(null);
      setSourceCode(null);
      setSourceError(null);
    }
  }

  function handleSelectError(error) {
    haptic();
    setSelectedError(error);
  }

  function handleAskAI() {
    haptic();
    if (!devQuery.trim()) return;
    // Estado enriquecido para la IA
    var resp = aiAnswer(devQuery, {
      turnos: [],
      calc: { totalMins: 0, totalCOP: 0, bd: {} },
      online: navigator.onLine,
      lastError: selectedError,
      session: props.session
    });
    // Asegurar que la respuesta sea un string (por si devuelve un objeto de acción)
    setAiAdvice(typeof resp === 'object' ? resp.text : String(resp));
  }

  function handleCloseSource() {
    haptic();
    setSelectedError(null);
    setSourceCode(null);
    setSourceError(null);
  }

  return h(
    'div',
    { className: 'modal-card', style: { maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }
      },
      h(
        'div',
        null,
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }
          },
          h('span', { style: { fontSize: 22 } }, '🐞'),
          h('span', null, 'Consola de Desarrollo')
        ),
        h(
          'div',
          { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
          'Diagnóstico técnico y sugerencias de código'
        )
      ),
      h(
        'button',
        {
          onClick: function () {
            haptic();
            props.onClose();
          },
          style: {
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }
        },
        '×'
      )
    ),

    // Nueva sección: Consultor de Código
    h(
      'div',
      {
        style: {
          background: 'var(--surface2)',
          padding: 12,
          borderRadius: 'var(--radius)',
          marginBottom: 20,
          border: '1px dashed var(--border)'
        }
      },
      h(
        'div',
        {
          style: {
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: 8,
            textTransform: 'uppercase'
          }
        },
        'Asistente de Arquitectura'
      ),
      h(
        'div',
        { style: { display: 'flex', gap: 8 } },
        h('input', {
          className: 'input',
          placeholder: 'Ej: ¿Donde cambio el emoji del inicio?',
          value: devQuery,
          onChange: function(e) { return setDevQuery(e.target.value); },
          onKeyDown: function(e) { return e.key === 'Enter' && handleAskAI(); },
          style: { fontSize: 12 }
        }),
        h(
          'button',
          { className: 'btn btn-accent', onClick: handleAskAI, style: { padding: '0 12px' } },
          'Preguntar'
        )
      ),
      aiAdvice &&
        h(
          'div',
          {
            style: {
              marginTop: 10,
              fontSize: 11.5,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              background: 'var(--surface)',
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--accent)'
            }
          },
          aiAdvice
        )
    ),

    selectedError
      ? h(
          'div',
          { className: 'error-detail-view' },
          h(
            'button',
            {
              className: 'btn btn-ghost',
              onClick: handleCloseSource,
              style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }
            },
            '← Volver a la lista'
          ),
          h(
            'div',
            { style: { fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 } },
            selectedError.message
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 } },
            'Tipo: ',
            selectedError.type,
            ' · ',
            new Date(selectedError.timestamp).toLocaleString('es-CO')
          ),
          h(
            'div',
            { style: { fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 } },
            'Ubicación:'
          ),
          h(
            'div',
            {
              style: {
                fontSize: 11,
                color: 'var(--muted)',
                fontFamily: 'monospace',
                marginBottom: 16,
                background: 'var(--surface2)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto'
              }
            },
            selectedError.filename,
            ':',
            selectedError.lineno,
            ':',
            selectedError.colno
          ),

          loadingSource
            ? h(
                'div',
                { style: { textAlign: 'center', padding: '20px 0', color: 'var(--muted)' } },
                h('span', { className: 'sp-in' }),
                h('div', { style: { marginTop: 8, fontSize: 12 } }, 'Cargando código fuente...')
              )
            : sourceError
              ? h(
                  'div',
                  {
                    style: {
                      padding: 12,
                      background: 'var(--danger-dim)',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12.5
                    }
                  },
                  sourceError
                )
              : sourceCode
                ? h(
                    'div',
                    { className: 'code-viewer', ref: scrollRef },
                    h(
                      'pre',
                      null,
                      h(
                        'code',
                        null,
                        sourceCode.map(function (line, idx) {
                          var lineNumber = idx + 1;
                          var isErrorLine = lineNumber === selectedError.lineno;
                          return h(
                            'div',
                            {
                              key: idx,
                              className:
                                'code-line ' +
                                (isErrorLine
                                  ? 'code-line-error code-line-' + lineNumber
                                  : 'code-line-' + lineNumber),
                              style: {
                                background: isErrorLine ? 'var(--danger-dim)' : 'transparent',
                                borderLeft: isErrorLine
                                  ? '3px solid var(--danger)'
                                  : '3px solid transparent',
                                paddingLeft: isErrorLine ? '9px' : '12px',
                                display: 'flex',
                                alignItems: 'flex-start'
                              }
                            },
                            h(
                              'span',
                              {
                                style: {
                                  color: 'var(--muted)',
                                  width: '3em',
                                  flexShrink: 0,
                                  textAlign: 'right',
                                  marginRight: '1em',
                                  opacity: 0.7
                                }
                              },
                              lineNumber
                            ),
                            h(
                              'span',
                              {
                                style: {
                                  flexGrow: 1,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all'
                                }
                              },
                              line
                            )
                          );
                        })
                      )
                    )
                  )
                : h(
                    'div',
                    {
                      style: {
                        padding: 12,
                        background: 'var(--surface2)',
                        color: 'var(--muted)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5
                      }
                    },
                    'No se pudo cargar el código fuente o no es aplicable para este tipo de error.'
                  ),
          h(
            'div',
            {
              style: {
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: 16,
                marginBottom: 6
              }
            },
            'Stack Trace:'
          ),
          h(
            'pre',
            {
              style: {
                fontSize: 10.5,
                color: 'var(--muted)',
                fontFamily: 'monospace',
                background: 'var(--surface2)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }
            },
            selectedError.stack
          )
        )
      : h(
          'div',
          null,
          errors.length === 0
            ? h(
                'div',
                { style: { textAlign: 'center', padding: '40px 0', color: 'var(--muted)' } },
                h('span', { style: { fontSize: 38, marginBottom: 10, display: 'block' } }, '✨'),
                h('div', { style: { fontSize: 14, fontWeight: 600 } }, '¡Todo limpio!'),
                h(
                  'div',
                  { style: { fontSize: 12, marginTop: 4 } },
                  'No se han detectado errores de runtime.'
                )
              )
            : h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } },
                errors.map(function (err) {
                  return h(
                    'div',
                    {
                      key: err.id,
                      onClick: function () {
                        handleSelectError(err);
                      },
                      style: {
                        padding: '12px 14px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 4,
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }
                    },
                    h(
                      'button',
                      {
                        'aria-label': 'Eliminar error',
                        onClick: function (ev) {
                          ev.stopPropagation();
                          haptic();
                          if (typeof deleteError === 'function') deleteError(err.id);
                        },
                        style: {
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--surface2)',
                          border: 'none',
                          color: 'var(--muted)',
                          fontSize: 15,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10
                        }
                      },
                      '×'
                    ),
                    h(
                      'div',
                      {
                        style: {
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          paddingRight: 24
                        }
                      },
                      err.message
                    ),
                    h(
                      'div',
                      { style: { fontSize: 10.5, color: 'var(--muted)' } },
                      err.filename,
                      ':',
                      err.lineno
                    ),
                    h(
                      'div',
                      { style: { fontSize: 9.5, color: 'var(--muted)', opacity: 0.7 } },
                      new Date(err.timestamp).toLocaleString('es-CO')
                    )
                  );
                })
              ),
          errors.length > 0
            ? h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  onClick: handleClearAll,
                  style: { marginTop: 12, color: 'var(--danger)' }
                },
                '🗑 Borrar todos los logs'
              )
            : null
        )
  );
}


// ── js/modals/splash.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/splash.js
//  Componente de pantalla de carga inicial
// ════════════════════════════════════════════════════════════════
function SplashScreen(props) {
  var cls = 'splash' + (props.exit ? ' splash--exit' : '') + (props.plain ? ' splash--plain' : '');
  return h(
    'div',
    { className: cls },
    h(
      'div',
      { className: 'sp-logo-wrap' },
      h('img', {
        src: 'img/logo-mark.svg',
        className: 'sp-logo',
        alt: 'Mi Turno',
        draggable: false
      }),
      h('span', { className: 'sp-glow' }),
      h('span', { className: 'sp-ping' }),
      h('span', { className: 'sp-ping-2' })
    ),
    h('div', { className: 'sp-ttl' }, 'Mi Turno'),
    h('div', { className: 'sp-sub' }, 'Colombia · Nómina inteligente'),
    h(
      'div',
      { className: 'sp-dots' },
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' })
    )
  );
}

// ── js/modals/email-compose-card.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/email-compose-card.js
//  Tarjeta de composición de correo (inline en el chat del asistente).
//  Extraído de tabs/assistant.js en v48 (refactor por tamaño).
//  Depende globalmente de: useState, h, haptic, CLOUD_MODE,
//  enviarReportePorEmail, exportPDFBase64, exportExcelBase64.
// ════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  TARJETA DE COMPOSICIÓN DE CORREO (inline en el chat)
// ═══════════════════════════════════════════════════════════════
function EmailComposeCard(props) {
  var to = useState(props.data.to || '');
  var subject = useState(props.data.subject || '');
  var body = useState(props.data.body || '');
  var format = useState(props.data.format || 'pdf');
  var attach = useState(props.data.attach !== false);
  var status = useState('edit'); // edit | sending | done | error
  var err = useState(null);

  var cloud = typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE;
  var canSend =
    cloud &&
    to[0].trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to[0].trim()) &&
    subject[0].trim() &&
    body[0].trim();

  function doSend() {
    if (!canSend || status[0] === 'sending') return;
    haptic();
    status[1]('sending');
    err[1](null);
    try {
      var fileBase64 = '';
      var filename =
        'mi-turno-reporte-' +
        new Date().toISOString().slice(0, 10) +
        '.' +
        (format[0] === 'pdf' ? 'pdf' : 'xlsx');
      if (attach[0]) {
        var turnosParaExport = props.parent.turnosAll || props.parent.turnos;
        var calcAdapt = {
          total: props.parent.calc.totalCOP,
          totalMin: props.parent.calc.totalMins
        };
        if (format[0] === 'pdf')
          fileBase64 = exportPDFBase64(turnosParaExport, calcAdapt, props.parent.salario);
        else fileBase64 = exportExcelBase64(turnosParaExport, calcAdapt, props.parent.salario);
      } else {
        fileBase64 = exportPDFBase64([], { total: 0, totalMin: 0 }, props.parent.salario);
        filename = 'mi-turno-sin-adjunto.pdf';
      }

      enviarReportePorEmail({
        to: to[0].trim(),
        format: format[0],
        filename: filename,
        fileBase64: fileBase64,
        subject: subject[0].trim(),
        message: body[0]
      })
        .then(function () {
          status[1]('done');
          if (props.onResolved) props.onResolved({ ok: true, to: to[0].trim() });
        })
        .catch(function (e) {
          status[1]('error');
          err[1](e.message || 'Error al enviar');
        });
    } catch (e) {
      status[1]('error');
      err[1]('No pude generar el archivo: ' + (e.message || 'error desconocido'));
    }
  }

  function discard() {
    haptic();
    if (props.onResolved) props.onResolved({ ok: false, cancelled: true });
  }

  if (status[0] === 'done') {
    return h(
      'div',
      { className: 'email-card email-card-done' },
      h('div', { className: 'email-card-ico' }, '✅'),
      h(
        'div',
        { className: 'email-card-msg' },
        h('strong', null, 'Solicitud enviada.'),
        ' El equipo de Mi Turno te reenviará el reporte a ',
        h('span', { style: { color: 'var(--accent)' } }, to[0]),
        ' en breve.'
      )
    );
  }
  if (status[0] === 'sending') {
    return h(
      'div',
      { className: 'email-card email-card-sending' },
      h('span', { className: 'sp-in', style: { fontSize: 18 } }),
      h('span', { style: { color: 'var(--muted)' } }, 'Procesando solicitud...')
    );
  }

  return h(
    'div',
    { className: 'email-card' },
    h(
      'div',
      { className: 'email-card-hdr' },
      h('div', { className: 'email-card-hdr-ico' }, '✉'),
      h(
        'div',
        { style: { flex: 1 } },
        h('div', { className: 'email-card-ttl' }, 'Nuevo correo'),
        h('div', { className: 'email-card-sub' }, 'El equipo de Mi Turno lo reenviará a tu correo')
      )
    ),

    !cloud
      ? h(
          'div',
          { className: 'email-card-warn' },
          '⚠ Necesitas modo cloud activo para enviar correos.'
        )
      : null,

    h('label', { className: 'email-card-lbl' }, 'PARA'),
    h('input', {
      type: 'email',
      className: 'email-card-inp',
      value: to[0],
      placeholder: 'destinatario@correo.com',
      onChange: function (e) {
        to[1](e.target.value);
      }
    }),

    h('label', { className: 'email-card-lbl' }, 'ASUNTO'),
    h('input', {
      type: 'text',
      className: 'email-card-inp',
      value: subject[0],
      onChange: function (e) {
        subject[1](e.target.value);
      }
    }),

    h('label', { className: 'email-card-lbl' }, 'MENSAJE'),
    h('textarea', {
      className: 'email-card-txt',
      value: body[0],
      rows: 8,
      onChange: function (e) {
        body[1](e.target.value);
      }
    }),

    h(
      'div',
      { className: 'email-card-opts' },
      h(
        'label',
        { className: 'email-card-opt' },
        h('input', {
          type: 'checkbox',
          checked: attach[0],
          onChange: function (e) {
            attach[1](e.target.checked);
          }
        }),
        h('span', null, 'Adjuntar reporte')
      ),
      attach[0]
        ? h(
            'div',
            { className: 'email-card-fmt' },
            h(
              'button',
              {
                className: 'email-card-fmt-btn' + (format[0] === 'pdf' ? ' on' : ''),
                onClick: function () {
                  haptic();
                  format[1]('pdf');
                }
              },
              '📄 PDF'
            ),
            h(
              'button',
              {
                className: 'email-card-fmt-btn' + (format[0] === 'xlsx' ? ' on' : ''),
                onClick: function () {
                  haptic();
                  format[1]('xlsx');
                }
              },
              '📊 Excel'
            )
          )
        : null
    ),

    err[0] ? h('div', { className: 'email-card-err' }, err[0]) : null,

    h(
      'div',
      { className: 'email-card-actions' },
      h(
        'button',
        { className: 'email-card-btn email-card-btn-ghost', onClick: discard },
        'Descartar'
      ),
      h(
        'button',
        {
          className: 'email-card-btn email-card-btn-send',
          onClick: doSend,
          disabled: !canSend
        },
        '📤 Enviar'
      )
    )
  );
}


// ── js/modals/forgot-password.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/forgot-password.js
//  Modal para gestionar turnos olvidados (más de 12 horas activos)
// ════════════════════════════════════════════════════════════════
function ModalOlvidado(props) {
  var ini = new Date(props.inicio);
  var sug = new Date(ini.getTime() + 8 * 3600000);
  var hs = useState(String(Math.min(sug.getHours(), 23)).padStart(2, '0'));
  var ms = useState(String(sug.getMinutes()).padStart(2, '0'));
  var hora = hs[0],
    setH = hs[1];
  var min = ms[0],
    setM = ms[1];
  var opH = Array.from({ length: 24 }, function (_, i) {
    return String(i).padStart(2, '0');
  });
  var opM = Array.from({ length: 60 }, function (_, i) {
    return String(i).padStart(2, '0');
  });
  function guardar() {
    haptic();
    var fin = new Date(ini);
    fin.setHours(parseInt(hora), parseInt(min), 0, 0);
    if (fin <= ini) fin.setDate(fin.getDate() + 1);
    props.onGuardar(fin.toISOString());
  }
  return h(
    'div',
    {
      className: 'mol-ov',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Registrar hora de fin del turno'
    },
    h(
      'div',
      { className: 'mol-sh' },
      h('div', { className: 'mol-hdl' }),
      h(
        'div',
        { style: { textAlign: 'center' } },
        h('div', { style: { fontSize: 38, marginBottom: 10, opacity: 0.85 } }, '⏰'),
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text)',
              marginBottom: 6
            }
          },
          'Más de 12h en turno'
        ),
        h(
          'div',
          { style: { fontSize: 12, color: 'var(--muted)', fontWeight: 500 } },
          'Inicio: ',
          ini.toLocaleString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        )
      ),
      h(
        'div',
        {
          style: {
            fontSize: 12.5,
            color: 'var(--text)',
            fontWeight: 600,
            marginTop: 18,
            textAlign: 'center'
          }
        },
        '¿A qué hora terminaste?'
      ),
      h(
        'div',
        { className: 'time-row' },
        h(
          'div',
          { className: 'time-col' },
          h('div', { className: 'time-col-lbl' }, 'Hora'),
          h(
            'select',
            {
              className: 'ios-sel',
              'aria-label': 'Hora',
              value: hora,
              onChange: function (e) {
                haptic();
                setH(e.target.value);
              }
            },
            opH.map(function (v) {
              return h('option', { key: v, value: v }, v);
            })
          )
        ),
        h('span', { className: 'colon' }, ':'),
        h(
          'div',
          { className: 'time-col' },
          h('div', { className: 'time-col-lbl' }, 'Min'),
          h(
            'select',
            {
              className: 'ios-sel',
              'aria-label': 'Minutos',
              value: min,
              onChange: function (e) {
                haptic();
                setM(e.target.value);
              }
            },
            opM.map(function (v) {
              return h('option', { key: v, value: v }, v);
            })
          )
        )
      ),
      h(
        'button',
        { className: 'btn btn-accent btn-block', onClick: guardar, style: { marginBottom: 8 } },
        'Guardar turno'
      ),
      h(
        'button',
        {
          className: 'btn btn-ghost btn-block',
          onClick: function () {
            haptic();
            props.onContinuar();
          }
        },
        'Sigue activo'
      )
    )
  );
}


// ── js/modals/forgot-pin.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/forgot-pin.js
//  Recuperación de PIN — flujo estructurado:
//   1) creds:    pide los OTROS 2 datos (correo + contraseña)
//                Valida vía Supabase signInWithPassword.
//   2) prep:     espera local de 15 s con barra + contador
//                (mismo lenguaje visual del OTP del ManageAccount)
//   3) codigo:   revela código de 6 dígitos generado localmente;
//                el usuario lo reescribe para confirmar intención
//   4) newpin:   2 pasos — escribir PIN nuevo + confirmar
//                Guarda en mt_pin_<uid> + pin_lookup (onConflict
//                user_id) + dispara onAuth con la sesión restaurada.
//  El modal asume que ya existe `mt_last_user` con el uid+email,
//  pero pide al usuario reescribir el correo para confirmar.
// ════════════════════════════════════════════════════════════════

function ForgotPinModal(props) {
  var lastUser = props.lastUser || {};
  // step: 'creds' | 'prep' | 'codigo' | 'newpin'
  var stepS = useState('creds');
  var step = stepS[0], setStep = stepS[1];

  // Creds
  var emS = useState(lastUser.email || '');
  var em = emS[0], setEm = emS[1];
  var pwS = useState('');
  var pw = pwS[0], setPw = pwS[1];
  var bS = useState(false);
  var busy = bS[0], setBusy = bS[1];
  var fbS = useState(null);
  var feedback = fbS[0], setFeedback = fbS[1];

  // OTP local
  var generatedOtpRef = useRef(null);
  var codeS = useState('');
  var code = codeS[0], setCode = codeS[1];
  var prepIntervalRef = useRef(null);
  var prS = useState(15);
  var prepSec = prS[0], setPrepSec = prS[1];

  // PIN nuevo
  var newPinS = useState('');
  var newPin = newPinS[0], setNewPin = newPinS[1];
  var newPin2S = useState('');
  var newPin2 = newPin2S[0], setNewPin2 = newPin2S[1];
  var stageS = useState(1); // 1 = ingresar, 2 = confirmar
  var stage = stageS[0], setStage = stageS[1];

  var mountedRef = useRef(true);
  useEffect(function () {
    return function () {
      mountedRef.current = false;
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    };
  }, []);

  function _clearPrep() {
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
  }

  // ─── Paso 1: validar correo + contraseña ───
  function doCreds() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    setFeedback(null);

    var emClean = String(em || '').trim().toLowerCase();
    if (!emClean || emClean.indexOf('@') < 0) {
      setFeedback('Escribí tu correo completo.');
      return;
    }
    if (!pw) {
      setFeedback('Escribí tu contraseña actual.');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('La recuperación de PIN requiere conexión.');
      return;
    }
    setBusy(true);
    SUPA.auth
      .signInWithPassword({ email: emClean, password: pw })
      .then(function (res) {
        if (!mountedRef.current) return;
        if (res && res.error) {
          setFeedback('Correo o contraseña incorrectos.');
          setBusy(false);
          return;
        }
        // OK — arrancar OTP local
        _startLocalOtp();
      })
      .catch(function (e) {
        if (!mountedRef.current) return;
        setFeedback(
          typeof traducirError === 'function'
            ? traducirError(e) || 'No se pudo verificar.'
            : 'No se pudo verificar.'
        );
        setBusy(false);
      });
  }

  // ─── Paso 2: arrancar OTP local con espera de 15 s ───
  function _startLocalOtp() {
    _clearPrep();
    var arr = (window.crypto && window.crypto.getRandomValues)
      ? window.crypto.getRandomValues(new Uint32Array(1))
      : [Math.floor(Math.random() * 1e9)];
    var c = String(100000 + (arr[0] % 900000));
    generatedOtpRef.current = c;
    setCode('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    setStep('prep');
    prepIntervalRef.current = setInterval(function () {
      if (!mountedRef.current) { _clearPrep(); return; }
      setPrepSec(function (s) {
        if (s <= 1) {
          _clearPrep();
          try { haptic && haptic(); } catch (_) {}
          setStep('codigo');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ─── Paso 3: verificar el código tipeado ───
  function doVerifyCode() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    var typed = code.replace(/\D/g, '');
    if (typed.length < 6) {
      setFeedback('Ingresá los 6 dígitos.');
      return;
    }
    if (typed !== generatedOtpRef.current) {
      setFeedback('El código no coincide. Revisá y volvé a intentar.');
      return;
    }
    generatedOtpRef.current = null;
    setCode('');
    setFeedback(null);
    setStep('newpin');
    setStage(1);
    setNewPin('');
    setNewPin2('');
  }

  // ─── Paso 4: nuevo PIN + confirmación + guardado ───
  function applyNewPin() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setFeedback('El PIN debe ser de 4 dígitos.');
      return;
    }
    if (newPin !== newPin2) {
      setFeedback('Los PIN no coinciden.');
      setStage(1);
      setNewPin2('');
      return;
    }
    // PINs reservados / fáciles
    var reservados = ['0000', '1234', '1111', '0001', '9999'];
    if (reservados.indexOf(newPin) >= 0) {
      setFeedback('Elegí un PIN menos predecible.');
      setStage(1);
      setNewPin('');
      setNewPin2('');
      return;
    }
    setBusy(true);
    setFeedback(null);

    function applyLocalAndAuth() {
      grabar('mt_pin_' + lastUser.uid, newPin);
      // Restaurar sesión con el nuevo PIN
      var ses = null;
      try { ses = leer('mt_offline_' + btoa(lastUser.email), null); } catch (_) {}
      if (!ses) {
        ses = {
          uid: lastUser.uid,
          email: lastUser.email,
          cloud: true,
          guest: false,
          isAdmin: lastUser.email === 'admin@miturno.com'
        };
      }
      ses.pin = newPin;
      if (props.onPinReset) props.onPinReset(ses);
    }

    if (CLOUD_MODE && SUPA && lastUser.email) {
      // El recovery por su naturaleza arranca online (validamos password
      // contra Supabase en el paso 1), así que aquí casi siempre habrá
      // red. Igual usamos isOnline() como cinturón y, si falla por red,
      // encolamos para reintentar al volver — pero NO bloqueamos la UX.
      var online = typeof isOnline === 'function' ? isOnline() : true;
      if (!online) {
        applyLocalAndAuth();
        if (typeof queueAction === 'function') {
          queueAction(lastUser.uid, 'updatePinLookup', {
            pin: newPin, user_email: lastUser.email
          });
        }
        return;
      }
      SUPA.from('pin_lookup')
        .upsert(
          {
            pin: newPin,
            user_email: lastUser.email,
            user_id: lastUser.uid,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        .then(function (res) {
          if (!mountedRef.current) return;
          if (res && res.error) {
            var c = String(res.error.code || '');
            var m = String(res.error.message || '').toLowerCase();
            if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0) {
              setFeedback('Ese PIN ya está en uso por otra cuenta. Elegí otro.');
              setStage(1);
              setNewPin('');
              setNewPin2('');
              setBusy(false);
              return;
            }
            // Error transitorio (red, timeout) → encolar y seguir
            if (typeof queueAction === 'function') {
              queueAction(lastUser.uid, 'updatePinLookup', {
                pin: newPin, user_email: lastUser.email
              });
            }
            applyLocalAndAuth();
            return;
          }
          applyLocalAndAuth();
        })
        .catch(function () {
          if (!mountedRef.current) return;
          // Excepción de red → aplicamos local y encolamos
          if (typeof queueAction === 'function') {
            queueAction(lastUser.uid, 'updatePinLookup', {
              pin: newPin, user_email: lastUser.email
            });
          }
          applyLocalAndAuth();
        });
    } else {
      applyLocalAndAuth();
    }
  }

  function close() {
    _clearPrep();
    generatedOtpRef.current = null;
    if (props.onClose) props.onClose();
  }

  // ═══ RENDER ═══

  // Paso 1: credenciales
  if (step === 'creds') {
    return h(
      'div',
      {
        className: 'ovl',
        onClick: function (e) { if (e.target === e.currentTarget) close(); }
      },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('span', { className: 'vf-icon' }, '🔑'),
          h('div', { className: 'vf-title' }, 'Recuperar mi PIN'),
          h(
            'div',
            { className: 'vf-desc' },
            'Para crear un PIN nuevo confirmá tu correo y contraseña.'
          )
        ),
        h(
          'div',
          { style: { marginBottom: 10 } },
          h('div', { className: 'inp-lbl' }, 'Correo'),
          h('input', {
            type: 'email',
            inputMode: 'email',
            className: 'inp',
            placeholder: 'tu@correo.com',
            value: em,
            autoFocus: true,
            onChange: function (e) { setEm(e.target.value); }
          })
        ),
        h(
          'div',
          { style: { marginBottom: 12 } },
          h('div', { className: 'inp-lbl' }, 'Contraseña'),
          h('input', {
            type: 'password',
            className: 'inp',
            placeholder: 'Tu contraseña actual',
            value: pw,
            onChange: function (e) { setPw(e.target.value); },
            onKeyDown: function (e) { if (e.key === 'Enter') doCreds(); }
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 8
                }
              },
              feedback
            )
          : null,
        h(
          'button',
          {
            className: 'btn btn-accent btn-block',
            onClick: doCreds,
            disabled: busy,
            style: { marginBottom: 8 }
          },
          busy ? h('span', { className: 'sp-in' }) : 'Continuar'
        ),
        h('button', { className: 'btn btn-ghost btn-block', onClick: close }, 'Cancelar')
      )
    );
  }

  // Paso 2: preparando (15 s)
  if (step === 'prep') {
    var totalSec = 15;
    var pct = Math.max(0, Math.min(100, ((totalSec - prepSec) / totalSec) * 100));
    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step otp-prep' },
          h(
            'div',
            { className: 'otp-prep-shield' },
            h('div', { className: 'otp-prep-shield-glow' }),
            h('div', { className: 'otp-prep-shield-icon' }, '✦')
          ),
          h('div', { className: 'vf-title' }, 'Preparando tu código'),
          h(
            'div',
            { className: 'vf-desc' },
            'Por seguridad, tomamos unos segundos antes de mostrártelo.'
          ),
          h(
            'div',
            { className: 'otp-prep-bar-wrap' },
            h(
              'div',
              { className: 'otp-prep-bar' },
              h('div', { className: 'otp-prep-bar-fill', style: { width: pct + '%' } })
            ),
            h('div', { className: 'otp-prep-sec' }, prepSec + 's')
          )
        ),
        h(
          'button',
          { className: 'btn btn-ghost btn-block', onClick: close, style: { marginTop: 8 } },
          'Cancelar'
        )
      )
    );
  }

  // Paso 3: código revelado + input
  if (step === 'codigo') {
    var revealed = generatedOtpRef.current || '';
    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('div', { className: 'vf-title' }, 'Tu código de confirmación'),
          h('div', { className: 'vf-desc' }, 'Escribilo abajo para continuar.')
        ),
        h(
          'div',
          { className: 'otp-reveal' },
          revealed.split('').map(function (d, i) {
            return h('span', { key: i, className: 'otp-reveal-digit' }, d);
          })
        ),
        h(
          'div',
          { className: 'code-grid', style: { marginTop: 14, marginBottom: 4 } },
          Array.from({ length: 6 }).map(function (_, i) {
            return h('input', {
              key: i,
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '1',
              className: 'code-cell',
              value: code[i] || '',
              autoFocus: i === 0,
              onChange: function (e) {
                var v = e.target.value.replace(/\D/g, '');
                if (v.length > 1) v = v.slice(-1);
                var arr = code.split('');
                arr[i] = v;
                setCode(arr.join('').slice(0, 6));
                if (v && i < 5) {
                  var sib = e.target.parentElement.children[i + 1];
                  if (sib) sib.focus();
                }
              },
              onKeyDown: function (e) {
                if (e.key === 'Backspace' && !code[i] && i > 0) {
                  var sib = e.target.parentElement.children[i - 1];
                  if (sib) sib.focus();
                }
                if (e.key === 'Enter') doVerifyCode();
              }
            });
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 8
                }
              },
              feedback
            )
          : null,
        h(
          'button',
          {
            className: 'btn btn-accent btn-block',
            onClick: doVerifyCode,
            disabled: busy || code.replace(/\D/g, '').length < 6,
            style: { marginTop: 10, marginBottom: 8 }
          },
          'Confirmar'
        ),
        h('button', { className: 'btn btn-ghost btn-block', onClick: close }, 'Cancelar')
      )
    );
  }

  // Paso 4: nuevo PIN
  if (step === 'newpin') {
    var labelTop = stage === 1 ? 'Creá tu nuevo PIN' : 'Confirmá tu PIN';
    var labelSub =
      stage === 1
        ? 'Elegí 4 dígitos fáciles de recordar para vos pero difíciles de adivinar.'
        : 'Volvé a escribir el mismo PIN para confirmar.';
    var current = stage === 1 ? newPin : newPin2;
    var setCurrent = stage === 1 ? setNewPin : setNewPin2;

    function pressDigit(d) {
      if (current.length >= 4) return;
      try { haptic && haptic(); } catch (_) {}
      setFeedback(null);
      var nxt = current + d;
      setCurrent(nxt);
      if (nxt.length === 4) {
        if (stage === 1) {
          setTimeout(function () { setStage(2); }, 150);
        } else {
          setTimeout(function () { applyNewPin(); }, 110);
        }
      }
    }
    function pressBack() {
      if (!current.length) {
        if (stage === 2) {
          setStage(1);
          return;
        }
        return;
      }
      try { haptic && haptic(); } catch (_) {}
      setCurrent(current.slice(0, -1));
    }

    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card fp-newpin-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('div', { className: 'vf-title' }, labelTop),
          h('div', { className: 'vf-desc' }, labelSub)
        ),
        h(
          'div',
          { className: 'fastpin-cells fp-newpin-cells' },
          [0, 1, 2, 3].map(function (i) {
            var filled = current.length > i;
            return h(
              'div',
              {
                key: i,
                className: 'fastpin-cell' + (filled ? ' filled' : '')
              },
              filled ? h('span', { className: 'fastpin-dot' }) : null
            );
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  margin: '12px 0 4px',
                  textAlign: 'center'
                }
              },
              feedback
            )
          : null,
        h(
          'div',
          { className: 'fastpin-keypad fp-newpin-keypad' },
          ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (n) {
            return h(
              'button',
              {
                key: n,
                className: 'fastpin-key',
                onClick: function () { pressDigit(n); },
                type: 'button'
              },
              n
            );
          }),
          h('div', { className: 'fastpin-key fastpin-key-empty' }),
          h(
            'button',
            {
              className: 'fastpin-key',
              onClick: function () { pressDigit('0'); },
              type: 'button'
            },
            '0'
          ),
          h(
            'button',
            {
              className: 'fastpin-key fastpin-key-del',
              onClick: pressBack,
              type: 'button',
              'aria-label': 'Borrar'
            },
            h('span', { 'aria-hidden': 'true' }, '⌫')
          )
        ),
        h(
          'button',
          { className: 'btn btn-ghost btn-block', onClick: close, style: { marginTop: 12 } },
          busy ? h('span', { className: 'sp-in' }) : 'Cancelar'
        )
      )
    );
  }

  return null;
}


// ── js/modals/pin-setup.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/pin-setup.js
//  Modal configurar PIN
// ════════════════════════════════════════════════════════════════
function PinSetup(props) {
  var session = props.session;
  var stS = useState('pin');
  var step = stS[0],
    setStep = stS[1];
  // 'pin' | 'wait' | 'verify' | 'done'
  var pinS = useState(['', '', '', '']);
  var pinCells = pinS[0],
    setPinCells = pinS[1];
  var codeS = useState('');
  var codeInput = codeS[0],
    setCodeInput = codeS[1];
  var bsS = useState(false);
  var busy = bsS[0],
    setBusy = bsS[1];
  var erS = useState(null);
  var err = erS[0],
    setErr = erS[1];
  var nowS = useState(Date.now());
  var nowMs = nowS[0],
    setNowMs = nowS[1];

  var codeRef = useRef(''); // El código generado
  var startTsRef = useRef(0); // Timestamp de inicio del countdown
  var tickRef = useRef(null); // Handle del interval
  var pinRefs = [useRef(), useRef(), useRef(), useRef()];
  var codeRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  var pinVal = pinCells.join('');

  // Cleanup al desmontar
  useEffect(function () {
    return function () {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Countdown robusto basado en Date.now() — sobrevive a pausas del navegador
  function startWait() {
    startTsRef.current = Date.now();
    setNowMs(Date.now());
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(function () {
      setNowMs(Date.now());
    }, 500);
  }

  // Tiempo en segundos desde inicio
  function elapsedSec() {
    if (!startTsRef.current) return 0;
    return Math.floor((nowMs - startTsRef.current) / 1000);
  }

  // Generar código de 6 dígitos
  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Cuando se cumplen los 15s, generamos el código (si aún no existe)
  useEffect(
    function () {
      if (step === 'wait' && elapsedSec() >= 15 && !codeRef.current) {
        codeRef.current = genCode();
        setStep('verify');
      }
      if (step === 'verify' && elapsedSec() >= 300) {
        // Expirado tras 5 min total
        codeRef.current = '';
        if (tickRef.current) clearInterval(tickRef.current);
      }
    },
    [nowMs, step]
  );

  // ── Inputs PIN ──
  function handlePinCell(e, i) {
    var v = e.target.value.replace(/\D/g, '').slice(-1);
    var next = pinCells.slice();
    next[i] = v;
    setPinCells(next);
    if (v && i < 3 && pinRefs[i + 1].current) pinRefs[i + 1].current.focus();
  }
  function handlePinKey(e, i) {
    if (e.key === 'Backspace' && !pinCells[i] && i > 0) {
      var next = pinCells.slice();
      next[i - 1] = '';
      setPinCells(next);
      if (pinRefs[i - 1].current) pinRefs[i - 1].current.focus();
    }
  }

  // ── Inputs código ──
  function handleCodeCell(e, i) {
    var v = e.target.value.replace(/\D/g, '').slice(-1);
    var arr = codeInput.split('');
    arr[i] = v;
    var combined = arr.join('').slice(0, 6);
    setCodeInput(combined);
    if (v && i < 5 && codeRefs[i + 1].current) codeRefs[i + 1].current.focus();
  }
  function handleCodeKey(e, i) {
    if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
      if (codeRefs[i - 1].current) codeRefs[i - 1].current.focus();
    }
    if (e.key === 'Enter') verificar();
  }

  // ── Paso 1: Validar PIN y arrancar la espera ──
  function continuar() {
    if (busy) return;
    haptic();
    setErr(null);
    if (pinVal.length !== 4) {
      setErr('Ingresa los 4 dígitos del PIN');
      return;
    }
    if (!/^\d{4}$/.test(pinVal)) {
      setErr('Solo dígitos numéricos');
      return;
    }
    if (
      [
        '0000',
        '1111',
        '2222',
        '3333',
        '4444',
        '5555',
        '6666',
        '7777',
        '8888',
        '9999',
        '1234',
        '4321',
        '0123'
      ].indexOf(pinVal) >= 0
    ) {
      setErr('PIN demasiado simple. Elige otro más seguro.');
      return;
    }
    setBusy(true);

    // Verificar que el PIN no esté en uso (si hay nube)
    if (CLOUD_MODE && SUPA) {
      withTimeout(
        SUPA.from('pin_lookup').select('user_id').eq('pin', pinVal).maybeSingle(),
        6000,
        'Verificar PIN'
      )
        .then(function (res) {
          if (res && res.data && res.data.user_id && res.data.user_id !== session.uid) {
            setErr('Este PIN ya está en uso. Elige otro.');
            setBusy(false);
            return;
          }
          // PIN libre, iniciar espera
          codeRef.current = '';
          setCodeInput('');
          setStep('wait');
          setBusy(false);
          startWait();
        })
        .catch(function () {
          // Sin verificación remota, continuamos igual (offline)
          codeRef.current = '';
          setCodeInput('');
          setStep('wait');
          setBusy(false);
          startWait();
        });
    } else {
      codeRef.current = '';
      setCodeInput('');
      setStep('wait');
      setBusy(false);
      startWait();
    }
  }

  // ── Guardar PIN en local + nube ──
  function guardarPIN() {
    grabar('mt_pin_' + session.uid, pinVal);
    var cur = leer(SKEY, {});
    if (cur) {
      cur.pin = pinVal;
      grabar(SKEY, cur);
    }

    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!SUPA || !CLOUD_MODE) {
      setStep('done');
      setBusy(false);
      return;
    }

    withTimeout(
      SUPA.from('pin_lookup').upsert(
        {
          pin: pinVal,
          user_email: session.email,
          user_id: session.uid,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      ),
      8000,
      'Guardar PIN'
    )
      .then(function (res) {
        if (res && res.error) {
          var c = String(res.error.code || '');
          if (c === '23505') {
            setErr('Este PIN ya fue tomado. Intenta con otro.');
            setStep('pin');
            setPinCells(['', '', '', '']);
            setBusy(false);
            return;
          }
          throw res.error;
        }
        setStep('done');
        setBusy(false);
      })
      .catch(function (e) {
        // Guardado local funcionó, no es crítico
        console.warn('PIN guardado solo localmente:', e);
        setStep('done');
        setBusy(false);
      });
  }

  // ── Paso 3: Verificar código ──
  function verificar() {
    if (busy) return;
    haptic();
    setErr(null);
    if (codeInput.length !== 6) {
      setErr('Ingresa los 6 dígitos del código');
      return;
    }
    if (elapsedSec() >= 300) {
      setErr('El código expiró. Pulsa "Generar nuevo".');
      return;
    }
    if (codeInput !== codeRef.current) {
      setErr('Código incorrecto. Revisa los dígitos.');
      return;
    }
    setBusy(true);
    guardarPIN();
  }

  function regenerar() {
    haptic();
    setCodeInput('');
    setErr(null);
    codeRef.current = '';
    startTsRef.current = Date.now();
    setStep('wait');
    startWait();
  }

  // ── Indicador de pasos ──
  function StepIndicator() {
    var steps = ['pin', 'wait', 'verify'];
    var curIdx = steps.indexOf(step);
    if (curIdx < 0) curIdx = 0;
    return h(
      'div',
      { className: 'pin-setup-step', style: { justifyContent: 'center', marginBottom: 24 } },
      steps.map(function (s, i) {
        var cls = i < curIdx ? 'done' : i === curIdx ? '' : 'pending';
        return h(
          React.Fragment,
          { key: s },
          i > 0
            ? h('div', { className: 'pin-setup-step-line' + (i <= curIdx ? ' done' : '') })
            : null,
          h('div', { className: 'pin-setup-step-num ' + cls }, i < curIdx ? '✓' : String(i + 1))
        );
      })
    );
  }

  // ─── PANTALLA: ÉXITO ───
  if (step === 'done') {
    return h(
      'div',
      {
        className: 'pin-setup-wrap',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'PIN creado exitosamente'
      },
      h(
        'div',
        { className: 'pin-setup-card', style: { textAlign: 'center' } },
        h('div', { style: { fontSize: 48, marginBottom: 12 } }, '🎉'),
        h(
          'div',
          {
            style: {
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
              letterSpacing: '-0.5px'
            }
          },
          '¡PIN creado!'
        ),
        h(
          'div',
          { style: { fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 } },
          'Tu PIN es ',
          h(
            'strong',
            {
              style: {
                color: 'var(--accent)',
                letterSpacing: '4px',
                fontSize: 22,
                fontFamily: 'ui-monospace,monospace'
              }
            },
            pinVal
          ),
          '. Guárdalo: lo usarás para entrar rápidamente.'
        ),
        h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--accent)',
              marginBottom: 20,
              lineHeight: 1.55
            }
          },
          '✓ La próxima vez puedes entrar con tu PIN de 4 dígitos y tu contraseña.'
        ),
        h(
          'button',
          {
            className: 'auth-btn',
            onClick: function () {
              haptic();
              props.onDone(pinVal);
            }
          },
          'Entrar a la app →'
        )
      )
    );
  }

  // ─── PANTALLA: VERIFICAR CÓDIGO ───
  if (step === 'verify') {
    var segRest = Math.max(0, 300 - elapsedSec());
    var minStr = String(Math.floor(segRest / 60)).padStart(2, '0');
    var secStr = String(segRest % 60).padStart(2, '0');
    var expirado = segRest <= 0;

    return h(
      'div',
      {
        className: 'pin-setup-wrap',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Crear tu PIN'
      },
      h(
        'div',
        { className: 'pin-setup-card' },
        h(
          'div',
          { style: { textAlign: 'center', marginBottom: 18 } },
          h('div', { style: { fontSize: 32, marginBottom: 6 } }, '🔐'),
          h(
            'div',
            {
              style: {
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.5px'
              }
            },
            'Crear tu PIN'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
            'Confirmación final'
          )
        ),

        h(StepIndicator, null),

        // Código visible (prueba de humano automática)
        expirado
          ? null
          : h(
              'div',
              { style: { textAlign: 'center', padding: '8px 0 18px' } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 10
                  }
                },
                'Tu código (válido ' + minStr + ':' + secStr + ')'
              ),
              h(
                'div',
                {
                  style: {
                    fontSize: 42,
                    fontWeight: 900,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '10px',
                    padding: '16px 18px',
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid var(--accent)',
                    fontFamily: 'ui-monospace,monospace',
                    marginBottom: 6,
                    display: 'inline-block'
                  }
                },
                codeRef.current
              ),
              h(
                'div',
                { style: { fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 } },
                '👁 Esto valida que eres un humano. Ingrésalo abajo.'
              )
            ),

        expirado
          ? h(
              'div',
              { style: { textAlign: 'center', padding: '18px 0' } },
              h('div', { style: { fontSize: 34, marginBottom: 8 } }, '⌛'),
              h(
                'div',
                {
                  style: { fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }
                },
                'Código expirado'
              ),
              h(
                'div',
                { style: { fontSize: 12, color: 'var(--muted)', marginBottom: 14 } },
                'Genera uno nuevo para continuar.'
              )
            )
          : null,

        h(
          'div',
          {
            style: {
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
              textAlign: 'center'
            }
          },
          'Ingresa el código'
        ),
        h(
          'div',
          { className: 'code-grid' },
          Array.from({ length: 6 }).map(function (_, i) {
            return h('input', {
              key: i,
              ref: codeRefs[i],
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '1',
              className: 'code-cell',
              value: codeInput[i] || '',
              autoFocus: i === 0 && !expirado,
              disabled: expirado,
              onChange: function (e) {
                handleCodeCell(e, i);
              },
              onKeyDown: function (e) {
                handleCodeKey(e, i);
              }
            });
          })
        ),

        err ? h('div', { className: 'auth-err', style: { marginTop: 10 } }, err) : null,

        expirado
          ? h(
              'button',
              {
                className: 'auth-btn',
                onClick: regenerar,
                style: { marginTop: 12, marginBottom: 10 }
              },
              '🔄 Generar nuevo código'
            )
          : h(
              'button',
              {
                className: 'auth-btn',
                onClick: verificar,
                disabled: busy || codeInput.length !== 6,
                style: { marginTop: 12, marginBottom: 10 }
              },
              busy ? h('span', { className: 'sp-in' }) : 'Verificar y crear PIN'
            ),

        h(
          'button',
          {
            className: 'auth-guest',
            style: { width: '100%' },
            onClick: function () {
              haptic();
              if (tickRef.current) clearInterval(tickRef.current);
              props.onSkip();
            }
          },
          'Omitir · crear PIN después'
        )
      )
    );
  }

  // ─── PANTALLA: ESPERANDO (15s de delay) ───
  if (step === 'wait') {
    var elapsed = elapsedSec();
    var segParaCodigo = Math.max(0, 15 - elapsed);

    return h(
      'div',
      { className: 'pin-setup-wrap' },
      h(
        'div',
        { className: 'pin-setup-card' },
        h(
          'div',
          { style: { textAlign: 'center', marginBottom: 18 } },
          h('div', { style: { fontSize: 32, marginBottom: 6 } }, '⏳'),
          h(
            'div',
            {
              style: {
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.5px'
              }
            },
            'Validando'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
            'Tu código aparecerá en unos segundos'
          )
        ),

        h(StepIndicator, null),

        h(
          'div',
          { style: { textAlign: 'center', padding: '30px 0 20px' } },
          h(
            'div',
            {
              style: {
                fontSize: 74,
                fontWeight: 900,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                marginBottom: 8,
                fontFamily: 'ui-monospace,monospace'
              }
            },
            String(segParaCodigo)
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', fontWeight: 600 } },
            segParaCodigo > 0 ? 'segundos' : '¡listo!'
          )
        ),

        h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11.5,
              color: 'var(--accent)',
              lineHeight: 1.55,
              marginTop: 18,
              textAlign: 'center',
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)'
            }
          },
          '🤖 Confirmando que eres un humano…'
        ),

        h(
          'button',
          {
            className: 'auth-guest',
            style: { width: '100%', marginTop: 16 },
            onClick: function () {
              haptic();
              if (tickRef.current) clearInterval(tickRef.current);
              props.onSkip();
            }
          },
          'Omitir · crear PIN después'
        )
      )
    );
  }

  // ─── PANTALLA: PASO 1 — INGRESAR PIN ───
  return h(
    'div',
    { className: 'pin-setup-wrap' },
    h(
      'div',
      { className: 'pin-setup-card' },
      h(
        'div',
        { style: { textAlign: 'center', marginBottom: 18 } },
        h('div', { style: { fontSize: 32, marginBottom: 6 } }, '🔐'),
        h(
          'div',
          {
            style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }
          },
          'Crear tu PIN'
        ),
        h(
          'div',
          { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
          'Elige 4 dígitos únicos. Será tu acceso rápido a la app.'
        )
      ),

      h(StepIndicator, null),

      h(
        'div',
        { className: 'pin-grid', style: { marginBottom: err ? 10 : 16 } },
        pinCells.map(function (v, i) {
          return h('input', {
            key: i,
            ref: pinRefs[i],
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '1',
            className: 'pin-cell',
            value: v,
            onChange: function (e) {
              handlePinCell(e, i);
            },
            onKeyDown: function (e) {
              handlePinKey(e, i);
            },
            placeholder: '•',
            autoComplete: 'off',
            autoFocus: i === 0
          });
        })
      ),

      err ? h('div', { className: 'auth-err' }, err) : null,

      h(
        'button',
        { className: 'auth-btn', onClick: continuar, disabled: busy, style: { marginBottom: 10 } },
        busy ? h('span', { className: 'sp-in' }) : 'Continuar →'
      ),

      h(
        'button',
        {
          className: 'auth-guest',
          style: { width: '100%' },
          onClick: function () {
            haptic();
            props.onSkip();
          }
        },
        'Ahora no · crear PIN después'
      )
    )
  );
}


// ── js/modals/manage-account.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/manage-account.js
//  Modal gestionar cuenta
// ════════════════════════════════════════════════════════════════
function ManageAccountModal(props) {
  var session = props.session;
  var isPinOnly = session.pinOnly === true;
  var uid = session.uid;

  var ts = useState(0);
  var tab = ts[0],
    setTab = ts[1];
  var pinS = useState('');
  var pinVal = pinS[0],
    setPinVal = pinS[1];
  var emS = useState(session.email || '');
  var emailVal = emS[0],
    setEmailVal = emS[1];
  var pwS = useState('');
  var passVal = pwS[0],
    setPassVal = pwS[1];
  var bS = useState(false);
  var busy = bS[0],
    setBusy = bS[1];
  var fbS = useState(null);
  var feedback = fbS[0],
    setFeedback = fbS[1];

  // vfStep: null | 'confirm' | 'preparando' | 'codigo'
  // - confirm:   pide credenciales actuales (email + PIN o password)
  // - preparando: cuenta 15 s con barra de progreso; sin código aún
  // - codigo:    revela el código local + input para reescribirlo
  var vfS = useState(null);
  var vfStep = vfS[0],
    setVfStep = vfS[1];
  var pendingFnRef = useRef(null);
  var confirmPinS = useState('');
  var confirmPin = confirmPinS[0],
    setConfirmPin = confirmPinS[1];
  var confirmPassS = useState('');
  var confirmPass = confirmPassS[0],
    setConfirmPass = confirmPassS[1];
  var confirmMailS = useState('');
  var confirmMail = confirmMailS[0],
    setConfirmMail = confirmMailS[1];
  var codeInputS = useState('');
  var codeInput = codeInputS[0],
    setCodeInput = codeInputS[1];

  // ── OTP local (offline) ──
  var generatedOtpRef = useRef(null);
  var prepIntervalRef = useRef(null);
  var prS = useState(15);
  var prepSec = prS[0],
    setPrepSec = prS[1];

  var busyRef = useRef(false);
  var mountedRef = useRef(true);
  useEffect(function () {
    return function () {
      mountedRef.current = false;
      if (prepIntervalRef.current) {
        clearInterval(prepIntervalRef.current);
        prepIntervalRef.current = null;
      }
    };
  }, []);

  function _clearPrep() {
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
  }

  var storedPin = session.pin || leer('mt_pin_' + uid, null) || leer('mt_pin_app_' + uid, null);
  var hasPassword = !isPinOnly && CLOUD_MODE && SUPA && !!session.email;

  function pinCloudErr(err) {
    if (!err) return 'No se pudo guardar el PIN en la nube.';
    var c = String(err.code || '');
    var m = String(err.message || '').toLowerCase();
    if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0)
      return 'Ese PIN ya está en uso en otra cuenta. Elige otro código.';
    return traducirError(err) || err.message || 'Error al guardar el PIN.';
  }

  function resetVf() {
    _clearPrep();
    generatedOtpRef.current = null;
    setVfStep(null);
    setConfirmPin('');
    setConfirmPass('');
    setConfirmMail('');
    setCodeInput('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    pendingFnRef.current = null;
  }

  function initiateVerification(executeFn) {
    haptic();
    pendingFnRef.current = executeFn;
    setConfirmPin('');
    setConfirmPass('');
    setConfirmMail('');
    setFeedback(null);
    setCodeInput('');
    setVfStep('confirm');
  }

  // Genera un código de 6 dígitos LOCAL (sin internet) y lo guarda
  // en un ref. Arranca el paso 'preparando' con cuenta regresiva de
  // 15 s; al terminar revela el código en pantalla para que el usuario
  // lo reescriba en el input.
  function _startLocalOtp() {
    _clearPrep();
    var arr =
      window.crypto && window.crypto.getRandomValues
        ? window.crypto.getRandomValues(new Uint32Array(1))
        : [Math.floor(Math.random() * 1e9)];
    var code = String(100000 + (arr[0] % 900000));
    generatedOtpRef.current = code;
    setCodeInput('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    setVfStep('preparando');
    prepIntervalRef.current = setInterval(function () {
      if (!mountedRef.current) {
        _clearPrep();
        return;
      }
      setPrepSec(function (s) {
        if (s <= 1) {
          _clearPrep();
          // Pequeño haptic al revelar
          try {
            haptic && haptic();
          } catch (_) {}
          setVfStep('codigo');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ── Confirmar identidad ──
  function doConfirm() {
    if (busyRef.current) return;
    busyRef.current = true;
    haptic();
    setBusy(true);
    setFeedback(null);

    if (hasPassword) {
      var accEm = (session.email || '').trim().toLowerCase();
      var typed = (confirmMail || '').trim().toLowerCase();
      if (!confirmMail || confirmMail.indexOf('@') < 0) {
        setFeedback('Escribe tu correo completo para confirmar identidad.');
        busyRef.current = false;
        setBusy(false);
        return;
      }
      if (typed !== accEm) {
        setFeedback('El correo no coincide con el de esta sesión.');
        busyRef.current = false;
        setBusy(false);
        return;
      }
      if (!confirmPass) {
        setFeedback('Ingresa tu contraseña actual.');
        busyRef.current = false;
        setBusy(false);
        return;
      }
      SUPA.auth
        .signInWithPassword({ email: session.email, password: confirmPass })
        .then(function (res) {
          if (!mountedRef.current) return;
          if (res && res.error) {
            setFeedback('Contraseña incorrecta.');
            busyRef.current = false;
            setBusy(false);
            return;
          }
          // Credenciales OK → arranca el OTP local con espera de 15 s
          _startLocalOtp();
        })
        .catch(function (e) {
          if (!mountedRef.current) return;
          setFeedback(traducirError(e));
          busyRef.current = false;
          setBusy(false);
        });
    } else {
      // Modo PIN-only (offline-first): validamos PIN local y arrancamos
      // igualmente el flujo de OTP local con su espera de 15 s.
      if (!storedPin) {
        setFeedback('No hay credenciales para confirmar. Reinicia la sesión.');
        busyRef.current = false;
        setBusy(false);
        return;
      }
      if (!confirmPin || confirmPin !== storedPin) {
        setFeedback('PIN incorrecto.');
        busyRef.current = false;
        setBusy(false);
        return;
      }
      _startLocalOtp();
    }
  }

  // ── Verificar OTP local (sin internet) ──
  // Comparación directa contra el código generado en memoria. Si
  // coincide, ejecuta la acción pendiente (puede ser async, ej. PIN
  // a la nube).
  function doVerify() {
    if (busyRef.current) return;
    haptic();
    var code = codeInput.replace(/\D/g, '');
    if (code.length < 6) {
      setFeedback('Ingresá los 6 dígitos.');
      return;
    }
    if (code !== generatedOtpRef.current) {
      setFeedback('El código no coincide. Revisalo y volvé a intentar.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);

    function finishOk() {
      generatedOtpRef.current = null;
      setFeedback('✓ Cambio aplicado correctamente');
      setVfStep(null);
      busyRef.current = false;
      setBusy(false);
      pendingFnRef.current = null;
      setTimeout(function () {
        if (mountedRef.current) setFeedback(null);
      }, 3500);
    }
    function finishErr(msg) {
      generatedOtpRef.current = null;
      setFeedback(msg);
      setVfStep(null);
      busyRef.current = false;
      setBusy(false);
      pendingFnRef.current = null;
      setTimeout(function () {
        if (mountedRef.current) setFeedback(null);
      }, 5200);
    }

    var fn = pendingFnRef.current;
    if (!fn) {
      finishOk();
      return;
    }
    try {
      var out = fn();
      if (out && typeof out.then === 'function') {
        out
          .then(function () {
            if (mountedRef.current) finishOk();
          })
          .catch(function (e) {
            if (mountedRef.current)
              finishErr('Error al guardar: ' + (e && e.message ? e.message : 'inténtalo de nuevo'));
          });
        return;
      }
      finishOk();
    } catch (e) {
      finishErr('Error: ' + (e && e.message ? e.message : 'inténtalo de nuevo'));
    }
  }

  function StepBar(props2) {
    var steps = ['confirm', 'preparando', 'codigo'];
    var labels = ['Identidad', 'Preparando', 'Código'];
    var cur = steps.indexOf(props2.current);
    if (cur < 0) cur = 0;
    return h(
      'div',
      { className: 'vf-progress-wrap' },
      h(
        'div',
        { className: 'vf-progress' },
        steps.map(function (s, i) {
          var cls = i < cur ? 'done' : i === cur ? 'active' : '';
          return h(
            'div',
            { key: s, style: { display: 'contents' } },
            i > 0 ? h('div', { className: 'vf-line' + (i <= cur ? ' done' : '') }) : null,
            h('div', { className: 'vf-pip ' + cls }, i < cur ? '✓' : String(i + 1))
          );
        })
      ),
      h(
        'div',
        { className: 'vf-progress-lbls' },
        labels.map(function (lb, i) {
          var on = i === cur ? ' on' : i < cur ? ' done' : '';
          return h('span', { key: steps[i], className: 'vf-progress-lbl' + on }, lb);
        })
      )
    );
  }

  // ── Acciones reales (se ejecutan tras verificación) ──
  function savePIN() {
    if (!pinVal || pinVal.length !== 4) {
      setFeedback('PIN debe ser 4 dígitos');
      return;
    }
    if (!/^\d+$/.test(pinVal)) {
      setFeedback('Solo dígitos');
      return;
    }
    var val = pinVal;
    initiateVerification(function () {
      function applyLocal() {
        grabar('mt_pin_' + uid, val);
        var cur = leer(SKEY, {});
        if (cur) {
          cur.pin = val;
          grabar(SKEY, cur);
        }
        if (props.onSessionPatch) props.onSessionPatch({ pin: val });
        setPinVal('');
      }
      if (!isPinOnly && CLOUD_MODE && SUPA && session.email) {
        // Estrategia offline-first:
        //   1) Aplicamos siempre el cambio local primero (UX inmediato)
        //   2) Si hay red → intento la escritura a Supabase
        //   3) Si no hay red, o si falla por red → encolo la acción
        //      para reintentar al volver a conectarme
        //   onConflict: 'user_id' del v36 sigue evitando duplicados.
        applyLocal();
        var online = typeof isOnline === 'function' ? isOnline() : true;
        if (!online) {
          if (typeof queueAction === 'function') {
            queueAction(uid, 'updatePinLookup', { pin: val, user_email: session.email });
          }
          // Devuelve OK al modal — el OTP local no debe trabar al
          // usuario por red intermitente. Si después al sincronizar
          // el PIN está duplicado, la cola muestra un toast.
          return Promise.resolve();
        }
        return SUPA.from('pin_lookup')
          .upsert(
            {
              pin: val,
              user_email: session.email,
              user_id: uid,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .then(function (res) {
            if (res && res.error) {
              var c = String(res.error.code || '');
              var m = String(res.error.message || '').toLowerCase();
              if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0) {
                // Error semántico → revertimos local y avisamos
                throw new Error('Ese PIN ya está en uso. Elegí otro.');
              }
              // Cualquier otro error → tratamos como red y encolamos
              if (typeof queueAction === 'function') {
                queueAction(uid, 'updatePinLookup', { pin: val, user_email: session.email });
              }
              console.warn('[MT] PIN encolado por error transitorio:', res.error);
              return; // OK al modal
            }
          })
          .catch(function (e) {
            // Error de red — encolar y resolver OK
            if (typeof queueAction === 'function') {
              queueAction(uid, 'updatePinLookup', { pin: val, user_email: session.email });
            }
            console.warn('[MT] PIN encolado por excepción de red:', e);
          });
      }
      applyLocal();
      return Promise.resolve();
    });
  }

  function saveEmail() {
    if (!emailVal || !emailVal.includes('@')) {
      setFeedback('Email inválido');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('Requiere conexión a nube');
      return;
    }
    var val = emailVal.trim().toLowerCase();
    if (val === String(session.email || '').toLowerCase()) {
      setFeedback('Ese ya es tu correo actual');
      return;
    }
    // El cambio de correo modifica auth.users, que es la fuente de
    // verdad y SOLO puede actualizarse online. Si no hay red, no
    // podemos validarlo: aborta con un mensaje claro.
    if (typeof isOnline === 'function' && !isOnline()) {
      setFeedback('Cambiar el correo necesita conexión. Probá cuando vuelvas a estar online.');
      return;
    }
    initiateVerification(function () {
      // 1) Cambia el correo en auth.users (Supabase puede pedir
      //    confirmación por mail al nuevo destino — eso depende del
      //    setting del proyecto y queda fuera de nuestro control).
      return SUPA.auth.updateUser({ email: val }).then(function (res) {
        if (res && res.error) {
          throw new Error(traducirError(res.error) || 'No se pudo actualizar el correo.');
        }
        // 2) Propaga el correo a las tablas dependientes. Si alguna
        //    falla, encolamos la propagación para reintentar.
        return supaPropagateEmail(uid, { email: val }).then(function (r) {
          if (!r.success) {
            if (typeof queueAction === 'function') {
              queueAction(uid, 'propagateEmail', { email: val });
              console.warn('[MT] propagación de email encolada:', r.error);
            }
          }
          // 3) Actualiza sesión local + state de React siempre,
          //    porque auth.users.email ya cambió (o queda pendiente
          //    de confirmación, según config del proyecto).
          var cur = leer(SKEY, {});
          if (cur) {
            cur.email = val;
            grabar(SKEY, cur);
          }
          try {
            var lu = leer('mt_last_user', null);
            if (lu && lu.uid === uid) {
              grabar('mt_last_user', { uid: uid, email: val });
            }
          } catch (_) {}
          if (props.onSessionPatch) props.onSessionPatch({ email: val });
          setEmailVal('');
        });
      });
    });
  }

  function savePassword() {
    if (!passVal || passVal.length < 6) {
      setFeedback('Mínimo 6 caracteres');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('Requiere conexión a nube');
      return;
    }
    // La contraseña solo puede cambiarse online: la auth.users es
    // la fuente de verdad y no podemos encolarla sin exponer un
    // hash que rompería el modelo de Supabase Auth.
    if (typeof isOnline === 'function' && !isOnline()) {
      setFeedback('Cambiar la contraseña necesita conexión. Probá cuando vuelvas a estar online.');
      return;
    }
    var val = passVal;
    initiateVerification(function () {
      return SUPA.auth.updateUser({ password: val }).then(function (res) {
        if (res && res.error) throw new Error(traducirError(res.error) || 'No se pudo actualizar.');
        setPassVal('');
      });
    });
  }

  // ═══ RENDER: CONFIRMAR IDENTIDAD ═══
  if (vfStep === 'confirm') {
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'confirm' }),
      h(
        'div',
        { className: 'vf-step' },
        h('span', { className: 'vf-icon' }, '🔐'),
        h('div', { className: 'vf-title' }, 'Confirmar identidad'),
        h(
          'div',
          { className: 'vf-desc' },
          hasPassword
            ? 'Ingresa tu correo y contraseña actuales. Luego recibirás un código de 6 dígitos en tu email para confirmar el cambio.'
            : 'Ingresa tu PIN actual para confirmar el cambio.'
        )
      ),

      storedPin && !hasPassword
        ? h(
            'div',
            { style: { marginBottom: 10 } },
            h(
              'div',
              {
                style: {
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: 5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }
              },
              'PIN actual'
            ),
            h('input', {
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '4',
              className: 'inp',
              placeholder: '••••',
              value: confirmPin,
              autoFocus: true,
              onChange: function (e) {
                setConfirmPin(e.target.value.replace(/\D/g, ''));
              },
              onKeyDown: function (e) {
                if (e.key === 'Enter') doConfirm();
              },
              style: { textAlign: 'center', fontSize: 22, letterSpacing: '8px' }
            })
          )
        : null,

      hasPassword
        ? h(
            'div',
            null,
            h(
              'div',
              { style: { marginBottom: 10 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }
                },
                'Correo de la cuenta'
              ),
              h('input', {
                type: 'email',
                inputMode: 'email',
                className: 'inp',
                placeholder: session.email || 'correo@ejemplo.com',
                value: confirmMail,
                autoFocus: true,
                onChange: function (e) {
                  setConfirmMail(e.target.value);
                },
                autoComplete: 'off',
                spellCheck: false,
                style: { marginBottom: 6 }
              }),
              h(
                'div',
                { style: { fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.45 } },
                'Debe coincidir con ',
                h('strong', null, session.email || 'tu correo')
              )
            ),
            h(
              'div',
              { style: { marginBottom: 10 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }
                },
                'Contraseña actual'
              ),
              h('input', {
                type: 'password',
                className: 'inp',
                placeholder: '••••••',
                value: confirmPass,
                onChange: function (e) {
                  setConfirmPass(e.target.value);
                },
                onKeyDown: function (e) {
                  if (e.key === 'Enter') doConfirm();
                }
              })
            )
          )
        : null,

      feedback
        ? h(
            'div',
            {
              style: {
                fontSize: 11.5,
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 8,
                marginTop: 4
              }
            },
            feedback
          )
        : null,

      h(
        'button',
        {
          className: 'btn btn-accent btn-block',
          onClick: doConfirm,
          disabled: busy,
          style: { marginBottom: 8, marginTop: 4 }
        },
        busy
          ? h('span', { className: 'sp-in' })
          : hasPassword
            ? 'Verificar y enviar código →'
            : 'Confirmar y aplicar →'
      ),
      h('button', { className: 'btn btn-ghost btn-block', onClick: resetVf }, 'Cancelar')
    );
  }

  // ═══ RENDER: PREPARANDO CÓDIGO (espera 15 s, offline) ═══
  if (vfStep === 'preparando') {
    var totalSec = 15;
    var pct = Math.max(0, Math.min(100, ((totalSec - prepSec) / totalSec) * 100));
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'preparando' }),
      h(
        'div',
        { className: 'vf-step otp-prep' },
        h(
          'div',
          { className: 'otp-prep-shield' },
          h('div', { className: 'otp-prep-shield-glow' }),
          h('div', { className: 'otp-prep-shield-icon' }, '✦')
        ),
        h('div', { className: 'vf-title' }, 'Preparando tu código'),
        h(
          'div',
          { className: 'vf-desc' },
          'Por seguridad, tomamos unos segundos antes de mostrarte el código.'
        ),
        h(
          'div',
          { className: 'otp-prep-bar-wrap' },
          h(
            'div',
            { className: 'otp-prep-bar' },
            h('div', { className: 'otp-prep-bar-fill', style: { width: pct + '%' } })
          ),
          h('div', { className: 'otp-prep-sec' }, prepSec + 's')
        )
      ),
      h(
        'button',
        { className: 'btn btn-ghost btn-block', onClick: resetVf, style: { marginTop: 8 } },
        'Cancelar'
      )
    );
  }

  // ═══ RENDER: CÓDIGO REVELADO + INPUT ═══
  if (vfStep === 'codigo') {
    var revealed = generatedOtpRef.current || '';
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'codigo' }),
      h(
        'div',
        { className: 'vf-step' },
        h('div', { className: 'vf-title' }, 'Tu código de confirmación'),
        h('div', { className: 'vf-desc' }, 'Escribilo abajo para aplicar el cambio.')
      ),

      // Código revelado (display prominente, estilo Apple verification)
      h(
        'div',
        { className: 'otp-reveal' },
        revealed.split('').map(function (d, i) {
          return h('span', { key: i, className: 'otp-reveal-digit' }, d);
        })
      ),

      // Input de 6 celdas para reescribirlo
      h(
        'div',
        { className: 'code-grid', style: { marginTop: 14, marginBottom: 4 } },
        Array.from({ length: 6 }).map(function (_, i) {
          return h('input', {
            key: i,
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '1',
            className: 'code-cell',
            value: codeInput[i] || '',
            autoFocus: i === 0,
            onChange: function (e) {
              var v = e.target.value.replace(/\D/g, '');
              if (v.length > 1) v = v.slice(-1);
              var arr = codeInput.split('');
              arr[i] = v;
              var combined = arr.join('').slice(0, 6);
              setCodeInput(combined);
              if (v && i < 5) {
                var sib = e.target.parentElement.children[i + 1];
                if (sib) sib.focus();
              }
            },
            onKeyDown: function (e) {
              if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
                var sib = e.target.parentElement.children[i - 1];
                if (sib) sib.focus();
              }
              if (e.key === 'Enter') doVerify();
            }
          });
        })
      ),

      feedback
        ? h(
            'div',
            {
              style: {
                fontSize: 11.5,
                color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginTop: 8,
                marginBottom: 4
              }
            },
            feedback
          )
        : null,

      h(
        'button',
        {
          className: 'btn btn-accent btn-block',
          onClick: doVerify,
          disabled: busy || codeInput.replace(/\D/g, '').length < 6,
          style: { marginTop: 10, marginBottom: 8 }
        },
        busy ? h('span', { className: 'sp-in' }) : 'Confirmar cambio'
      ),
      h('button', { className: 'btn btn-ghost btn-block', onClick: resetVf }, 'Cancelar')
    );
  }

  // ═══ RENDER: PANTALLA PRINCIPAL DE GESTIÓN ═══
  return h(
    'div',
    { className: 'modal-card' },
    h(
      'div',
      { style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 14 } },
      'Gestionar cuenta'
    ),
    isPinOnly
      ? h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11.5,
              marginBottom: 12,
              lineHeight: 1.55,
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)'
            }
          },
          '📌 Modo local. Añade email y contraseña para sincronizar en nube.'
        )
      : null,

    h(
      'div',
      {
        style: {
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 8
        }
      },
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(0);
            setFeedback(null);
          },
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 0 ? 'var(--text)' : 'transparent',
            color: tab === 0 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 0 ? 'none' : '1px solid var(--border)'
          }
        },
        '🔐 PIN'
      ),
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(1);
            setFeedback(null);
          },
          disabled: isPinOnly,
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 1 ? 'var(--text)' : 'transparent',
            color: tab === 1 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 1 ? 'none' : '1px solid var(--border)',
            opacity: isPinOnly ? 0.4 : 1
          }
        },
        '✉ Email'
      ),
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(2);
            setFeedback(null);
          },
          disabled: isPinOnly,
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 2 ? 'var(--text)' : 'transparent',
            color: tab === 2 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 2 ? 'none' : '1px solid var(--border)',
            opacity: isPinOnly ? 0.4 : 1
          }
        },
        '🔑 Contraseña'
      )
    ),

    tab === 0
      ? h(
          'div',
          null,
          h(
            'div',
            {
              style: {
                fontSize: 12,
                color: 'var(--muted)',
                marginBottom: 12,
                lineHeight: 1.5,
                background: 'var(--surface2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)'
              }
            },
            '🔒 ' +
              (hasPassword
                ? 'Confirma con contraseña y recibirás un código en tu email.'
                : 'Confirma con tu PIN actual para cambiar.')
          ),
          h('input', {
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '4',
            placeholder: '°°°°',
            className: 'inp',
            value: pinVal,
            onChange: function (e) {
              setPinVal(e.target.value.replace(/\D/g, ''));
            },
            style: {
              marginBottom: feedback ? 8 : 12,
              textAlign: 'center',
              fontSize: 20,
              letterSpacing: '8px'
            }
          }),
          feedback
            ? h(
                'div',
                {
                  style: {
                    fontSize: 11.5,
                    color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                    background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 12
                  }
                },
                feedback
              )
            : null,
          h(
            'button',
            { className: 'btn btn-accent btn-block', onClick: savePIN, disabled: busy },
            'Cambiar PIN'
          )
        )
      : tab === 1
        ? h(
            'div',
            null,
            h(
              'div',
              {
                style: {
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 12,
                  lineHeight: 1.5,
                  background: 'var(--surface2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)'
                }
              },
              '🔒 Confirma con contraseña y luego un código llegará a tu email.'
            ),
            h('input', {
              type: 'email',
              placeholder: 'Nuevo correo electrónico',
              inputMode: 'email',
              className: 'inp',
              value: emailVal,
              onChange: function (e) {
                setEmailVal(e.target.value);
              },
              style: { marginBottom: feedback ? 8 : 12 }
            }),
            feedback
              ? h(
                  'div',
                  {
                    style: {
                      fontSize: 11.5,
                      color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                      background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 12
                    }
                  },
                  feedback
                )
              : null,
            h(
              'button',
              {
                className: 'btn btn-accent btn-block',
                onClick: saveEmail,
                disabled: busy || !CLOUD_MODE || isPinOnly
              },
              'Cambiar Email'
            )
          )
        : tab === 2
          ? h(
              'div',
              null,
              h(
                'div',
                {
                  style: {
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginBottom: 12,
                    lineHeight: 1.5,
                    background: 'var(--surface2)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)'
                  }
                },
                '🔒 Confirma con contraseña y luego un código llegará a tu email.'
              ),
              h('input', {
                type: 'password',
                placeholder: 'Nueva contraseña (mín. 6 caracteres)',
                autoComplete: 'new-password',
                className: 'inp',
                value: passVal,
                onChange: function (e) {
                  setPassVal(e.target.value);
                },
                style: { marginBottom: feedback ? 8 : 12 }
              }),
              feedback
                ? h(
                    'div',
                    {
                      style: {
                        fontSize: 11.5,
                        color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                        background:
                          feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 12
                      }
                    },
                    feedback
                  )
                : null,
              h(
                'button',
                {
                  className: 'btn btn-accent btn-block',
                  onClick: savePassword,
                  disabled: busy || !CLOUD_MODE || isPinOnly
                },
                'Cambiar Contraseña'
              )
            )
          : null,

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          resetVf();
          props.onClose();
        },
        style: { marginTop: 12 }
      },
      'Cerrar'
    )
  );
}


// ── js/modals/diagnostico.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/diagnostico.js
//  Modal diagnóstico admin
// ════════════════════════════════════════════════════════════════
function DiagnosticoModal(props) {
  var session = props.session;
  var lsS = useState(null);
  var localData = lsS[0],
    setLocalData = lsS[1];
  var cloudS = useState(null);
  var cloudData = cloudS[0],
    setCloudData = cloudS[1];
  var loadS = useState(true);
  var loading = loadS[0],
    setLoading = loadS[1];
  var errS = useState(null);
  var cloudErr = errS[0],
    setCloudErr = errS[1];

  function scanLocal() {
    var found = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('mt_pin_') === 0) {
          var raw = localStorage.getItem(k);
          var val = raw;
          try {
            val = JSON.parse(raw);
          } catch (e) {}
          found.push({
            key: k,
            pin: val,
            tipo: k.indexOf('mt_pin_app_') === 0 ? 'app (v.antigua)' : 'estándar'
          });
        }
      }
      var ses = leer(SKEY, null);
      if (ses && ses.pin) {
        found.push({ key: SKEY + ' (sesión activa)', pin: ses.pin, tipo: 'sesión' });
      }
    } catch (e) {
      console.warn('scanLocal error', e);
    }
    return found;
  }

  function scanCloud() {
    if (!CLOUD_MODE || !SUPA) {
      setCloudErr('Sin conexión a la nube — solo se muestran datos locales.');
      setLoading(false);
      return;
    }
    withTimeout(
      SUPA.from('pin_lookup')
        .select('pin,user_email,user_id,updated_at')
        .order('updated_at', { ascending: false }),
      8000,
      'Diagnóstico nube'
    )
      .then(function (res) {
        if (res && res.error) throw res.error;
        setCloudData(res.data || []);
        setLoading(false);
      })
      .catch(function (e) {
        setCloudErr(traducirError(e) || 'No se pudo leer la nube.');
        setLoading(false);
      });
  }

  useEffect(function () {
    setLocalData(scanLocal());
    scanCloud();
  }, []);

  var cloudPins = {};
  if (cloudData) {
    cloudData.forEach(function (r) {
      if (r.pin) cloudPins[String(r.pin)] = r;
    });
  }

  function fmtFecha(s) {
    if (!s) return '—';
    try {
      var d = new Date(s);
      return (
        d.toLocaleDateString('es-CO') +
        ' ' +
        d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (e) {
      return s;
    }
  }

  function resync(pin) {
    if (!CLOUD_MODE || !SUPA) {
      alert('Necesitas conexión a la nube.');
      return;
    }
    if (!session.email || session.pinOnly || session.guest) {
      alert('Inicia sesión con tu correo primero.');
      return;
    }
    if (!confirm('¿Vincular el PIN ' + pin + ' a ' + session.email + '?')) return;
    SUPA.from('pin_lookup')
      .upsert({
        pin: String(pin),
        user_email: session.email,
        user_id: session.uid,
        updated_at: new Date().toISOString()
      })
      .then(function (res) {
        if (res && res.error) throw res.error;
        alert('✓ PIN ' + pin + ' sincronizado.');
        setLoading(true);
        scanCloud();
      })
      .catch(function (e) {
        alert('Error: ' + (traducirError(e) || 'inténtalo de nuevo'));
      });
  }

  return h(
    'div',
    { className: 'modal-card', style: { maxHeight: '80vh', overflowY: 'auto' } },
    h(
      'div',
      { style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 } },
      '🔍 Diagnóstico de PINs'
    ),
    h(
      'div',
      { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 } },
      'Compara los PINs guardados en este dispositivo con los registrados en la nube. Solo lectura.'
    ),

    h(
      'div',
      { className: 'diag-sec' },
      h('div', { className: 'diag-sec-ttl' }, '☁ En la nube (Supabase)'),
      loading
        ? h(
            'div',
            { className: 'diag-empty' },
            h('span', { className: 'sp-in' }),
            ' Consultando la nube...'
          )
        : cloudErr
          ? h('div', { className: 'diag-empty', style: { color: 'var(--danger)' } }, cloudErr)
          : !cloudData || cloudData.length === 0
            ? h('div', { className: 'diag-empty' }, 'No hay PINs registrados en la nube.')
            : cloudData.map(function (r, i) {
                return h(
                  'div',
                  { key: 'c' + i, className: 'diag-row' },
                  h(
                    'div',
                    { style: { minWidth: 0, flex: 1 } },
                    h('div', { className: 'diag-pin-big' }, r.pin),
                    h(
                      'div',
                      { className: 'diag-row-v', style: { textAlign: 'left', marginTop: 2 } },
                      r.user_email || 'sin correo'
                    )
                  ),
                  h(
                    'div',
                    { style: { textAlign: 'right', flexShrink: 0 } },
                    h('div', { className: 'diag-badge cloud' }, 'NUBE'),
                    h(
                      'div',
                      { style: { fontSize: 9.5, color: 'var(--muted)', marginTop: 3 } },
                      fmtFecha(r.updated_at)
                    )
                  )
                );
              })
    ),

    h(
      'div',
      { className: 'diag-sec' },
      h('div', { className: 'diag-sec-ttl' }, '📱 En este dispositivo (localStorage)'),
      !localData || localData.length === 0
        ? h('div', { className: 'diag-empty' }, 'No hay PINs guardados localmente.')
        : localData.map(function (d, i) {
            var pinStr = String(d.pin);
            var enNube = cloudPins[pinStr];
            return h(
              'div',
              { key: 'l' + i, className: 'diag-row' },
              h(
                'div',
                { style: { minWidth: 0, flex: 1 } },
                h('div', { className: 'diag-pin-big' }, d.pin),
                h(
                  'div',
                  {
                    className: 'diag-row-v',
                    style: { textAlign: 'left', marginTop: 2, fontSize: 10 }
                  },
                  d.tipo + ' · ' + d.key
                )
              ),
              h(
                'div',
                {
                  style: {
                    textAlign: 'right',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    alignItems: 'flex-end'
                  }
                },
                enNube
                  ? h('div', { className: 'diag-badge ok' }, '✓ EN NUBE')
                  : h('div', { className: 'diag-badge warn' }, 'SOLO LOCAL'),
                !enNube && !session.pinOnly && !session.guest && session.email
                  ? h(
                      'button',
                      {
                        onClick: function () {
                          resync(d.pin);
                        },
                        style: {
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 99,
                          border: '1px solid var(--accent)',
                          background: 'transparent',
                          color: 'var(--accent)',
                          cursor: 'pointer'
                        }
                      },
                      '↑ Sincronizar'
                    )
                  : null
              )
            );
          })
    ),

    h(
      'div',
      { className: 'diag-note' },
      h('strong', null, 'Cómo leer: '),
      'Los marcados ',
      h('strong', null, '✓ EN NUBE'),
      ' están respaldados. Los ',
      h('strong', null, 'SOLO LOCAL'),
      ' viven aquí.'
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        },
        style: { marginTop: 14 }
      },
      'Cerrar'
    )
  );
}


// ── js/modals/asignar-pins.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/asignar-pins.js
//  Modal asignar PINs admin
// ════════════════════════════════════════════════════════════════
function AsignarPINsModal(props) {
  var us = useState([]);
  var users = us[0],
    setUsers = us[1];
  var ld = useState(true);
  var loading = ld[0],
    setLoading = ld[1];
  var er = useState(null);
  var error = er[0],
    setError = er[1];
  var qs = useState('');
  var query = qs[0],
    setQuery = qs[1];
  var fb = useState(null);
  var feedback = fb[0],
    setFeedback = fb[1];
  var ed = useState(null);
  var editing = ed[0],
    setEditing = ed[1];
  var nv = useState('');
  var newPin = nv[0],
    setNewPin = nv[1];
  var bs = useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var cf = useState(null);
  var confirmDel = cf[0],
    setConfirmDel = cf[1];

  function fmtFecha(s) {
    if (!s) return '—';
    try {
      var d = new Date(s);
      return (
        d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) +
        ' · ' +
        d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (e) {
      return '—';
    }
  }

  function cargar() {
    if (!CLOUD_MODE || !SUPA) {
      setError('Sin conexión a la nube');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    withTimeout(
      SUPA.from('pin_lookup')
        .select('pin,user_email,user_id,updated_at')
        .order('updated_at', { ascending: false }),
      IS_IOS_SAFARI ? 15000 : 8000,
      'Cargar usuarios'
    )
      .then(function (res) {
        if (res && res.error) throw res.error;
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch(function (e) {
        setError(traducirError(e) || 'Error al cargar usuarios');
        setLoading(false);
      });
  }

  useEffect(function () {
    cargar();
  }, []);

  function generarRandom() {
    var ocupados = {};
    users.forEach(function (u) {
      if (u.pin) ocupados[String(u.pin)] = true;
    });
    ocupados['9999'] = true;
    for (var i = 0; i < 100; i++) {
      var p = String(Math.floor(1000 + Math.random() * 9000));
      if (!ocupados[p]) return p;
    }
    return null;
  }

  function regenerarPIN(user) {
    var nuevo = generarRandom();
    if (!nuevo) {
      setFeedback({ type: 'err', msg: 'No hay PINs disponibles' });
      return;
    }
    aplicarPIN(user, nuevo, 'PIN regenerado a ' + nuevo);
  }

  function aplicarPIN(user, pin, msgOk) {
    setBusy(true);
    setFeedback(null);
    SUPA.from('pin_lookup')
      .upsert(
        {
          user_id: user.user_id,
          user_email: user.user_email,
          pin: String(pin),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: 'ok', msg: msgOk || '✓ PIN actualizado' });
        setEditing(null);
        setNewPin('');
        setConfirmDel(null);
        cargar();
        setTimeout(function () {
          setFeedback(null);
        }, 2500);
      })
      .catch(function (e) {
        setFeedback({ type: 'err', msg: traducirError(e) || 'Error al actualizar' });
      })
      .finally(function () {
        setBusy(false);
      });
  }

  function eliminarPIN(user) {
    setBusy(true);
    setFeedback(null);
    SUPA.from('pin_lookup')
      .delete()
      .eq('user_id', user.user_id)
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: 'ok', msg: '✓ PIN eliminado de ' + user.user_email });
        setConfirmDel(null);
        cargar();
        setTimeout(function () {
          setFeedback(null);
        }, 2500);
      })
      .catch(function (e) {
        setFeedback({ type: 'err', msg: traducirError(e) || 'Error al eliminar' });
      })
      .finally(function () {
        setBusy(false);
      });
  }

  function copiarPIN(pin) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(String(pin));
      }
      haptic();
      setFeedback({ type: 'ok', msg: '✓ PIN ' + pin + ' copiado' });
      setTimeout(function () {
        setFeedback(null);
      }, 1800);
    } catch (e) {}
  }

  function guardarPINManual() {
    if (!/^\d{4}$/.test(newPin)) {
      setFeedback({ type: 'err', msg: 'PIN debe tener 4 dígitos' });
      return;
    }
    if (newPin === '9999' && editing.user_email !== 'admin@miturno.com') {
      setFeedback({ type: 'err', msg: 'PIN 9999 reservado para admin' });
      return;
    }
    var duplicado = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].pin === newPin && users[i].user_id !== editing.user_id) {
        duplicado = users[i];
        break;
      }
    }
    if (duplicado) {
      setFeedback({ type: 'err', msg: 'PIN ' + newPin + ' ya usado por ' + duplicado.user_email });
      return;
    }
    aplicarPIN(editing, newPin, '✓ PIN actualizado a ' + newPin);
  }

  var q = query.trim().toLowerCase();
  var filtered = users.filter(function (u) {
    if (!q) return true;
    return (
      (u.user_email || '').toLowerCase().indexOf(q) >= 0 || String(u.pin || '').indexOf(q) >= 0
    );
  });

  var stats = {
    total: users.length,
    conPin: users.filter(function (u) {
      return u.pin;
    }).length,
    disponibles: 9000 - users.length
  };

  return h(
    'div',
    { className: 'modal-card', style: { maxHeight: '85vh', overflowY: 'auto', maxWidth: 520 } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }
      },
      h(
        'div',
        null,
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }
          },
          h('span', { style: { fontSize: 22 } }, '🔑'),
          h('span', null, 'Asignar PINs')
        ),
        h(
          'div',
          { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
          'Panel administrativo'
        )
      ),
      h(
        'button',
        {
          onClick: function () {
            haptic();
            props.onClose();
          },
          style: {
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }
        },
        '×'
      )
    ),

    h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 14,
          marginTop: 12
        }
      },
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          { style: { fontSize: 22, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 } },
          stats.conPin
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Asignados'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          {
            style: { fontSize: 22, fontWeight: 900, color: 'var(--success,#10b981)', lineHeight: 1 }
          },
          stats.disponibles > 0 ? stats.disponibles : '∞'
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Disponibles'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          { style: { fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1 } },
          stats.total
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Usuarios'
        )
      )
    ),

    h(
      'div',
      { style: { position: 'relative', marginBottom: 12 } },
      h('input', {
        type: 'text',
        className: 'inp',
        placeholder: '🔍 Buscar por correo o PIN...',
        value: query,
        onChange: function (e) {
          setQuery(e.target.value);
        },
        style: { paddingLeft: 14 }
      })
    ),

    feedback
      ? h(
          'div',
          {
            style: {
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 600,
              background:
                feedback.type === 'ok'
                  ? 'var(--success-dim,rgba(16,185,129,0.12))'
                  : 'var(--danger-dim)',
              color: feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)',
              border:
                '1px solid ' + (feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)')
            }
          },
          feedback.msg
        )
      : null,

    confirmDel
      ? h(
          'div',
          {
            style: {
              padding: 14,
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              background: 'var(--danger-dim)',
              border: '2px solid var(--danger)'
            }
          },
          h(
            'div',
            { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 } },
            '⚠ ¿Eliminar PIN?'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 } },
            'Se eliminará el PIN ',
            h('strong', null, confirmDel.user.pin),
            ' de ',
            h('strong', null, confirmDel.user.user_email),
            '.'
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8 } },
            h(
              'button',
              {
                onClick: function () {
                  eliminarPIN(confirmDel.user);
                },
                disabled: busy,
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              busy ? 'Eliminando...' : 'Sí, eliminar'
            ),
            h(
              'button',
              {
                onClick: function () {
                  setConfirmDel(null);
                },
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    editing
      ? h(
          'div',
          {
            style: {
              padding: 14,
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              background: 'var(--surface2)',
              border: '2px solid var(--accent)'
            }
          },
          h(
            'div',
            { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 } },
            '✏ Asignar PIN manual'
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 } },
            'Usuario: ',
            h('strong', null, editing.user_email)
          ),
          h('input', {
            type: 'tel',
            inputMode: 'numeric',
            maxLength: 4,
            className: 'inp',
            placeholder: '0000',
            value: newPin,
            autoFocus: true,
            onChange: function (e) {
              setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
            },
            onKeyDown: function (e) {
              if (e.key === 'Enter') guardarPINManual();
            },
            style: {
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '8px',
              fontFamily: 'ui-monospace,monospace'
            }
          }),
          h(
            'div',
            { style: { display: 'flex', gap: 8, marginTop: 10 } },
            h(
              'button',
              {
                onClick: guardarPINManual,
                disabled: busy || newPin.length !== 4,
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: newPin.length === 4 ? 'pointer' : 'not-allowed',
                  opacity: newPin.length === 4 ? 1 : 0.5
                }
              },
              busy ? 'Guardando...' : '✓ Asignar PIN'
            ),
            h(
              'button',
              {
                onClick: function () {
                  setEditing(null);
                  setNewPin('');
                },
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    loading
      ? h(
          'div',
          { style: { textAlign: 'center', padding: '40px 0', color: 'var(--muted)' } },
          h('span', { className: 'sp-in' }),
          h('div', { style: { marginTop: 8, fontSize: 12 } }, 'Cargando usuarios...')
        )
      : error
        ? h(
            'div',
            {
              style: {
                padding: 20,
                textAlign: 'center',
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                borderRadius: 'var(--radius)'
              }
            },
            error
          )
        : filtered.length === 0
          ? h(
              'div',
              {
                style: {
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13
                }
              },
              query ? 'Sin resultados para "' + query + '"' : 'No hay usuarios con PIN registrado.'
            )
          : h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              filtered.map(function (u) {
                var esAdmin = u.pin === '9999' || u.user_email === 'admin@miturno.com';
                var inicial = (u.user_email || '?')[0].toUpperCase();
                return h(
                  'div',
                  {
                    key: u.user_id,
                    style: {
                      padding: 12,
                      background: esAdmin
                        ? 'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)'
                        : 'var(--surface)',
                      border: '1px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 'var(--radius)',
                      transition: 'all 0.2s'
                    }
                  },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } },
                    h(
                      'div',
                      {
                        style: {
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: esAdmin ? 'var(--accent)' : 'var(--surface2)',
                          color: esAdmin ? '#fff' : 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 800,
                          flexShrink: 0,
                          border: '2px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)')
                        }
                      },
                      esAdmin ? '🔓' : inicial
                    ),
                    h(
                      'div',
                      { style: { minWidth: 0, flex: 1 } },
                      h(
                        'div',
                        {
                          style: {
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        },
                        u.user_email || 'sin correo',
                        esAdmin
                          ? h(
                              'span',
                              {
                                style: {
                                  marginLeft: 6,
                                  fontSize: 9,
                                  fontWeight: 800,
                                  background: 'var(--accent)',
                                  color: '#fff',
                                  padding: '2px 5px',
                                  borderRadius: 3,
                                  letterSpacing: '0.5px'
                                }
                              },
                              'ADMIN'
                            )
                          : null
                      ),
                      h(
                        'div',
                        { style: { fontSize: 10.5, color: 'var(--muted)', marginTop: 2 } },
                        fmtFecha(u.updated_at)
                      )
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          copiarPIN(u.pin);
                        },
                        title: 'Copiar PIN',
                        style: {
                          background: esAdmin ? 'rgba(255,255,255,0.15)' : 'var(--surface2)',
                          border: '1px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 18,
                          fontWeight: 900,
                          color: esAdmin ? 'var(--accent)' : 'var(--text)',
                          fontFamily: 'ui-monospace,monospace',
                          letterSpacing: '2px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }
                      },
                      u.pin || '----'
                    )
                  ),
                  h(
                    'div',
                    { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 } },
                    h(
                      'button',
                      {
                        onClick: function () {
                          setEditing(u);
                          setNewPin('');
                          setFeedback(null);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--text)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '✏ Editar'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          regenerarPIN(u);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--accent)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '🔄 Nuevo'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          haptic();
                          enviarPINPorEmail({ to: u.user_email, pin: u.pin })
                            .then(function (r) {
                              setFeedback({
                                type: 'ok',
                                msg: r.message || '✓ PIN enviado a ' + u.user_email
                              });
                              setTimeout(function () {
                                setFeedback(null);
                              }, 3000);
                            })
                            .catch(function (e) {
                              setFeedback({ type: 'err', msg: e.message || 'Error al enviar' });
                            });
                        },
                        disabled: busy || !u.pin || !CLOUD_MODE,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent)',
                          cursor: u.pin && CLOUD_MODE ? 'pointer' : 'not-allowed',
                          opacity: u.pin && CLOUD_MODE ? 1 : 0.4
                        }
                      },
                      '📧 Enviar'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          setConfirmDel({ user: u });
                          setFeedback(null);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--danger)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--danger)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '🗑 Borrar'
                    )
                  )
                );
              })
            ),

    h(
      'div',
      {
        style: {
          marginTop: 14,
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          color: 'var(--muted)',
          lineHeight: 1.5
        }
      },
      h('strong', null, '💡 Tip: '),
      'PIN 9999 reservado para admin.'
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        },
        style: { marginTop: 12 }
      },
      'Cerrar'
    )
  );
}


// ── js/modals/usuarios.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/usuarios.js
//  Modal usuarios admin
// ════════════════════════════════════════════════════════════════
function UsuariosModal(props) {
  var us = useState([]);
  var users = us[0],
    setUsers = us[1];
  var ld = useState(true);
  var loading = ld[0],
    setLoading = ld[1];
  var er = useState(null);
  var error = er[0],
    setError = er[1];
  var qs = useState('');
  var query = qs[0],
    setQuery = qs[1];
  var fb = useState(null);
  var feedback = fb[0],
    setFeedback = fb[1];
  var dt = useState(null);
  var detail = dt[0],
    setDetail = dt[1];
  var so = useState('recent');
  var sortBy = so[0],
    setSortBy = so[1];
  var fl = useState('all');
  var filter = fl[0],
    setFilter = fl[1];
  var bs = useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var rs = useState(null);
  var resetUser = rs[0],
    setResetUser = rs[1];

  function fmtFecha(s) {
    if (!s) return 'Nunca';
    try {
      var d = new Date(s);
      var diff = Date.now() - d.getTime();
      var dias = Math.floor(diff / 86400000);
      if (dias === 0) return 'Hoy';
      if (dias === 1) return 'Ayer';
      if (dias < 7) return 'Hace ' + dias + ' días';
      if (dias < 30) return 'Hace ' + Math.floor(dias / 7) + ' sem';
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
    } catch (e) {
      return '—';
    }
  }

  function cargar() {
    if (!CLOUD_MODE || !SUPA) {
      setError('Sin conexión a la nube');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    withTimeout(
      SUPA.from('pin_lookup').select('*').order('updated_at', { ascending: false }),
      IS_IOS_SAFARI ? 15000 : 8000,
      'Cargar usuarios'
    )
      .then(function (res) {
        if (res && res.error) throw res.error;
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch(function (e) {
        setError(traducirError(e) || 'Error al cargar usuarios');
        setLoading(false);
      });
  }

  useEffect(function () {
    cargar();
  }, []);

  function copiar(texto) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(String(texto));
      }
      haptic();
      setFeedback({ type: 'ok', msg: '✓ Copiado' });
      setTimeout(function () {
        setFeedback(null);
      }, 1500);
    } catch (e) {}
  }

  function enviarReset(email) {
    if (!SUPA || !CLOUD_MODE) return;
    setBusy(true);
    setFeedback(null);
    var redirectTo = window.location.origin + window.location.pathname;
    SUPA.auth
      .resetPasswordForEmail(email, { redirectTo: redirectTo })
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: 'ok', msg: '✓ Email de reseteo enviado a ' + email });
        setResetUser(null);
        setTimeout(function () {
          setFeedback(null);
        }, 3000);
      })
      .catch(function (e) {
        setFeedback({ type: 'err', msg: traducirError(e) || 'Error al enviar reseteo' });
      })
      .finally(function () {
        setBusy(false);
      });
  }

  var q = query.trim().toLowerCase();
  var filtered = users.filter(function (u) {
    if (filter === 'admin' && u.pin !== '9999' && u.user_email !== 'admin@miturno.com')
      return false;
    if (filter === 'nopin' && u.pin) return false;
    if (filter === 'conpin' && !u.pin) return false;

    if (!q) return true;
    return (
      (u.user_email || '').toLowerCase().indexOf(q) >= 0 || String(u.pin || '').indexOf(q) >= 0
    );
  });

  filtered.sort(function (a, b) {
    if (sortBy === 'recent')
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    if (sortBy === 'email') return (a.user_email || '').localeCompare(b.user_email || '');
    if (sortBy === 'pin') return String(a.pin || '9999').localeCompare(String(b.pin || '9999'));
    return 0;
  });

  var stats = {
    total: users.length,
    activos: users.filter(function (u) {
      if (!u.updated_at) return false;
      return Date.now() - new Date(u.updated_at).getTime() < 7 * 86400000;
    }).length,
    admins: users.filter(function (u) {
      return u.pin === '9999' || u.user_email === 'admin@miturno.com';
    }).length,
    sinPin: users.filter(function (u) {
      return !u.pin;
    }).length
  };

  // ── Funciones de gestión admin en vista detalle ──
  function eliminarUsuarioCompleto(user) {
    if (!SUPA || !CLOUD_MODE) {
      setFeedback({ type: "err", msg: "Sin conexión a la nube" });
      return;
    }
    if (!confirm("¿Estás seguro de eliminar a " + user.user_email + "?\n\nSe eliminarán todos sus datos (PIN, turnos, perfil).\n\nNota: El usuario de Auth debe eliminarse manualmente en Supabase Studio.")) return;
    setBusy(true);
    setFeedback(null);
    var uid = user.user_id;
    Promise.all([
      SUPA.from("pin_lookup").delete().eq("user_id", uid),
      SUPA.from("perfiles").delete().eq("id", uid),
      SUPA.from("turnos").delete().eq("user_id", uid),
      SUPA.from("turno_activo").delete().eq("user_id", uid)
    ])
      .then(function (results) {
        var errors = results.filter(function (r) { return r && r.error; });
        if (errors.length > 0) throw new Error("Error al eliminar datos");
        setFeedback({ type: "ok", msg: "✓ Usuario eliminado correctamente" });
        setDetail(null);
        cargar();
        setTimeout(function () { setFeedback(null); }, 3000);
      })
      .catch(function (e) {
        setFeedback({ type: "err", msg: traducirError(e) || "Error al eliminar usuario" });
      })
      .finally(function () { setBusy(false); });
  }

  function actualizarPINAdmin(user) {
    if (!SUPA || !CLOUD_MODE) {
      setFeedback({ type: "err", msg: "Sin conexión a la nube" });
      return;
    }
    var nuevoPIN = prompt("Ingresa el nuevo PIN de 4 dígitos para " + user.user_email + ":");
    if (!nuevoPIN) return;
    nuevoPIN = nuevoPIN.replace(/\D/g, "").slice(0, 4);
    if (nuevoPIN.length !== 4) {
      setFeedback({ type: "err", msg: "El PIN debe tener exactamente 4 dígitos" });
      return;
    }
    if (nuevoPIN === "9999" && user.user_email !== "admin@miturno.com") {
      setFeedback({ type: "err", msg: "PIN 9999 reservado para admin" });
      return;
    }
    setBusy(true);
    setFeedback(null);
    SUPA.from("pin_lookup")
      .upsert({
        user_id: user.user_id,
        user_email: user.user_email,
        pin: nuevoPIN,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: "ok", msg: "✓ PIN actualizado a " + nuevoPIN });
        setDetail(null);
        setTimeout(function () { setFeedback(null); }, 3000);
      })
      .catch(function (e) {
        setFeedback({ type: "err", msg: traducirError(e) || "Error al actualizar PIN" });
      })
      .finally(function () { setBusy(false); });
  }

  function actualizarEmailAdmin(user) {
    if (!SUPA || !CLOUD_MODE) {
      setFeedback({ type: "err", msg: "Sin conexión a la nube" });
      return;
    }
    var nuevoEmail = prompt("Ingresa el nuevo correo para " + user.user_email + ":");
    if (!nuevoEmail) return;
    nuevoEmail = nuevoEmail.trim().toLowerCase();
    if (!nuevoEmail.includes("@")) {
      setFeedback({ type: "err", msg: "Ingresa un correo válido" });
      return;
    }
    setBusy(true);
    setFeedback(null);
    SUPA.from("pin_lookup")
      .update({
        user_email: nuevoEmail,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.user_id)
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: "ok", msg: "✓ Correo actualizado en pin_lookup. El cambio en Auth debe hacerlo el usuario." });
        setDetail(null);
        setTimeout(function () { setFeedback(null); }, 4000);
      })
      .catch(function (e) {
        setFeedback({ type: "err", msg: traducirError(e) || "Error al actualizar correo" });
      })
      .finally(function () { setBusy(false); });
  }



  // Vista detalle
  if (detail) {
    var esAdm = detail.pin === '9999' || detail.user_email === 'admin@miturno.com';
    var inicial = (detail.user_email || '?')[0].toUpperCase();
    return h(
      'div',
      { className: 'modal-card', style: { maxWidth: 480 } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } },
        h(
          'button',
          {
            onClick: function () {
              haptic();
              setDetail(null);
            },
            style: {
              background: 'transparent',
              border: 'none',
              fontSize: 22,
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1
            }
          },
          '←'
        ),
        h(
          'div',
          { style: { fontSize: 16, fontWeight: 800, color: 'var(--text)' } },
          'Detalle de usuario'
        )
      ),
      h(
        'div',
        {
          style: {
            textAlign: 'center',
            marginBottom: 20,
            padding: '20px 0',
            background: esAdm
              ? 'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)'
              : 'var(--surface2)',
            borderRadius: 'var(--radius)',
            border: '1px solid ' + (esAdm ? 'var(--accent)' : 'var(--border)')
          }
        },
        h(
          'div',
          {
            style: {
              width: 72,
              height: 72,
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: esAdm ? 'var(--accent)' : 'var(--surface)',
              color: esAdm ? '#fff' : 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
              border: '3px solid ' + (esAdm ? 'var(--accent)' : 'var(--border)')
            }
          },
          esAdm ? '🔓' : inicial
        ),
        h(
          'div',
          {
            style: {
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 4,
              wordBreak: 'break-all',
              padding: '0 14px'
            }
          },
          detail.user_email
        ),
        esAdm
          ? h(
              'div',
              {
                style: {
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.5px'
                }
              },
              'ADMINISTRADOR'
            )
          : null
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)'
            }
          },
          h(
            'div',
            null,
            h(
              'div',
              {
                style: {
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 2
                }
              },
              'PIN de acceso'
            ),
            h(
              'div',
              {
                style: {
                  fontSize: 18,
                  fontWeight: 900,
                  color: 'var(--accent)',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '2px'
                }
              },
              detail.pin || 'Sin asignar'
            )
          ),
          detail.pin
            ? h(
                'button',
                {
                  onClick: function () {
                    copiar(detail.pin);
                  },
                  style: {
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }
                },
                '📋 Copiar'
              )
            : null
        ),
        h(
          'div',
          {
            style: {
              padding: '12px 14px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)'
            }
          },
          h(
            'div',
            {
              style: {
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 2
              }
            },
            'Última actualización'
          ),
          h(
            'div',
            { style: { fontSize: 13, fontWeight: 600, color: 'var(--text)' } },
            fmtFecha(detail.updated_at)
          )
        )
      ),
      feedback
        ? h(
            'div',
            {
              style: {
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 600,
                background:
                  feedback.type === 'ok'
                    ? 'var(--success-dim,rgba(16,185,129,0.12))'
                    : 'var(--danger-dim)',
                color: feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)',
                border:
                  '1px solid ' +
                  (feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)')
              }
            },
            feedback.msg
          )
        : null,
      resetUser
        ? h(
            'div',
            {
              style: {
                padding: 14,
                borderRadius: 'var(--radius)',
                marginBottom: 12,
                background: 'var(--accent-dim)',
                border: '2px solid var(--accent)'
              }
            },
            h(
              'div',
              {
                style: { fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }
              },
              '📧 Enviar reseteo de contraseña'
            ),
            h(
              'div',
              { style: { fontSize: 12, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 } },
              'Se enviará un email a ',
              h('strong', null, detail.user_email),
              ' con un enlace.'
            ),
            h(
              'div',
              { style: { display: 'flex', gap: 8 } },
              h(
                'button',
                {
                  onClick: function () {
                    enviarReset(detail.user_email);
                  },
                  disabled: busy,
                  style: {
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer'
                  }
                },
                busy ? 'Enviando...' : '✓ Sí, enviar'
              ),
              h(
                'button',
                {
                  onClick: function () {
                    setResetUser(null);
                  },
                  style: {
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer'
                  }
                },
                'Cancelar'
              )
            )
          )
        : null,
      !resetUser
        ? h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } },
            h(
              'button',
              {
                onClick: function () {
                  copiar(detail.user_email);
                },
                style: {
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }
              },
              h('span', { style: { fontSize: 18 } }, '📧'),
              h('span', null, 'Copiar correo')
            ),
            h(
              'button',
              {
                onClick: function () {
                  setResetUser(detail);
                },
                disabled: esAdm,
                style: {
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent-dim)',
                  color: esAdm ? 'var(--muted)' : 'var(--accent)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: esAdm ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: esAdm ? 0.5 : 1
                }
              },
              h('span', { style: { fontSize: 18 } }, '🔑'),
              h('span', null, 'Resetear contraseña (email)')
            ),
            // -- Nuevas acciones de admin --
            h(
              'button',
              {
                onClick: function () {
                  actualizarPINAdmin(detail);
                },
                disabled: esAdm,
                style: {
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent-dim)',
                  color: esAdm ? 'var(--muted)' : 'var(--accent)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: esAdm ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: esAdm ? 0.5 : 1
                }
              },
              h('span', { style: { fontSize: 18 } }, '🔑'),
              h('span', null, 'Modificar PIN')
            ),
            h(
              'button',
              {
                onClick: function () {
                  actualizarEmailAdmin(detail);
                },
                disabled: esAdm,
                style: {
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent-dim)',
                  color: esAdm ? 'var(--muted)' : 'var(--accent)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: esAdm ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: esAdm ? 0.5 : 1
                }
              },
              h('span', { style: { fontSize: 18 } }, '✉'),
              h('span', null, 'Modificar correo')
            ),
            h(
              'button',
              {
                onClick: function () {
                  eliminarUsuarioCompleto(detail);
                },
                disabled: esAdm || busy,
                style: {
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--danger)',
                  background: 'var(--danger-dim)',
                  color: esAdm ? 'var(--muted)' : 'var(--danger)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: esAdm ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: esAdm ? 0.5 : 1
                }
              },
              h('span', { style: { fontSize: 18 } }, '🗑'),
              h('span', null, 'Borrar usuario')
            )
          )
        : null,
      h(
        'button',
        {
          className: 'btn btn-ghost btn-block',
          onClick: function () {
            haptic();
            setDetail(null);
          }
        },
        '← Volver a la lista'
      )
    );
  }

  // Vista lista
  return h(
    'div',
    { className: 'modal-card', style: { maxWidth: 520 } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }
      },
      h(
        'div',
        null,
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }
          },
          h('span', { style: { fontSize: 22 } }, '👥'),
          h('span', null, 'Gestión de Usuarios')
        ),
        h(
          'div',
          { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
          'Panel administrativo · ' + stats.total + ' usuarios'
        )
      ),
      h(
        'button',
        {
          onClick: function () {
            haptic();
            props.onClose();
          },
          style: {
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }
        },
        '×'
      )
    ),

    h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 6,
          marginBottom: 14,
          marginTop: 12
        }
      },
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '10px 6px',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          { style: { fontSize: 18, fontWeight: 900, color: 'var(--text)', lineHeight: 1 } },
          stats.total
        ),
        h(
          'div',
          {
            style: {
              fontSize: 9,
              color: 'var(--muted)',
              marginTop: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }
          },
          'Total'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--success-dim,rgba(16,185,129,0.12))',
            padding: '10px 6px',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            border: '1px solid var(--success,#10b981)'
          }
        },
        h(
          'div',
          {
            style: { fontSize: 18, fontWeight: 900, color: 'var(--success,#10b981)', lineHeight: 1 }
          },
          stats.activos
        ),
        h(
          'div',
          {
            style: {
              fontSize: 9,
              color: 'var(--muted)',
              marginTop: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }
          },
          'Activos 7d'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--accent-dim)',
            padding: '10px 6px',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            border: '1px solid var(--accent)'
          }
        },
        h(
          'div',
          { style: { fontSize: 18, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 } },
          stats.admins
        ),
        h(
          'div',
          {
            style: {
              fontSize: 9,
              color: 'var(--muted)',
              marginTop: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }
          },
          'Admins'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--danger-dim)',
            padding: '10px 6px',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            border: '1px solid var(--danger)'
          }
        },
        h(
          'div',
          { style: { fontSize: 18, fontWeight: 900, color: 'var(--danger)', lineHeight: 1 } },
          stats.sinPin
        ),
        h(
          'div',
          {
            style: {
              fontSize: 9,
              color: 'var(--muted)',
              marginTop: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }
          },
          'Sin PIN'
        )
      )
    ),

    h('input', {
      type: 'text',
      className: 'inp',
      placeholder: '🔍 Buscar por correo o PIN...',
      value: query,
      onChange: function (e) {
        setQuery(e.target.value);
      },
      style: { marginBottom: 10 }
    }),

    h(
      'div',
      { style: { display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 } },
      [
        { id: 'all', label: 'Todos', count: users.length },
        { id: 'admin', label: '🔓 Admins', count: stats.admins },
        { id: 'conpin', label: 'Con PIN', count: users.length - stats.sinPin },
        { id: 'nopin', label: 'Sin PIN', count: stats.sinPin }
      ].map(function (f) {
        var active = filter === f.id;
        return h(
          'button',
          {
            key: f.id,
            onClick: function () {
              haptic();
              setFilter(f.id);
            },
            style: {
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
              background: active ? 'var(--accent-dim)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }
          },
          f.label + ' · ' + f.count
        );
      })
    ),

    h(
      'div',
      { style: { display: 'flex', gap: 6, marginBottom: 12, fontSize: 11 } },
      h(
        'span',
        { style: { color: 'var(--muted)', fontWeight: 600, alignSelf: 'center' } },
        'Ordenar:'
      ),
      ['recent', 'email', 'pin'].map(function (s) {
        var labels = { recent: '⏱ Reciente', email: 'A-Z', pin: 'PIN' };
        var active = sortBy === s;
        return h(
          'button',
          {
            key: s,
            onClick: function () {
              haptic();
              setSortBy(s);
            },
            style: {
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
              background: active ? 'var(--accent-dim)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--muted)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }
          },
          labels[s]
        );
      })
    ),

    feedback
      ? h(
          'div',
          {
            style: {
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 600,
              background:
                feedback.type === 'ok'
                  ? 'var(--success-dim,rgba(16,185,129,0.12))'
                  : 'var(--danger-dim)',
              color: feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)'
            }
          },
          feedback.msg
        )
      : null,

    loading
      ? h(
          'div',
          { style: { textAlign: 'center', padding: '40px 0', color: 'var(--muted)' } },
          h('span', { className: 'sp-in' }),
          h('div', { style: { marginTop: 8, fontSize: 12 } }, 'Cargando...')
        )
      : error
        ? h(
            'div',
            {
              style: {
                padding: 20,
                textAlign: 'center',
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                borderRadius: 'var(--radius)'
              }
            },
            error
          )
        : filtered.length === 0
          ? h(
              'div',
              {
                style: {
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13
                }
              },
              'No hay usuarios en este filtro.'
            )
          : h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
              filtered.map(function (u) {
                var esAdmin = u.pin === '9999' || u.user_email === 'admin@miturno.com';
                var inicial = (u.user_email || '?')[0].toUpperCase();
                var activo =
                  u.updated_at && Date.now() - new Date(u.updated_at).getTime() < 7 * 86400000;
                return h(
                  'button',
                  {
                    key: u.user_id,
                    onClick: function () {
                      haptic();
                      setDetail(u);
                      setFeedback(null);
                    },
                    style: {
                      padding: '10px 12px',
                      background: esAdmin
                        ? 'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)'
                        : 'var(--surface)',
                      border: '1px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }
                  },
                  h(
                    'div',
                    {
                      style: {
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: esAdmin ? 'var(--accent)' : 'var(--surface2)',
                        color: esAdmin ? '#fff' : 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0,
                        border: '2px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                        position: 'relative'
                      }
                    },
                    esAdmin ? '🔓' : inicial,
                    activo
                      ? h('div', {
                          style: {
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: 'var(--success,#10b981)',
                            border: '2px solid var(--surface)'
                          }
                        })
                      : null
                  ),
                  h(
                    'div',
                    { style: { minWidth: 0, flex: 1 } },
                    h(
                      'div',
                      {
                        style: {
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      },
                      u.user_email || 'sin correo'
                    ),
                    h(
                      'div',
                      {
                        style: {
                          fontSize: 10.5,
                          color: 'var(--muted)',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }
                      },
                      h('span', null, fmtFecha(u.updated_at)),
                      esAdmin
                        ? h(
                            'span',
                            {
                              style: {
                                fontSize: 8,
                                fontWeight: 800,
                                background: 'var(--accent)',
                                color: '#fff',
                                padding: '1px 5px',
                                borderRadius: 3
                              }
                            },
                            'ADMIN'
                          )
                        : null,
                      !u.pin
                        ? h(
                            'span',
                            {
                              style: {
                                fontSize: 8,
                                fontWeight: 800,
                                background: 'var(--danger)',
                                color: '#fff',
                                padding: '1px 5px',
                                borderRadius: 3
                              }
                            },
                            'SIN PIN'
                          )
                        : null
                    )
                  ),
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 } },
                    h(
                      'div',
                      {
                        style: {
                          fontSize: 14,
                          fontWeight: 900,
                          color: esAdmin ? 'var(--accent)' : 'var(--text)',
                          fontFamily: 'ui-monospace,monospace',
                          letterSpacing: '1px'
                        }
                      },
                      u.pin || '----'
                    ),
                    h('span', { style: { color: 'var(--muted)', fontSize: 18 } }, '›')
                  )
                );
              })
            ),

    h(
      'div',
      {
        style: {
          marginTop: 14,
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          color: 'var(--muted)',
          lineHeight: 1.5
        }
      },
      h('strong', null, '💡 '),
      'Toca un usuario para ver detalles.'
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        },
        style: { marginTop: 12 }
      },
      'Cerrar'
    )
  );
}


// ── js/modals/export-report.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/export-report.js
//  Modal exportar PDF/Excel + email
// ════════════════════════════════════════════════════════════════
function ExportReportModal(props) {
  // props: {format ('pdf'|'xlsx'), turnos, calc, salario, session, onClose, onDownload}
  var format = props.format;
  var formatLabel = format === 'pdf' ? 'PDF' : 'Excel';
  var formatIcon = format === 'pdf' ? '📄' : '📊';

  var st = useState('menu');
  var step = st[0],
    setStep = st[1]; // menu | email | sending | done | error
  var em = useState((props.session && props.session.email) || '');
  var email = em[0],
    setEmail = em[1];
  var er = useState(null);
  var error = er[0],
    setError = er[1];
  var ok = useState(null);
  var success = ok[0],
    setSuccess = ok[1];

  function handleDownload() {
    haptic();
    try {
      if (format === 'pdf') exportPDF(props.turnos, props.calc, props.salario);
      else exportExcel(props.turnos, props.calc, props.salario);
      setStep('done');
      setSuccess('✓ ' + formatLabel + ' descargado en tu dispositivo');
      setTimeout(function () {
        if (props.onClose) props.onClose();
      }, 1500);
    } catch (e) {
      setStep('error');
      setError('No se pudo generar el archivo: ' + (e.message || 'error desconocido'));
    }
  }

  function handleEmail() {
    haptic();
    setError(null);

    // Validar email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    if (!CLOUD_MODE) {
      setError('Necesitas conexión a la nube para enviar correos');
      return;
    }

    setStep('sending');

    // Generar el archivo en base64
    var fileBase64;
    try {
      if (format === 'pdf') fileBase64 = exportPDFBase64(props.turnos, props.calc, props.salario);
      else fileBase64 = exportExcelBase64(props.turnos, props.calc, props.salario);
    } catch (e) {
      setStep('error');
      setError('Error generando el archivo: ' + (e.message || 'desconocido'));
      return;
    }

    // Nombre del archivo
    var fecha = new Date().toISOString().slice(0, 10);
    var filename = 'mi-turno-reporte-' + fecha + '.' + (format === 'pdf' ? 'pdf' : 'xlsx');

    // Llamar a la edge function
    enviarReportePorEmail({
      to: email.trim(),
      format: format,
      filename: filename,
      fileBase64: fileBase64
    })
      .then(function () {
        setStep('done');
        setSuccess(
          'Solicitud recibida. El equipo de Mi Turno te reenviará el reporte a ' +
            email.trim() +
            ' en breve.'
        );
        setTimeout(function () {
          if (props.onClose) props.onClose();
        }, 3000);
      })
      .catch(function (e) {
        setStep('error');
        setError(e.message || 'Error al enviar el correo');
      });
  }

  // ── Vista: paso terminado ──
  if (step === 'done') {
    return h(
      'div',
      { className: 'modal-card', style: { maxWidth: 380, textAlign: 'center' } },
      h('div', { style: { fontSize: 48, marginBottom: 14 } }, '✅'),
      h(
        'div',
        { style: { fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8 } },
        'Solicitud enviada'
      ),
      h(
        'div',
        { style: { fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 18 } },
        success
      ),
      h(
        'button',
        {
          className: 'btn btn-ghost btn-block',
          onClick: function () {
            haptic();
            props.onClose();
          }
        },
        'Cerrar'
      )
    );
  }

  // ── Vista: enviando ──
  if (step === 'sending') {
    return h(
      'div',
      { className: 'modal-card', style: { maxWidth: 380, textAlign: 'center' } },
      h('div', { style: { fontSize: 36, marginBottom: 14 } }, '📤'),
      h(
        'div',
        { style: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 } },
        'Procesando solicitud...'
      ),
      h(
        'div',
        { style: { fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 } },
        'Un momento...'
      ),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'center' } },
        h('span', { className: 'sp-in', style: { fontSize: 24 } })
      )
    );
  }

  // ── Vista: error ──
  if (step === 'error') {
    return h(
      'div',
      { className: 'modal-card', style: { maxWidth: 400 } },
      h(
        'div',
        { style: { textAlign: 'center', marginBottom: 14 } },
        h('div', { style: { fontSize: 40, marginBottom: 8 } }, '⚠'),
        h(
          'div',
          { style: { fontSize: 16, fontWeight: 800, color: 'var(--danger)' } },
          'No se pudo enviar'
        )
      ),
      h(
        'div',
        {
          style: {
            padding: 12,
            background: 'var(--danger-dim)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            color: 'var(--danger)',
            marginBottom: 14,
            lineHeight: 1.5
          }
        },
        error
      ),
      h(
        'div',
        { style: { display: 'flex', gap: 8 } },
        h(
          'button',
          {
            className: 'btn btn-ghost',
            style: { flex: 1 },
            onClick: function () {
              haptic();
              setStep('menu');
              setError(null);
            }
          },
          '← Volver'
        ),
        h(
          'button',
          {
            className: 'btn btn-ghost',
            style: { flex: 1 },
            onClick: function () {
              haptic();
              props.onClose();
            }
          },
          'Cerrar'
        )
      )
    );
  }

  // ── Vista: ingresar email ──
  if (step === 'email') {
    return h(
      'div',
      { className: 'modal-card', style: { maxWidth: 420 } },
      h(
        'div',
        { style: { textAlign: 'center', marginBottom: 14 } },
        h('div', { style: { fontSize: 32, marginBottom: 6 } }, '✉'),
        h(
          'div',
          { style: { fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4 } },
          'Enviar por correo'
        ),
        h(
          'div',
          { style: { fontSize: 12, color: 'var(--muted)' } },
          formatIcon + ' Reporte en ' + formatLabel
        )
      ),

      h(
        'div',
        { style: { marginBottom: 14 } },
        h(
          'label',
          {
            style: {
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 6
            }
          },
          '¿A qué correo querés recibirlo?'
        ),
        h('input', {
          type: 'email',
          inputMode: 'email',
          autoComplete: 'email',
          className: 'inp',
          placeholder: 'tu@correo.com',
          value: email,
          onChange: function (e) {
            setEmail(e.target.value);
          },
          onKeyDown: function (e) {
            if (e.key === 'Enter') handleEmail();
          },
          autoFocus: true
        })
      ),

      error
        ? h(
            'div',
            {
              style: {
                padding: '9px 12px',
                background: 'var(--danger-dim)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12.5,
                color: 'var(--danger)',
                marginBottom: 12
              }
            },
            error
          )
        : null,

      h(
        'div',
        {
          style: {
            fontSize: 12,
            color: 'var(--muted)',
            background: 'var(--surface2)',
            padding: '11px 13px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 14,
            lineHeight: 1.6
          }
        },
        'Tu solicitud llegará al equipo de Mi Turno, que te reenviará el reporte a este correo. Normalmente tarda unos minutos.'
      ),

      h(
        'div',
        { style: { display: 'flex', gap: 8 } },
        h(
          'button',
          {
            className: 'btn btn-ghost',
            style: { flex: 1 },
            onClick: function () {
              haptic();
              setStep('menu');
              setError(null);
            }
          },
          '← Atrás'
        ),
        h(
          'button',
          {
            className: 'btn btn-accent',
            style: { flex: 2 },
            onClick: handleEmail,
            disabled: !email.trim()
          },
          'Solicitar envío'
        )
      )
    );
  }

  // ── Vista: menú principal ──
  return h(
    'div',
    { className: 'modal-card', style: { maxWidth: 380 } },
    h(
      'div',
      { style: { textAlign: 'center', marginBottom: 18 } },
      h('div', { style: { fontSize: 36, marginBottom: 6 } }, formatIcon),
      h(
        'div',
        { style: { fontSize: 18, fontWeight: 800, color: 'var(--text)' } },
        'Exportar ' + formatLabel
      ),
      h(
        'div',
        { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4 } },
        '¿Cómo quieres recibirlo?'
      )
    ),

    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 } },
      h(
        'button',
        {
          onClick: handleDownload,
          style: {
            padding: '14px 16px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left'
          }
        },
        h('div', { style: { fontSize: 24 } }, '📥'),
        h(
          'div',
          { style: { flex: 1 } },
          h(
            'div',
            { style: { fontSize: 14, fontWeight: 700, color: 'var(--text)' } },
            'Descargar ahora'
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
            'Guarda el archivo en tu dispositivo'
          )
        ),
        h('span', { style: { color: 'var(--muted)', fontSize: 18 } }, '›')
      ),

      h(
        'button',
        {
          onClick: function () {
            haptic();
            setStep('email');
            setError(null);
          },
          disabled: !CLOUD_MODE,
          style: {
            padding: '14px 16px',
            background: CLOUD_MODE ? 'var(--accent-dim)' : 'var(--surface2)',
            border: '1px solid ' + (CLOUD_MODE ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 'var(--radius)',
            cursor: CLOUD_MODE ? 'pointer' : 'not-allowed',
            opacity: CLOUD_MODE ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left'
          }
        },
        h('div', { style: { fontSize: 24 } }, '✉'),
        h(
          'div',
          { style: { flex: 1 } },
          h(
            'div',
            {
              style: {
                fontSize: 14,
                fontWeight: 700,
                color: CLOUD_MODE ? 'var(--accent)' : 'var(--muted)'
              }
            },
            'Enviar por correo'
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
            CLOUD_MODE ? 'Te llega a tu email · Gratis' : 'Requiere conexión a la nube'
          )
        ),
        h(
          'span',
          { style: { color: CLOUD_MODE ? 'var(--accent)' : 'var(--muted)', fontSize: 18 } },
          '›'
        )
      )
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        }
      },
      'Cancelar'
    )
  );
}


// ── js/app/auth-screen.js ──
/* ════════════════════════════════════════════════════════════════
   MI TURNO · app/auth-screen.js
   Pantalla login/registro con WaveDots
   ════════════════════════════════════════════════════════════════ */

function AnimatedWaveDots(props) {
  var tk = useState(0);
  var tick = tk[0],
    setTick = tk[1];
  useEffect(function () {
    var raf;
    var t0 = Date.now();
    function loop() {
      setTick(((Date.now() - t0) / 1000) % 1000);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return function () {
      cancelAnimationFrame(raf);
    };
  }, []);

  var arr = [];
  var n = props.n || 4;
  var amp = 4;
  var speed = 2.4;
  var phase = 0.55;
  for (var i = 0; i < n; i++) {
    var t = tick;
    var y = Math.sin(t * speed - i * phase) * amp;
    var glow = (Math.sin(t * speed - i * phase) + 1) / 2;
    var r = Math.round(125 - glow * 34);
    var g = Math.round(168 - glow * 34);
    var b = Math.round(255 - glow * 26);
    var size = 8 + glow * 2;
    var opacity = 0.45 + glow * 0.55;
    arr.push(
      h('span', {
        key: i,
        style: {
          display: 'inline-block',
          width: size + 'px',
          height: size + 'px',
          borderRadius: '50%',
          background: 'rgb(' + r + ',' + g + ',' + b + ')',
          margin: '0 4px',
          transform: 'translateY(' + y + 'px)',
          opacity: opacity,
          transition: 'background 0.1s linear',
          boxShadow: glow > 0.7 ? '0 0 8px rgba(91,134,229,0.55)' : 'none'
        }
      })
    );
  }
  return h(
    'div',
    {
      'aria-hidden': 'true',
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1
      }
    },
    arr
  );
}

function AuthScreen(props) {
  var md = useState('login');
  var modo = md[0],
    setModo = md[1];
  var em = useState('');
  var email = em[0],
    setEmail = em[1];
  var pw = useState('');
  var pass = pw[0],
    setPass = pw[1];
  var ld = useState(false);
  var load = ld[0],
    setLoad = ld[1];
  var er = useState(null);
  var err = er[0],
    setErr = er[1];
  var cm = useState(CLOUD_MODE);
  var cloudOk = cm[0],
    setCloudOk = cm[1];
  var ce = useState(CLOUD_ERROR);
  var cloudErr = ce[0],
    setCloudErr = ce[1];
  var pa = useState('');
  var pinAsignado = pa[0],
    setPinAsignado = pa[1];
  var st = useState('');
  var statusMsg = st[0],
    setStatusMsg = st[1];
  // Aviso dejado por root.js cuando la sesión se cerró desde otro dispositivo.
  var av = useState(function () {
    return leer('mt_aviso', null);
  });
  var aviso = av[0];

  useEffect(function () {
    if (aviso) borrarKey('mt_aviso');
  }, []);

  useEffect(function () {
    var alive = true;
    var delay = IS_IOS_SAFARI ? 2000 : 0;
    setTimeout(function () {
      if (!alive) return;
      if (window.__cloudReady) {
        window.__cloudReady.then(function (ok) {
          if (!alive) return;
          setCloudOk(!!ok);
          setCloudErr(CLOUD_ERROR);
        });
      }
    }, delay);
    return function () {
      alive = false;
    };
  }, []);

  function submit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (load) return;
    var rawIn = email.trim();
    if (!rawIn || !pass) {
      setErr('Completa todos los campos.');
      return;
    }
    if (pass.length < 6) {
      setErr('La contraseña necesita al menos 6 caracteres.');
      return;
    }

    if (modo === 'register') {
      var eReg = rawIn.toLowerCase();
      if (!eReg.includes('@')) {
        setErr('Ingresa un correo válido.');
        return;
      }
      setLoad(true);
      setErr(null);
      setStatusMsg('');

      if (CLOUD_MODE && SUPA) {
        setStatusMsg('☁ Creando tu cuenta...');
        var opReg = SUPA.auth.signUp({ email: eReg, password: pass });
        withTimeout(opReg, IS_IOS_SAFARI ? 15000 : 8000, 'Auth')
          .then(function (res) {
            if (res && res.error) throw res.error;

            // ── Detección de email YA REGISTRADO ──
            // Con "Confirm email" activado, Supabase NO devuelve error al
            // hacer signUp de un email existente (anti-enumeración). En su
            // lugar devuelve un user con `identities: []` (array vacío).
            // Si no detectamos esto, asignaríamos un PIN nuevo y pisaríamos
            // el del dueño real en pin_lookup (onConflict user_id). CRÍTICO.
            var u = res && res.data && res.data.user;
            if (u && Array.isArray(u.identities) && u.identities.length === 0) {
              setLoad(false);
              setStatusMsg('');
              setErr('Ese correo ya tiene una cuenta. Iniciá sesión o usá "¿Olvidaste tu PIN?".');
              setModo('login');
              return;
            }

            function asignarPINConFeedback(uid, email, callback) {
              setStatusMsg('🔐 Asignando tu PIN único...');
              var resuelto = false;
              var maxWait = setTimeout(function () {
                if (resuelto) return;
                resuelto = true;
                console.warn('[MT] Timeout asignando PIN, continuando...');
                setStatusMsg('');
                callback(null);
              }, 12000);

              generarPINUnico(uid)
                .then(function (pin) {
                  if (resuelto) return;
                  setStatusMsg('☁ Guardando en la nube...');
                  return guardarPINEnNube(uid, email, pin).then(function () {
                    if (resuelto) return;
                    resuelto = true;
                    clearTimeout(maxWait);
                    grabar('mt_pin_' + uid, pin);
                    setStatusMsg('✓ ¡Listo!');
                    setTimeout(function () {
                      callback(pin);
                    }, 350);
                  });
                })
                .catch(function (e) {
                  if (resuelto) return;
                  resuelto = true;
                  clearTimeout(maxWait);
                  console.warn('[MT] PIN auto falló:', e);
                  setStatusMsg('');
                  callback(null);
                });
            }

            if (res && res.data && res.data.user && !res.data.session) {
              var newUid = res.data.user.id;
              asignarPINConFeedback(newUid, eReg, function (pin) {
                if (pin) setPinAsignado(pin);
                setLoad(false);
                setErr(null);
                setStatusMsg('');
                setModo('confirm_email');
              });
              return;
            }
            if (res && res.data && res.data.user && res.data.session) {
              var newUid2 = res.data.user.id;
              asignarPINConFeedback(newUid2, eReg, function (pin) {
                if (pin) {
                  setPinAsignado(pin);
                  setLoad(false);
                  setStatusMsg('');
                  setModo('pin_asignado');
                } else {
                  setLoad(false);
                  setErr(null);
                  setStatusMsg('');
                  setModo('login');
                }
              });
              return;
            }
            setLoad(false);
            setStatusMsg('');
          })
          .catch(function (e) {
            var msg = traducirError(e);
            setErr(msg);
            setLoad(false);
            setStatusMsg('');
          });
        return;
      }
      setErr('Requiere conexión a internet.');
      setLoad(false);
    }

    // ── LOGIN OFFLINE: verificar credenciales guardadas localmente ──
    // Acepta el blob nuevo (JSON {v,s,h} con PBKDF2) y el legacy (plain
    // string). Si fue legacy y matcheó, re-guarda como hash.
    function tryOfflineLogin(identifier, password) {
      var key = 'mt_pass_' + btoa(identifier);
      var savedPass = leer(key, null);
      if (!savedPass) return Promise.resolve(false);
      return verifyPassword(password, savedPass)
        .then(function (res) {
          if (!res.ok) return false;
          // Migración silenciosa: si validamos por la rama legacy,
          // re-hasheamos y reemplazamos antes de proceder.
          if (res.legacy) {
            hashPassword(password)
              .then(function (blob) {
                grabar(key, blob);
              })
              .catch(function () {
                /* dejamos el legacy si Web Crypto falla */
              });
          }
          var savedSession = leer('mt_offline_' + btoa(identifier), null);
          if (!savedSession || !savedSession.uid) return false;
          if (props.onAuth)
            props.onAuth({
              uid: savedSession.uid,
              email: savedSession.email || identifier,
              cloud: false,
              guest: false,
              isAdmin: savedSession.isAdmin || false,
              pin: savedSession.pin || null
            });
          setLoad(false);
          return true;
        })
        .catch(function () {
          return false;
        });
    }

    // ── LOGIN OFFLINE POR PIN ──
    // Fallback cuando se ingresa un PIN de 4 dígitos y la nube no responde.
    // Recorre las claves mt_pin_<uid> guardadas en este device; si alguna
    // coincide con el PIN, restaura la sesión offline cacheada de ese uid.
    // (El login por PIN online requiere también la password; offline el
    // PIN solo es suficiente porque es un device ya conocido por el user.)
    function tryOfflinePinLogin(pin) {
      try {
        var keys = Object.keys(safeStorage);
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf('mt_pin_') !== 0) continue;
          var stored = leer(keys[i], null);
          if (String(stored) !== String(pin)) continue;
          var uid = keys[i].slice('mt_pin_'.length);
          // Buscamos la sesión cacheada. Está indexada por btoa(email),
          // así que usamos mt_last_user (que mapea uid→email) o SKEY.
          var lastUser = leer('mt_last_user', null);
          var ses = null;
          if (lastUser && lastUser.uid === uid && lastUser.email) {
            ses = leer('mt_offline_' + btoa(lastUser.email), null);
          }
          if (!ses) {
            var skSes = leer(SKEY, null);
            if (skSes && skSes.uid === uid) ses = skSes;
          }
          if (ses && ses.uid) {
            if (props.onAuth)
              props.onAuth({
                uid: ses.uid,
                email: ses.email || (lastUser && lastUser.email) || 'offline@local',
                cloud: false,
                guest: false,
                isAdmin: ses.isAdmin || pin === '9999',
                pin: pin
              });
            setLoad(false);
            return true;
          }
        }
      } catch (_) {}
      return false;
    }

    // ── Cachear credenciales para uso offline futuro + FastPin ──
    // Se llama tras CUALQUIER login cloud exitoso (por email O por PIN),
    // así el device queda habilitado para entrar sin red la próxima vez.
    // Antes solo el login por email cacheaba → quien entraba siempre por
    // PIN nunca habilitaba offline ni FastPin.
    function cachearOffline(uid, emailReal, password, isAdmin, pinVal) {
      var emailLc = String(emailReal || '').toLowerCase();
      if (!uid || !emailLc) return;
      // Password hasheada (PBKDF2), fire-and-forget.
      (function (key, plain) {
        if (typeof hashPassword === 'function') {
          hashPassword(plain)
            .then(function (blob) {
              grabar(key, blob);
            })
            .catch(function () {
              grabar(key, plain);
            });
        } else {
          grabar(key, plain);
        }
      })('mt_pass_' + btoa(emailLc), password);
      grabar('mt_offline_' + btoa(emailLc), {
        uid: uid,
        email: emailLc,
        cloud: true,
        guest: false,
        isAdmin: !!isAdmin,
        pin: null
      });
      // Marca device conocido → habilita FastPinScreen al próximo arranque.
      try {
        grabar('mt_last_user', { uid: uid, email: emailLc });
      } catch (_) {}
      // Si vino un PIN, lo cacheamos también (login por PIN ya lo tiene,
      // pero el login por email no — así FastPin funciona en ambos casos).
      if (pinVal && /^\d{4}$/.test(String(pinVal))) {
        grabar('mt_pin_' + uid, String(pinVal));
      }
    }

    // ── LOGIN ──
    setLoad(true);
    setErr(null);
    setStatusMsg('');
    var e2 = rawIn.toLowerCase();

    if (CLOUD_MODE && SUPA) {
      if (/^\d{4}$/.test(rawIn)) {
        withTimeout(
          SUPA.from('pin_lookup').select('user_email,user_id').eq('pin', rawIn).maybeSingle(),
          IS_IOS_SAFARI ? 15000 : 8000,
          'PIN lookup'
        )
          .then(function (res) {
            if (res && res.error) throw res.error;
            if (!res.data || !res.data.user_email) {
              throw new Error('PIN no registrado. Entra con correo+contraseña primero.');
            }
            return withTimeout(
              SUPA.auth.signInWithPassword({ email: res.data.user_email, password: pass }),
              IS_IOS_SAFARI ? 15000 : 8000,
              'Inicio de sesión'
            );
          })
          .then(function (res) {
            if (res && res.error) throw res.error;
            if (rawIn === '9999') {
              var adminSes = leer(SKEY, {});
              adminSes.isAdmin = true;
              grabar(SKEY, adminSes);
            }
            // Cachear para offline + FastPin (incluye el PIN ingresado).
            cachearOffline(res.data.user.id, res.data.user.email, pass, rawIn === '9999', rawIn);
            if (props.onAuth)
              props.onAuth({
                uid: res.data.user.id,
                email: res.data.user.email,
                cloud: true,
                isAdmin: rawIn === '9999'
              });
            setLoad(false);
          })
          .catch(function (e) {
            // Fallback offline por PIN: el PIN solo, contra mt_pin_<uid>
            // local. (Antes llamaba tryOfflineLogin(rawIn) con rawIn=PIN,
            // que buscaba mt_pass_<btoa(PIN)> y nunca matcheaba.)
            if (tryOfflinePinLogin(rawIn)) return;
            setErr(traducirError(e) || 'PIN o contraseña incorrectos.');
            setLoad(false);
          });
        return;
      }
      if (rawIn.includes('@')) {
        withTimeout(
          SUPA.auth.signInWithPassword({ email: e2, password: pass }),
          IS_IOS_SAFARI ? 15000 : 8000,
          'Auth'
        )
          .then(function (res) {
            if (res && res.error) throw res.error;
            if (e2 === 'admin@miturno.com') {
              var adminSes = leer(SKEY, {});
              adminSes.isAdmin = true;
              grabar(SKEY, adminSes);
            }
            // Cachear credenciales para offline + FastPin (mismo helper
            // que el login por PIN). No pasamos pinVal acá: el PIN se
            // resuelve en root.js aplicar() vía pin_lookup.
            if (res.data && res.data.user) {
              cachearOffline(res.data.user.id, e2, pass, e2 === 'admin@miturno.com', null);
            }
            if (props.onAuth) props.onAuth({ uid: res.data.user.id, email: e2, cloud: true });
            setLoad(false);
          })
          .catch(function (e) {
            // Fallback offline: intentar con credenciales locales (async)
            tryOfflineLogin(e2, pass).then(function (ok) {
              if (ok) return;
              setErr(traducirError(e));
              setLoad(false);
            });
          });
        return;
      }
      setErr('Ingresa tu correo completo o PIN de 4 dígitos.');
      setLoad(false);
      return;
    }

    // ── MODO OFFLINE: intentar login local ──
    if (!CLOUD_MODE || !SUPA) {
      if (/^\d{4}$/.test(rawIn)) {
        // Mismo helper robusto que el fallback online: mira mt_pin_<uid>
        // + mt_last_user/mt_offline, no solo SKEY (que se limpia en logout).
        if (tryOfflinePinLogin(rawIn)) return;
      }
      // Último recurso encapsulado para poder llamarlo desde el
      // .then() async de tryOfflineLogin.
      function tryLastResort() {
        var anySession = leer(SKEY, null);
        if (anySession && anySession.uid) {
          if (props.onAuth) props.onAuth(anySession);
          setLoad(false);
          return;
        }
        setErr('Sin conexión y sin credenciales guardadas. Usa "Continuar como invitado".');
        setLoad(false);
      }
      if (rawIn.includes('@')) {
        tryOfflineLogin(e2, pass).then(function (ok) {
          if (ok) return; // ya hizo setLoad(false) y onAuth
          tryLastResort();
        });
        return;
      }
      tryLastResort();
      return;
    }

    setErr('Requiere conexión a internet.');
    setLoad(false);
  }

  // ── Pantalla: PIN asignado automáticamente ──
  if (modo === 'pin_asignado') {
    return h(
      'div',
      { className: 'auth-wrap' },
      h(
        'div',
        { className: 'auth-hero' },
        h('div', { className: 'auth-logo-box' }, '🎉'),
        h('div', { className: 'auth-app-name' }, '¡Cuenta creada!'),
        h('div', { className: 'auth-tagline' }, 'Tu acceso rápido ha sido asignado')
      ),
      h(
        'div',
        { className: 'auth-card' },
        h(
          'div',
          { style: { textAlign: 'center', padding: '8px 0 20px' } },
          h(
            'div',
            {
              style: {
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 14
              }
            },
            'Tu PIN empresarial es'
          ),
          h(
            'div',
            {
              style: {
                fontSize: 58,
                fontWeight: 900,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '10px',
                lineHeight: 1,
                marginBottom: 18,
                fontFamily: 'ui-monospace,monospace'
              }
            },
            pinAsignado
          ),
          h(
            'div',
            { style: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 8 } },
            'Con este PIN + tu contraseña puedes entrar rápidamente. Guárdalo o cámbialo en ',
            h('strong', null, 'Ajustes → Gestionar cuenta'),
            '.'
          )
        ),
        h(
          'button',
          {
            className: 'auth-btn',
            onClick: function () {
              haptic();
              setModo('login');
              setPinAsignado('');
            }
          },
          '✓ Entendido, continuar'
        )
      )
    );
  }

  // ── Pantalla de confirmación de email ──
  if (modo === 'confirm_email') {
    return h(
      'div',
      { className: 'auth-wrap' },
      h(
        'div',
        { className: 'auth-hero' },
        h('div', { className: 'auth-logo-box' }, '✉'),
        h('div', { className: 'auth-app-name' }, 'Revisa tu correo'),
        h(
          'div',
          { className: 'auth-tagline' },
          pinAsignado
            ? 'Tu PIN: ' + pinAsignado + ' (úsalo tras confirmar)'
            : 'Te enviamos un enlace'
        )
      ),
      h(
        'div',
        { className: 'auth-card' },
        pinAsignado
          ? h(
              'div',
              { style: { textAlign: 'center', marginBottom: 18 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 10
                  }
                },
                'Tu PIN asignado'
              ),
              h(
                'div',
                {
                  style: {
                    fontSize: 46,
                    fontWeight: 900,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '8px',
                    fontFamily: 'ui-monospace,monospace',
                    marginBottom: 8
                  }
                },
                pinAsignado
              ),
              h(
                'div',
                { style: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 } },
                'Guárdalo. Podrás usarlo tras confirmar tu correo.'
              )
            )
          : null,
        h(
          'div',
          { style: { fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, marginBottom: 18 } },
          'Confirma tu cuenta en la bandeja de ',
          h('strong', null, email),
          '. Haz clic en el enlace y luego vuelve a iniciar sesión.'
        ),
        h(
          'button',
          {
            className: 'auth-btn',
            onClick: function () {
              setModo('login');
              setEmail('');
              setPass('');
              setErr(null);
            }
          },
          'Ya confirmé → Iniciar sesión'
        ),
        h(
          'button',
          {
            className: 'auth-link',
            onClick: function () {
              setModo('login');
            }
          },
          '← Volver'
        )
      )
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  PANTALLA PRINCIPAL DE LOGIN / REGISTRO (con icono personalizado)
  // ════════════════════════════════════════════════════════════════
  return h(
    'main',
    { className: 'auth-wrap', 'aria-label': modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta' },
    h(
      'div',
      { className: 'auth-hero' },
      h(
        'div',
        { className: 'auth-logo-box' },
        h('img', {
          src: 'img/logo-mark.svg',
          alt: 'Mi Turno',
          draggable: false,
          style: { width: '48px', height: '48px', display: 'block' }
        })
      ),
      h(
        'div',
        { className: 'auth-hero-txt' },
        h('div', { className: 'auth-app-name' }, 'Mi Turno'),
        h(
          'div',
          { className: 'auth-tagline' },
          modo === 'login' ? 'Colombia' : 'Colombia · Nómina inteligente'
        )
      )
    ),
    h(
      'div',
      { className: 'auth-card' },
      h('div', { className: 'auth-ttl' }, modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'),

      aviso && aviso.tipo === 'remote_signout'
        ? h(
            'div',
            {
              role: 'status',
              'aria-live': 'polite',
              style: {
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 12,
                lineHeight: 1.45,
                border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)'
              }
            },
            h('div', { style: { fontWeight: 700, marginBottom: 2 } }, 'ℹ Sesión cerrada'),
            h(
              'div',
              { style: { opacity: 0.9, fontSize: 11.5 } },
              'Se cerró sesión desde otro dispositivo. Inicia sesión de nuevo para continuar.'
            )
          )
        : null,

      !cloudOk && cloudErr
        ? h(
            'div',
            {
              style: {
                background: 'var(--danger-dim)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 12,
                lineHeight: 1.45,
                border: '1px solid color-mix(in srgb, var(--danger) 22%, transparent)'
              }
            },
            h('div', { style: { fontWeight: 700, marginBottom: 2 } }, '⚠ Nube no disponible'),
            h('div', { style: { opacity: 0.9, fontSize: 11.5 } }, 'Puedes usar modo local.')
          )
        : null,

      // Campo email / PIN
      !email && modo === 'login'
        ? h(
            'div',
            {
              style: {
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 6,
                textAlign: 'center'
              }
            },
            'Ingresa correo • PIN'
          )
        : null,
      h(
        'div',
        { style: { position: 'relative', marginBottom: 10 } },
        h('input', {
          type: modo === 'login' ? 'text' : 'email',
          inputMode: modo === 'login' ? 'text' : 'email',
          autoComplete: modo === 'login' ? 'username' : 'email',
          className: 'inp',
          'aria-label':
            modo === 'login' ? 'Correo electrónico o PIN de 4 dígitos' : 'Correo electrónico',
          placeholder:
            !email && modo === 'login'
              ? ''
              : modo === 'login'
                ? 'Correo o PIN'
                : 'Correo electrónico',
          value: email,
          onChange: function (e) {
            setEmail(e.target.value);
          },
          disabled: load,
          style: { width: '100%' }
        }),
        !email && modo === 'login' ? h(AnimatedWaveDots, { n: 4 }) : null
      ),

      // Campo contraseña
      !pass
        ? h(
            'div',
            {
              style: {
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 6,
                textAlign: 'center'
              }
            },
            'Contraseña'
          )
        : null,
      h(
        'div',
        { style: { position: 'relative', marginBottom: err ? 12 : 14 } },
        h('input', {
          type: 'password',
          autoComplete: modo === 'login' ? 'current-password' : 'new-password',
          className: 'inp',
          'aria-label': 'Contraseña',
          placeholder: !pass ? '' : 'Contraseña',
          value: pass,
          onChange: function (e) {
            setPass(e.target.value);
          },
          disabled: load,
          onKeyDown: function (e) {
            if (e.key === 'Enter') submit(e);
          },
          style: { width: '100%' }
        }),
        !pass ? h(AnimatedWaveDots, { n: 6 }) : null
      ),

      err
        ? h('div', { className: 'auth-err', role: 'alert', 'aria-live': 'assertive' }, err)
        : null,

      load && statusMsg
        ? h(
            'div',
            {
              role: 'status',
              'aria-live': 'polite',
              style: {
                padding: '14px 16px',
                marginBottom: 12,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-dim)',
                border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                color: 'var(--accent)',
                fontSize: 13.5,
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '-0.1px',
                lineHeight: 1.5
              }
            },
            statusMsg
          )
        : null,

      h(
        'button',
        { className: 'auth-btn', onClick: submit, disabled: load },
        load
          ? modo === 'register' && statusMsg
            ? 'Procesando…'
            : h('span', { className: 'sp-in' })
          : modo === 'login'
            ? 'Entrar'
            : 'Registrarse'
      ),

      h(
        'button',
        {
          className: 'auth-link',
          onClick: function () {
            setModo(function (m) {
              return m === 'login' ? 'register' : 'login';
            });
            setErr(null);
            setStatusMsg('');
          },
          disabled: load
        },
        modo === 'login' ? '¿Sin cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'
      ),

      modo === 'login'
        ? h(
            React.Fragment,
            null,
            // Botón "Reanudar sesión" si hay sesión guardada
            (function () {
              var savedSession = leer(SKEY, null);
              if (savedSession && savedSession.uid && !savedSession.guest) {
                return h(
                  'button',
                  {
                    className: 'auth-guest',
                    style: {
                      width: '100%',
                      marginTop: 14,
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)'
                    },
                    onClick: function () {
                      haptic();
                      props.onAuth({
                        uid: savedSession.uid,
                        email: savedSession.email || 'offline@local',
                        guest: false,
                        cloud: savedSession.cloud || false,
                        isAdmin: !!savedSession.isAdmin,
                        pin: savedSession.pin || null
                      });
                    },
                    disabled: load
                  },
                  '🔄 Reanudar sesión anterior'
                );
              }
              return null;
            })(),
            h(
              'button',
              {
                className: 'auth-guest',
                style: { width: '100%', marginTop: 8 },
                onClick: function () {
                  haptic();
                  var gid =
                    'guest_' +
                    Date.now().toString(36) +
                    '_' +
                    Math.random().toString(36).slice(2, 8);
                  var guestSession = {
                    uid: gid,
                    email: 'invitado@local',
                    guest: true,
                    cloud: false,
                    pinOnly: false
                  };
                  // Guardar sesión invitada en localStorage
                  grabar(SKEY, guestSession);
                  props.onAuth(guestSession);
                },
                disabled: load
              },
              '👤 Continuar como invitado (sin cuenta)'
            )
          )
        : null
    ),
    h(
      'div',
      { className: 'auth-foot' },
      cloudOk ? '☁ Datos sincronizados en la nube' : '🔒 Datos en este dispositivo'
    )
  );
}


// ── js/app/fast-pin-screen.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/fast-pin-screen.js
//  Login simplificado — solo PIN — para devices "conocidos".
//  Se muestra cuando hay session=null pero el localStorage retiene
//  credenciales offline de un usuario previo:
//    · mt_last_user = { uid, email }
//    · mt_pin_<uid> = '1234'
//    · mt_offline_<base64(email)> = sesión cacheada
//  El usuario solo escribe los 4 dígitos. Si matchean, restauramos
//  la sesión offline. La flecha ← desactiva este modo para esta
//  pestaña y vuelve al AuthScreen completo. "Olvidé mi PIN" abre
//  el modal de recuperación que valida email + password.
// ════════════════════════════════════════════════════════════════

function FastPinScreen(props) {
  var lastUser = props.lastUser || {};
  var pinS = useState('');
  var pin = pinS[0],
    setPin = pinS[1];
  var errS = useState(null);
  var err = errS[0],
    setErr = errS[1];
  var shakeS = useState(false);
  var shake = shakeS[0],
    setShake = shakeS[1];
  var busyS = useState(false);
  var busy = busyS[0],
    setBusy = busyS[1];

  // Saludo personalizado: alias guardado en v30, fallback al email
  var saludoNombre = '';
  try {
    var dkFn =
      typeof dk === 'function'
        ? dk
        : function (u, k) {
            return 'mt_' + k + '_' + u;
          };
    var nm = leer(dkFn(lastUser.uid, 'pname'), '');
    if (nm) saludoNombre = String(nm).trim();
    else if (lastUser.email) {
      var primero = String(lastUser.email).split('@')[0].split('.')[0];
      if (primero && primero.length <= 16) {
        saludoNombre = primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
      }
    }
  } catch (_) {}

  var titulo = saludoNombre ? 'Hola, ' + saludoNombre : 'Escribí tu PIN';
  var sub = saludoNombre
    ? 'Para continuar, ingresá tu PIN.'
    : 'Ingresá tu PIN de 4 dígitos para entrar.';

  function tryUnlock(p) {
    var stored = leer('mt_pin_' + lastUser.uid, null);
    if (!stored) {
      setErr('No hay PIN guardado en este dispositivo. Usá el login completo.');
      setShake(true);
      setTimeout(function () {
        setShake(false);
      }, 350);
      return;
    }
    if (p === stored) {
      // Restaurar sesión offline cacheada
      var ses = null;
      try {
        ses = leer('mt_offline_' + btoa(lastUser.email), null);
      } catch (_) {}
      if (!ses) {
        // Fallback: arma una sesión mínima
        ses = {
          uid: lastUser.uid,
          email: lastUser.email,
          cloud: true,
          guest: false,
          isAdmin: lastUser.email === 'admin@miturno.com'
        };
      }
      ses.pin = p;
      try {
        haptic && haptic();
      } catch (_) {}

      // Restaurar la sesión REAL de Supabase con los tokens cacheados. Esto
      // autentica el cliente → el device sube, baja y recibe realtime (antes
      // entraba "cloud" pero deslogueado → no sincronizaba, LED ámbar pegado).
      // Si no hay tokens / red, o el refresh token está revocado/expirado,
      // entramos en modo local (sin pérdida: cargarDatos usa lo local).
      if (isOnline() && CLOUD_MODE && SUPA && ses.access_token && ses.refresh_token) {
        setBusy(true);
        withTimeout(
          SUPA.auth.setSession({
            access_token: ses.access_token,
            refresh_token: ses.refresh_token
          }),
          9000,
          'Restaurar sesión'
        )
          .then(function (res) {
            setBusy(false);
            if (res && res.error) {
              // Token muerto: lo limpiamos para no reintentar en vano.
              try {
                var k = 'mt_offline_' + btoa(lastUser.email);
                var b = leer(k, null);
                if (b) {
                  delete b.access_token;
                  delete b.refresh_token;
                  grabar(k, b);
                }
              } catch (_) {}
            }
            // Con éxito, onAuthStateChange en root.js refina la sesión y
            // dispara la convergencia; igual entramos ya para UI instantánea.
            if (props.onAuth) props.onAuth(ses);
          })
          .catch(function () {
            setBusy(false);
            if (props.onAuth) props.onAuth(ses);
          });
        return;
      }

      if (props.onAuth) props.onAuth(ses);
    } else {
      setErr('PIN incorrecto. Probá de nuevo.');
      setShake(true);
      try {
        haptic && haptic();
      } catch (_) {}
      setTimeout(function () {
        setShake(false);
        setPin('');
      }, 380);
    }
  }

  function press(d) {
    if (busy) return;
    if (pin.length >= 4) return;
    try {
      haptic && haptic();
    } catch (_) {}
    setErr(null);
    var next = pin + d;
    setPin(next);
    if (next.length === 4) {
      // Pequeño delay para que el usuario vea la 4ta celda llenarse
      setTimeout(function () {
        tryUnlock(next);
      }, 110);
    }
  }
  function backspace() {
    if (!pin.length) return;
    try {
      haptic && haptic();
    } catch (_) {}
    setErr(null);
    setPin(pin.slice(0, -1));
  }

  return h(
    'main',
    { className: 'fastpin-wrap', 'aria-label': 'Entrar con PIN' },

    // Flecha ← arriba a la izquierda: vuelve al login completo
    h(
      'button',
      {
        className: 'fastpin-back',
        onClick: function () {
          try {
            haptic && haptic();
          } catch (_) {}
          if (props.onExitFastMode) props.onExitFastMode();
        },
        'aria-label': 'Volver al inicio de sesión completo'
      },
      h('span', { 'aria-hidden': 'true' }, '←')
    ),

    // Logo en esquina inferior derecha (sutil, "nuestra marca")
    h(
      'div',
      { className: 'fastpin-logo', 'aria-hidden': 'true' },
      h('img', { src: 'img/logo-mark.svg', alt: '', draggable: false })
    ),

    // ─── Encabezado ───
    h(
      'div',
      { className: 'fastpin-hdr' },
      h('h1', { className: 'fastpin-ttl' }, titulo),
      h('div', { className: 'fastpin-sub' }, sub)
    ),

    // ─── 4 celdas centradas ───
    h(
      'div',
      {
        className: 'fastpin-cells' + (shake ? ' shake' : ''),
        role: 'status',
        'aria-live': 'polite',
        'aria-label': pin.length + ' de 4 dígitos ingresados'
      },
      [0, 1, 2, 3].map(function (i) {
        var filled = pin.length > i;
        var active = pin.length === i && !err;
        return h(
          'div',
          {
            key: i,
            'aria-hidden': 'true',
            className: 'fastpin-cell' + (filled ? ' filled' : '') + (active ? ' active' : '')
          },
          filled ? h('span', { className: 'fastpin-dot' }) : null
        );
      })
    ),

    // ─── Pill informativo / error ───
    busy
      ? h(
          'div',
          { className: 'fastpin-pill', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, '⏳'),
          'Entrando y sincronizando…'
        )
      : err
        ? h(
            'div',
            { className: 'fastpin-pill err', role: 'alert', 'aria-live': 'assertive' },
            h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, '⚠'),
            err
          )
        : h(
            'div',
            { className: 'fastpin-pill' },
            h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, 'ⓘ'),
            'No compartas tu PIN con nadie.'
          ),

    // ─── Keypad numérico (3×3 + 0 + ⌫) ───
    h(
      'div',
      { className: 'fastpin-keypad', role: 'group', 'aria-label': 'Teclado numérico' },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (n) {
        return h(
          'button',
          {
            key: n,
            className: 'fastpin-key',
            onClick: function () {
              press(n);
            },
            type: 'button',
            'aria-label': 'Dígito ' + n
          },
          n
        );
      }),
      h('div', { className: 'fastpin-key fastpin-key-empty', 'aria-hidden': 'true' }),
      h(
        'button',
        {
          key: '0',
          className: 'fastpin-key',
          onClick: function () {
            press('0');
          },
          type: 'button',
          'aria-label': 'Dígito 0'
        },
        '0'
      ),
      h(
        'button',
        {
          key: 'del',
          className: 'fastpin-key fastpin-key-del',
          onClick: backspace,
          type: 'button',
          'aria-label': 'Borrar'
        },
        h('span', { 'aria-hidden': 'true' }, '⌫')
      )
    ),

    // ─── Olvidé mi PIN ───
    h(
      'button',
      {
        className: 'fastpin-forgot',
        onClick: function () {
          try {
            haptic && haptic();
          } catch (_) {}
          if (props.onForgotPin) props.onForgotPin();
        },
        type: 'button'
      },
      'Olvidé mi PIN'
    )
  );
}


// ── js/app/app-main.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/app-main.js
//  Componente principal App con tabs y lógica de sincronización
// ════════════════════════════════════════════════════════════════

function App(props) {
  var session = props.session;
  var onSessionPatch = props.onSessionPatch;
  var uid = session.uid;
  var isCloud = !session.pinOnly && !session.guest && CLOUD_MODE;
  var loadedRef = useRef(false);

  var th = useState(leer('mt_theme', 'light'));
  var theme = th[0],
    setTheme = th[1];
  useEffect(
    function () {
      var root = document.documentElement;
      root.classList.add('theme-transitioning');
      root.setAttribute('data-theme', theme);
      grabar('mt_theme', theme);
      var m = document.getElementById('metaThemeColor');
      if (m) m.setAttribute('content', theme === 'dark' ? '#0a0c12' : '#f5f7fb');
      var tid = setTimeout(function () {
        root.classList.remove('theme-transitioning');
      }, 400);
      return function () {
        clearTimeout(tid);
      };
    },
    [theme]
  );

  var s1 = useState([]);
  var turnos = s1[0],
    setTurnos = s1[1];
  var s2 = useState(null);
  var activo = s2[0],
    setActivo = s2[1];
  var s3 = useState(SMIN);
  var salario = s3[0],
    setSalario = s3[1];
  // Flag explícito: el usuario confirmó su salario en Ajustes al menos una vez
  var sc = useState(false);
  var salarioConfigured = sc[0],
    setSalarioConfigured = sc[1];
  var s4 = useState(Date.now());
  var ahora = s4[0],
    setAhora = s4[1];
  var s6 = useState('home');
  var tab = s6[0],
    setTab = s6[1];
  var s7 = useState(false);
  var showOlv = s7[0],
    setShowOlv = s7[1];
  var s9 = useState(true);
  var loading = s9[0],
    setLoading = s9[1];
  var sx = useState(false);
  var splashExit = sx[0],
    setSplashExit = sx[1];
  var s10 = useState(null);
  var toast = s10[0],
    setToast = s10[1];
  var pss = useState(false);
  var showPinSetup = pss[0],
    setShowPinSetup = pss[1];

  // Preferencias avanzadas (auxilio, prestaciones, quincena manual)
  var pf = useState(normalizePrefs(null));
  var prefs = pf[0],
    setPrefs = pf[1];

  // Detección de estado de internet
  var on = useState(isOnline());
  var isOnlineStatus = on[0],
    setIsOnline = on[1];

  useEffect(function () {
    function updateNet() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    return function () {
      window.removeEventListener('online', updateNet);
      window.removeEventListener('offline', updateNet);
    };
  }, []);

  // Efecto para procesar la cola de sincronización cuando el estado online cambia
  useEffect(
    function () {
      if (isOnlineStatus && uid) {
        processQueue(uid);
      }
      // Suscribirse a cambios de estado online para reintentar la cola.
      // IMPORTANTE: guardamos la misma referencia para el remove. Antes
      // se creaban dos funciones distintas (add vs remove) y el listener
      // nunca se desregistraba → leak + duplicados al reabrir el efecto.
      var onlineListener = function () {
        processQueue(uid);
      };
      onOnline(onlineListener);
      return function () {
        removeOnlineListener(onlineListener);
      };
    },
    [isOnlineStatus, uid]
  );

  var cp = useState(false);
  var compact = cp[0],
    setCompact = cp[1];
  var compactRef = useRef(false);
  compactRef.current = compact;

  // Cuántas acciones quedan en la cola de sync (para el indicador del header).
  // Event-driven: solo actualiza cuando la cola cambia, no polling continuo.
  var spd = useState(0);
  var syncPending = spd[0],
    setSyncPending = spd[1];
  useEffect(
    function () {
      if (!uid) return;
      function updateQueueCount() {
        try {
          var all = leer('mt_sync_queue', {});
          var q = all && all[uid] ? all[uid] : [];
          setSyncPending(q.length);
        } catch (_) {}
      }
      updateQueueCount();
      window.__updateQueueCount = updateQueueCount;
      return function () {
        if (window.__updateQueueCount === updateQueueCount) window.__updateQueueCount = null;
      };
    },
    [uid]
  );

  // ── BANNER DE CONEXIÓN · DOM directo (seguro, sin React) ──
  // Inyecta/remueve un elemento en document.body.
  // Cero riesgo de congelar la app o romper scroll.
  var _connBannerEl = null;
  var _connBannerT = null;

  function _connState() {
    var esLocal = !session || session.guest || session.pinOnly;
    if (!navigator.onLine) return { k: 'off', t: 'Sin conexión a internet' };
    if (!esLocal && syncPending > 0 && typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) {
      return { k: 'connecting', t: 'Sincronizando ' + syncPending + ' cambio' + (syncPending !== 1 ? 's' : '') + '…' };
    }
    if (esLocal) return { k: 'on', t: 'Conectado (modo local)' };
    if (typeof CLOUD_MODE === 'undefined' || !CLOUD_MODE)
      return { k: 'off', t: 'Sin conexión a la nube' };
    var rt = typeof getRealtimeStatus === 'function' ? getRealtimeStatus() : null;
    if (rt === 'SUBSCRIBED') return { k: 'on', t: 'Conectado a Supabase' };
    if (rt === 'CHANNEL_ERROR' || rt === 'TIMED_OUT' || rt === 'CLOSED')
      return { k: 'off', t: 'Sin conexión a Supabase' };
    return { k: 'connecting', t: 'Conectando a Supabase…' };
  }

  function _dismissBanner() {
    if (_connBannerT) { clearTimeout(_connBannerT); _connBannerT = null; }
    if (_connBannerEl && _connBannerEl.parentNode) {
      _connBannerEl.parentNode.removeChild(_connBannerEl);
    }
    _connBannerEl = null;
  }

  function revealConn() {
    try { haptic && haptic(); } catch (_) {}
    // Toggle: si ya está visible, cerrar
    if (_connBannerEl) { _dismissBanner(); return; }

    var st = _connState();
    var title = st.k === 'on' ? 'Conectado' : st.k === 'off' ? 'Sin conexión' : 'Conectando';
    var dotColor = st.k === 'on' ? '#34c759' : st.k === 'off' ? '#ff3b30' : '#ff9500';
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Banner con estilos inline — garantizado, sin depender de CSS externo
    var wrap = document.createElement('div');
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');
    wrap.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;justify-content:center;pointer-events:none;animation:connBannerIn 4.5s ease forwards;';

    var card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:18px;' +
      (isDark
        ? 'background:rgba(28,28,32,0.88);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.5);'
        : 'background:rgba(255,255,255,0.88);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid rgba(0,0,0,0.06);box-shadow:0 8px 32px rgba(0,0,0,0.12);') +
      'max-width:380px;';

    var dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = 'width:10px;height:10px;border-radius:50%;flex-shrink:0;background:' + dotColor + ';box-shadow:0 0 10px ' + dotColor + ';';

    var txt = document.createElement('div');
    txt.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    var ttl = document.createElement('span');
    ttl.style.cssText = 'font-size:14px;font-weight:700;letter-spacing:-0.2px;color:' + (isDark ? '#f0f0f5' : '#1c1c1e') + ';';
    ttl.textContent = title;

    var sub = document.createElement('span');
    sub.style.cssText = 'font-size:12px;font-weight:500;color:' + (isDark ? '#a0a0b0' : '#6e6e73') + ';';
    sub.textContent = st.t;

    txt.appendChild(ttl);
    txt.appendChild(sub);
    card.appendChild(dot);
    card.appendChild(txt);
    wrap.appendChild(card);
    document.body.appendChild(wrap);

    _connBannerEl = wrap;
    _connBannerT = setTimeout(_dismissBanner, 4500);
  }

  // Limpiar banner al desmontar el componente
  useEffect(function () {
    return function () {
      _dismissBanner();
    };
  }, []);

  var scrRef = useRef(null);

  useEffect(function () {
    var el = scrRef.current;
    if (!el) return;
    function handleScroll() {
      var shouldBeCompact = el.scrollTop > 20;
      if (shouldBeCompact !== compactRef.current) setCompact(shouldBeCompact);
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return function () {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ── Pull-to-refresh ──────────────────────────────────────────────
  // Distancia de arrastre (px) para el indicador y flag de refresco.
  var ptr = useState(0);
  var pullDist = ptr[0],
    setPullDist = ptr[1];
  var rfs = useState(false);
  var refreshing = rfs[0],
    setRefreshing = rfs[1];
  var refreshingRef = useRef(false);
  var pullRef = useRef(0);

  // Re-fetch de datos + flush de la cola. Devuelve promesa.
  function doRefresh() {
    if (refreshingRef.current) return Promise.resolve();
    refreshingRef.current = true;
    // ⚠️ Si hay acciones locales sin subir, NO traemos el remoto encima:
    // cargarDatos toma `activo` literal del servidor (y borra la clave
    // local si viene null), así que un refresh durante la ventana en que
    // un turno recién iniciado aún no se subió borraría ese turno activo.
    // En ese caso solo empujamos la cola; el realtime/boot reconcilia.
    var pending = 0;
    try {
      var all = leer('mt_sync_queue', {});
      pending = all && all[uid] ? all[uid].length : 0;
    } catch (_) {}
    if (uid) processQueue(uid);
    if (pending > 0) {
      return Promise.resolve().then(function () {
        refreshingRef.current = false;
      });
    }
    return cargarDatos(uid, session.pinOnly)
      .then(function (data) {
        if (data && data.turnos) {
          setTurnos(data.turnos || []);
          setActivo(data.activo || null);
          if (data.salario) setSalario(data.salario);
        }
      })
      .catch(function () {})
      .then(function () {
        refreshingRef.current = false;
      });
  }
  // Ref a la última doRefresh para que los handlers táctiles (efecto con
  // deps [uid]) no capturen una versión vieja con session.pinOnly stale.
  var doRefreshRef = useRef(null);
  doRefreshRef.current = doRefresh;

  useEffect(
    function () {
      var el = scrRef.current;
      if (!el) return;
      var startY = 0;
      var pulling = false;
      var THRESH = 70;
      var MAX = 110;
      function onStart(e) {
        if (el.scrollTop > 0 || refreshingRef.current) {
          pulling = false;
          return;
        }
        startY = e.touches[0].clientY;
        pulling = true;
      }
      function onMove(e) {
        if (!pulling) return;
        if (el.scrollTop > 0) {
          pulling = false;
          pullRef.current = 0;
          setPullDist(0);
          return;
        }
        var dy = e.touches[0].clientY - startY;
        if (dy <= 0) {
          pullRef.current = 0;
          setPullDist(0);
          return;
        }
        // Resistencia: el arrastre se siente "pesado" hacia el final
        var d = Math.min(MAX, dy * 0.5);
        pullRef.current = d;
        setPullDist(d);
      }
      function onEnd() {
        if (!pulling) return;
        pulling = false;
        if (pullRef.current >= THRESH) {
          setRefreshing(true);
          setPullDist(THRESH);
          doRefreshRef.current().then(function () {
            setRefreshing(false);
            pullRef.current = 0;
            setPullDist(0);
          });
        } else {
          pullRef.current = 0;
          setPullDist(0);
        }
      }
      el.addEventListener('touchstart', onStart, { passive: true });
      el.addEventListener('touchmove', onMove, { passive: true });
      el.addEventListener('touchend', onEnd, { passive: true });
      el.addEventListener('touchcancel', onEnd, { passive: true });
      return function () {
        el.removeEventListener('touchstart', onStart);
        el.removeEventListener('touchmove', onMove);
        el.removeEventListener('touchend', onEnd);
        el.removeEventListener('touchcancel', onEnd);
      };
    },
    [uid]
  );

  var toastRef = useRef(null);
  function showToast(m, type) {
    var t = type || 'info';
    setToast({ msg: m, type: t });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(function () {
      setToast(null);
    }, 2400);
    try {
      if (t === 'success' && typeof hapticSuccess === 'function') hapticSuccess();
      else if (t === 'error' && typeof hapticError === 'function') hapticError();
      else if (t === 'warning' && typeof hapticWarning === 'function') hapticWarning();
    } catch (_) {}
  }
  // Exponemos showToast a la cola de sync para que pueda avisar
  // errores permanentes (ej. PIN duplicado al sincronizar offline).
  useEffect(function () {
    window.showToast = showToast;
    return function () {
      if (window.showToast === showToast) window.showToast = null;
    };
  }, []);

  useEffect(function () {
    var rafId = null;
    var lastTick = 0;
    var visible = true;
    function loop(ts) {
      if (!visible) {
        return;
      }
      if (ts - lastTick >= 500) {
        lastTick = ts;
        setAhora(Date.now());
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    function onVis() {
      visible = document.visibilityState === 'visible';
      if (visible) {
        setAhora(Date.now());
        if (!rafId) rafId = requestAnimationFrame(loop);
      }
    }
    document.addEventListener('visibilitychange', onVis, { passive: true });
    return function () {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // ── Convergencia forzada: flush de cola + re-fetch del remoto. Se dispara
  // al restaurar la auth (root.js), al resucitar realtime (supabase.js, cierra
  // el hueco de eventos perdidos) y al volver la app a primer plano / recuperar
  // red. Expuesto como window.__mtResync. Es la pieza que hace converger los
  // dos devices tras una desconexión.
  useEffect(
    function () {
      if (!uid) return;
      function resync() {
        var pending = 0;
        try {
          var all = leer('mt_sync_queue', {});
          pending = all && all[uid] ? all[uid].length : 0;
        } catch (_) {}
        try {
          processQueue(uid);
        } catch (_) {}
        // Si hay cambios locales sin subir, NO traemos el remoto encima
        // (borraría un turno recién iniciado aquí); primero se vacía la cola
        // y el realtime / próximo resync reconcilia.
        if (pending > 0) return;
        cargarDatos(uid, session.pinOnly)
          .then(function (data) {
            if (data && data.turnos) {
              setTurnos(data.turnos || []);
              setActivo(data.activo || null);
              if (data.salario) setSalario(data.salario);
            }
          })
          .catch(function () {});
      }
      window.__mtResync = resync;
      function onVis() {
        if (document.visibilityState === 'visible') resync();
      }
      document.addEventListener('visibilitychange', onVis, { passive: true });
      if (typeof onOnline === 'function') onOnline(resync);
      return function () {
        if (window.__mtResync === resync) window.__mtResync = null;
        document.removeEventListener('visibilitychange', onVis);
        if (typeof removeOnlineListener === 'function') removeOnlineListener(resync);
      };
    },
    [uid, session.pinOnly]
  );

  useEffect(
    function () {
      var cancelled = false;
      loadedRef.current = false;
      setLoading(true);
      var splashStart = Date.now();
      cargarDatos(uid, session.pinOnly)
        .then(function (data) {
          if (cancelled) return;
          if (!data || !data.turnos) {
            data = { turnos: [], activo: null, salario: SMIN };
          }
          setTurnos(data.turnos || []);
          setActivo(data.activo || null);
          var salCarga = data.salario || SMIN;
          setSalario(salCarga);
          // Inferencia del flag "salario configurado":
          //   1. Flag local explícito (mt_sc_<uid>) si fue tocado en este device
          //   2. Flag remoto (v52): si en Supabase perfiles.salario_base no es
          //      null, el usuario lo configuró desde algún device antes
          //   3. Heurístico legacy: si salario > SMIN, asumir configurado
          //      (cubre usuarios pre-v24 que nunca tuvieron flag)
          // Cualquiera de las 3 condiciones marca el flag → no banner.
          var savedFlag = leer(dk(uid, 'sc'), null);
          var remoteFlag = data && data.salarioConfigured === true;
          var inferred =
            savedFlag === true || remoteFlag || (savedFlag === null && salCarga > SMIN);
          setSalarioConfigured(inferred);
          setPrefs(normalizePrefs(leer(dk(uid, 'prefs'), null)));
          loadedRef.current = true;
          function finishSplash() {
            if (cancelled) return;
            setSplashExit(true);
            setTimeout(function () {
              if (!cancelled) {
                setLoading(false);
                var hasPin =
                  leer('mt_pin_' + uid, null) || leer('mt_pin_app_' + uid, null) || session.pin;
                var isRealCloudUser =
                  !session.pinOnly && !session.guest && CLOUD_MODE && !!session.email;
                if (isRealCloudUser && !hasPin) {
                  setShowPinSetup(true);
                }
              }
            }, 330);
          }
          if (props.introPlayed) {
            finishSplash();
          } else {
            setTimeout(function () {
              if (!cancelled) {
                var elapsed = Date.now() - splashStart;
                setTimeout(finishSplash, Math.max(0, 1080 - elapsed));
              }
            }, 350);
          }
        })
        .catch(function (e) {
          if (!cancelled) {
            setTurnos([]);
            setActivo(null);
            setSalario(SMIN);
            loadedRef.current = true;
            setSplashExit(true);
            setTimeout(function () {
              if (!cancelled) setLoading(false);
            }, 330);
          }
        });
      return function () {
        cancelled = true;
      };
    },
    [uid, session.pinOnly]
  );

  // ── Sync entre dispositivos (Realtime) ────────────────────────
  // Cuando otro device del mismo usuario inicia/para un turno o
  // edita el historial, recibimos un evento de Postgres-Realtime y
  // refrescamos el estado local. Debounced 400 ms para coalescer
  // ráfagas (ej. parar turno = DELETE en turno_activo + INSERT en
  // turnos casi simultáneos).
  useEffect(
    function () {
      if (!CLOUD_MODE || !SUPA || !uid || session.pinOnly || session.guest) return;
      if (typeof supaSubscribeUser !== 'function') return;

      var pendingT = null;
      var disposed = false;
      function resyncDebounced() {
        if (pendingT) clearTimeout(pendingT);
        pendingT = setTimeout(function () {
          pendingT = null;
          if (disposed) return;
          cargarDatos(uid, session.pinOnly)
            .then(function (data) {
              if (disposed || !data) return;
              setTurnos(data.turnos || []);
              setActivo(data.activo || null);
            })
            .catch(function () {});
        }, 400);
      }

      var unsub = supaSubscribeUser(uid, function () {
        resyncDebounced();
      });

      return function () {
        disposed = true;
        if (pendingT) clearTimeout(pendingT);
        if (unsub) unsub();
      };
    },
    [uid, session.pinOnly, session.guest]
  );

  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 't'), turnos);
    },
    [turnos, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      if (activo === null) borrarKey(dk(uid, 'a'));
      else grabar(dk(uid, 'a'), activo);
    },
    [activo, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 's'), salario);
    },
    [salario, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 'sc'), salarioConfigured);
    },
    [salarioConfigured, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 'prefs'), prefs);
    },
    [prefs, uid]
  );

  function onPrefsChange(patch) {
    setPrefs(function (p) {
      return normalizePrefs(Object.assign({}, p, patch));
    });
  }

  var activoRef = useRef(activo);
  activoRef.current = activo;
  var showOlvRef = useRef(showOlv);
  showOlvRef.current = showOlv;
  // Ref para recordar qué turno ya fue notificado, así si el usuario
  // descarta con "Sigue activo" no se vuelve a mostrar el modal para el mismo turno
  var notificadoRef = useRef(null);

  useEffect(
    function () {
      var to = null;
      function schedule() {
        if (!activoRef.current || showOlvRef.current) {
          return;
        }
        // Si ya notificamos para este turno (mismo ID), no insistir
        if (notificadoRef.current === activoRef.current.id) {
          return;
        }
        var inicio = new Date(activoRef.current.inicio).getTime();
        var elapsed = Date.now() - inicio;
        if (elapsed >= U12H) {
          notificadoRef.current = activoRef.current.id;
          setShowOlv(true);
          return;
        }
        var remaining = U12H - elapsed;
        to = setTimeout(function () {
          if (activoRef.current && !showOlvRef.current) {
            if (notificadoRef.current !== activoRef.current.id) {
              notificadoRef.current = activoRef.current.id;
              setShowOlv(true);
            }
          }
        }, remaining);
      }
      schedule();
      function onVis() {
        if (document.visibilityState === 'visible') {
          if (to) {
            clearTimeout(to);
            to = null;
          }
          schedule();
        }
      }
      document.addEventListener('visibilitychange', onVis, { passive: true });
      return function () {
        if (to) clearTimeout(to);
        document.removeEventListener('visibilitychange', onVis);
      };
    },
    [activo]
  );

  useEffect(function () {
    if (!navigator.getBattery) return;
    var bat = null;
    function applyState() {
      if (!bat) return;
      var lowPower = bat.level < 0.2 && !bat.charging;
      document.documentElement.classList.toggle('low-power', lowPower);
    }
    navigator
      .getBattery()
      .then(function (b) {
        bat = b;
        applyState();
        bat.addEventListener('levelchange', applyState);
        bat.addEventListener('chargingchange', applyState);
      })
      .catch(function () {});
    return function () {
      if (bat) {
        bat.removeEventListener('levelchange', applyState);
        bat.removeEventListener('chargingchange', applyState);
      }
    };
  }, []);

  useEffect(function () {
    function onVis() {
      if (document.visibilityState === 'visible') {
        setAhora(Date.now());
      }
    }
    document.addEventListener('visibilitychange', onVis, { passive: true });
    return function () {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(
    function () {
      window.__mtTurnoActivo = !!activo;
    },
    [activo]
  );

  // ── Iniciar/detener rotación Mood Bar según pestaña ──
  useEffect(
    function () {
      if (tab === 'home') {
        if (window._startMoodRotation) window._startMoodRotation();
      } else {
        if (window._stopMoodRotation) window._stopMoodRotation();
      }
    },
    [tab]
  );

  var vh = useMemo(
    function () {
      return salario / 240;
    },
    [salario]
  );
  var ahoraDate = useMemo(
    function () {
      return new Date(ahora);
    },
    [ahora]
  );
  var ahoraMin = useMemo(
    function () {
      return Math.floor(ahora / 60000) * 60000;
    },
    [ahora]
  );
  var ahoraDateCalc = useMemo(
    function () {
      return new Date(ahoraMin);
    },
    [ahoraMin]
  );

  var mesKey = ahoraDate.getFullYear() * 100 + ahoraDate.getMonth();
  var turnosMes = useMemo(
    function () {
      var ini = new Date(ahoraDate.getFullYear(), ahoraDate.getMonth(), 1);
      return turnos.filter(function (t) {
        return new Date(t.inicio) >= ini;
      });
    },
    [turnos, mesKey]
  );

  var calc = useMemo(
    function () {
      return doCalc(turnosMes, activo, ahoraDateCalc, vh);
    },
    [turnosMes, activo, ahoraMin, vh]
  );

  // ── Cálculo por quincena (solo si el modo está activo) ───────
  var quincena = useMemo(
    function () {
      if (!prefs.quincenaMode) return null;
      var rango = getQuincenaRange(ahoraDate, prefs);
      var tQ = filterTurnosRango(turnos, rango);
      // El activo se incluye en la quincena si su inicio cae dentro
      var activoEnRango =
        activo && new Date(activo.inicio) >= rango.ini && new Date(activo.inicio) < rango.fin
          ? activo
          : null;
      var calcQ = doCalc(tQ, activoEnRango, ahoraDateCalc, vh);
      return { rango: rango, turnos: tQ, calc: calcQ };
    },
    [prefs, turnos, activo, ahoraMin, vh, ahoraDate.getDate(), ahoraDate.getMonth()]
  );

  var quincenasMes = useMemo(
    function () {
      if (!prefs.quincenaMode) return null;
      var qs = getQuincenasMes(ahoraDate, prefs);
      var t1 = filterTurnosRango(turnos, qs.q1);
      var t2 = filterTurnosRango(turnos, qs.q2);
      var aEnQ1 =
        activo && new Date(activo.inicio) >= qs.q1.ini && new Date(activo.inicio) < qs.q1.fin
          ? activo
          : null;
      var aEnQ2 =
        activo && new Date(activo.inicio) >= qs.q2.ini && new Date(activo.inicio) < qs.q2.fin
          ? activo
          : null;
      return {
        q1: {
          rango: qs.q1,
          turnos: t1,
          calc: doCalc(t1, aEnQ1, ahoraDateCalc, vh)
        },
        q2: {
          rango: qs.q2,
          turnos: t2,
          calc: doCalc(t2, aEnQ2, ahoraDateCalc, vh)
        }
      };
    },
    [prefs, turnos, activo, ahoraMin, vh, ahoraDate.getMonth()]
  );

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;
  var festHoy = esFest(ahoraDate);

  function onIni() {
    haptic();
    var ini = new Date().toISOString();
    insertTurno(uid, ini).then(function (row) {
      var nuevo = { id: row.id, inicio: row.inicio, userId: uid };
      setActivo(nuevo);
      setShowOlv(false);
      showToast('Turno iniciado', 'success');
      queueAction(uid, 'setActivo', nuevo);
    });
  }

  function onFin() {
    if (!activo) return;
    haptic();
    var fin = new Date();
    var durSeg = (fin - new Date(activo.inicio)) / 1000;
    // Descartar turnos menores a 60 s — evita basura por doble-toque accidental
    if (durSeg < 60) {
      setActivo(null);
      setShowOlv(false);
      queueAction(uid, 'setActivo', null);
      showToast('Turno muy corto — no registrado', 'warning');
      return;
    }
    var finISO = fin.toISOString();
    var turnoCerrado = { id: activo.id, inicio: activo.inicio, fin: finISO, userId: uid };
    setTurnos(function (p) {
      return [turnoCerrado].concat(p);
    });
    setActivo(null);
    setShowOlv(false);
    showToast('Turno cerrado', 'success');
    queueAction(uid, 'insertTurno', turnoCerrado);
    queueAction(uid, 'setActivo', null);
  }

  function onOlv(finISO) {
    if (!activo) return;
    haptic();
    var turnoCerrado = { id: activo.id, inicio: activo.inicio, fin: finISO, userId: uid };
    setTurnos(function (p) {
      return [turnoCerrado].concat(p);
    });
    setActivo(null);
    setShowOlv(false);
    showToast('Turno guardado', 'success');
    queueAction(uid, 'insertTurno', turnoCerrado);
    queueAction(uid, 'setActivo', null);
  }

  function onSalario(v) {
    haptic();
    setSalario(v);
    // Cualquier guardado explícito marca el salario como configurado,
    // incluso si coincide con el mínimo legal (caso válido).
    setSalarioConfigured(true);
    showToast('Salario actualizado', 'success');
    queueAction(uid, 'setSalario', { salario: v });
  }
  function onBorrar() {
    haptic();
    setTurnos([]);
    showToast('Historial borrado', 'warning');
    queueAction(uid, 'deleteAllTurnos', {});
  }
  function onBorrarUno(id) {
    haptic();
    setTurnos(function (p) {
      return p.filter(function (t) {
        return t.id !== id;
      });
    });
    showToast('Turno eliminado', 'warning');
    queueAction(uid, 'deleteTurno', { id: id });
  }
  // Estado para modal de exportar (PDF o Excel)
  var ex = useState(null);
  var exportMode = ex[0],
    setExportMode = ex[1]; // null | 'pdf' | 'xlsx'
  function onExportPDF() {
    haptic();
    setExportMode('pdf');
  }
  function onExportExcel() {
    haptic();
    setExportMode('xlsx');
  }

  if (loading) return h(SplashScreen, { exit: splashExit, plain: props.introPlayed });

  var tStr = ahoraDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  var TABS = [
    { id: 'home', icon: 'home', lbl: 'Inicio' },
    { id: 'dashboard', icon: 'chart', lbl: 'Análisis' },
    { id: 'ai', icon: 'sparkle', lbl: 'Asistente' },
    { id: 'history', icon: 'history', lbl: 'Historial' },
    { id: 'config', icon: 'settings', lbl: 'Ajustes' }
  ];
  var activeIdx = TABS.findIndex(function (t) {
    return t.id === tab;
  });
  if (activeIdx < 0) activeIdx = 0;

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } },
    showPinSetup
      ? h(PinSetup, {
          session: session,
          onDone: function (newPin) {
            haptic();
            var cur = leer(SKEY, {});
            if (cur) {
              cur.pin = newPin;
              grabar(SKEY, cur);
            }
            if (onSessionPatch) onSessionPatch({ pin: newPin });
            setShowPinSetup(false);
            showToast('PIN creado correctamente', 'success');
          },
          onSkip: function () {
            haptic();
            setShowPinSetup(false);
          }
        })
      : null,
    showOlv && activo
      ? h(ModalOlvidado, {
          inicio: activo.inicio,
          onGuardar: onOlv,
          onContinuar: function () {
            setShowOlv(false);
          }
        })
      : null,
    toast
      ? h(
          'div',
          {
            className: 'toast toast--' + toast.type,
            role: 'alert',
            'aria-live': 'assertive',
            'aria-atomic': 'true'
          },
          h(
            'span',
            { className: 'toast-ico', 'aria-hidden': 'true' },
            toast.type === 'success'
              ? '✓'
              : toast.type === 'error'
                ? '✕'
                : toast.type === 'warning'
                  ? '!'
                  : 'i'
          ),
          h('span', { className: 'toast-msg' }, toast.msg)
        )
      : null,

    h(
      'header',
      { className: 'hdr' + (compact ? ' hdr--compact' : ''), role: 'banner' },
      h(
        'div',
        { className: 'hdr-l' },
        (function () {
          // LED unificado: refleja el estado REAL de Supabase (no solo internet).
          // Misma fuente que el popover (_connState), para que dot y texto coincidan.
          var st = _connState();
          // 'on' = verde · 'off' = rojo · 'connecting' = ámbar pulsante
          var ledCls = st.k;
          return h(
            'button',
            {
              className: 'hdr-led-btn',
              type: 'button',
              onClick: revealConn,
              title: st.t,
              'aria-label': st.t + '. Tocá para ver el estado de conexión.'
            },
            h('span', { className: 'hdr-led ' + ledCls, 'aria-hidden': 'true' })
          );
        })(),
        h('img', {
          src: 'img/logo-mark.svg',
          width: 24,
          height: 24,
          alt: '',
          draggable: false,
          style: { borderRadius: '6px', flexShrink: 0, display: 'block' }
        }),
        h(
          'div',
          { className: 'hdr-info' },
          h('div', { className: 'hdr-brand' }, 'Mi Turno'),
          h(
            'div',
            { className: 'hdr-meta' },
            h(
              'span',
              { className: 'hdr-date' },
              ahoraDate.toLocaleDateString('es-CO', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              }) + (festHoy ? ' · Fest' : '')
            ),
            h('span', { className: 'hdr-clock' }, tStr)
          )
        )
      ),
      h(
        'div',
        { className: 'hdr-r' },
        h(
          'button',
          {
            className: 'icon-btn',
            'aria-label': theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
            title: theme === 'dark' ? 'Modo claro' : 'Modo oscuro',
            onClick: function () {
              haptic();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }
          },
          theme === 'dark'
            ? h(
                'svg',
                {
                  viewBox: '0 0 24 24',
                  width: 18,
                  height: 18,
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                },
                h('circle', { cx: 12, cy: 12, r: 5 }),
                h('line', { x1: 12, y1: 1, x2: 12, y2: 3 }),
                h('line', { x1: 12, y1: 21, x2: 12, y2: 23 }),
                h('line', { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }),
                h('line', { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }),
                h('line', { x1: 1, y1: 12, x2: 3, y2: 12 }),
                h('line', { x1: 21, y1: 12, x2: 23, y2: 12 }),
                h('line', { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }),
                h('line', { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 })
              )
            : h(
                'svg',
                {
                  viewBox: '0 0 24 24',
                  width: 18,
                  height: 18,
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                },
                h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })
              )
        )
      )
    ),

    h(
      'div',
      { className: 'scr', ref: scrRef },
      h(
        'div',
        {
          className: 'ptr' + (refreshing ? ' ptr--refreshing' : ''),
          style: {
            height: (refreshing ? 44 : pullDist) + 'px',
            opacity: refreshing || pullDist > 4 ? 1 : 0
          }
        },
        h('div', {
          className: 'ptr-spin' + (refreshing || pullDist >= 70 ? ' ready' : '')
        })
      ),
      h(
        'main',
        { className: 'tab-view', role: 'main' },
        tab === 'home'
          ? h(HomeTab, {
              calc: calc,
              activo: activo,
              ahora: ahoraDate,
              salario: salario,
              salarioConfigured: salarioConfigured,
              vh: vh,
              turnos: turnos,
              prefs: prefs,
              quincena: quincena,
              session: session,
              onIni: onIni,
              onFin: onFin,
              onOpenAssistant: function () {
                haptic();
                setTab('ai');
              },
              onOpenConfig: function () {
                haptic();
                setTab('config');
              }
            })
          : tab === 'dashboard'
            ? h(DashboardTab, {
                calc: calc,
                turnos: turnosMes,
                salario: salario,
                vh: vh,
                ahora: ahoraDate,
                themeKey: theme,
                prefs: prefs,
                quincenasMes: quincenasMes
              })
            : tab === 'ai'
              ? h(AsistenteTab, {
                  turnos: turnosMes,
                  turnosAll: turnos,
                  calc: calc,
                  salario: salario,
                  vh: vh,
                  session: session
                })
              : tab === 'history'
                ? h(HistoryTab, {
                    turnos: turnos,
                    activo: activo,
                    durActual: durActual,
                    session: session,
                    calc: calc,
                    vh: vh,
                    ahora: ahoraDate,
                    onBorrar: onBorrar,
                    onBorrarUno: onBorrarUno,
                    onExportPDF: onExportPDF,
                    onExportExcel: onExportExcel
                  })
                : h(ConfigTab, {
                    salario: salario,
                    valorHora: vh,
                    session: session,
                    onSalario: onSalario,
                    onSignOut: props.onSignOut,
                    onSessionPatch: onSessionPatch,
                    theme: theme,
                    onThemeChange: setTheme,
                    prefs: prefs,
                    onPrefsChange: onPrefsChange,
                    onRevealConn: revealConn
                  })
      )
    ),

    h(
      'nav',
      { className: 'tabs', role: 'tablist', 'aria-label': 'Navegación principal' },
      h('div', {
        className: 'tab-indicator',
        style: { transform: 'translateX(' + activeIdx * 100 + '%)' },
        'aria-hidden': 'true'
      }),
      TABS.map(function (item) {
        return h(
          'button',
          {
            key: item.id,
            className: 'tab-btn ' + (tab === item.id ? 'on' : ''),
            role: 'tab',
            'aria-selected': tab === item.id ? 'true' : 'false',
            'aria-label': item.lbl,
            onClick: function () {
              haptic();
              setTab(item.id);
            }
          },
          tabIcon(item.icon),
          h('div', { className: 'tab-label' }, item.lbl)
        );
      })
    ),

    // ── Modal Exportar Reporte (PDF/Excel) ──
    exportMode
      ? h(
          'div',
          {
            className: 'ovl',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Exportar reporte',
            onClick: function (ev) {
              if (ev.target === ev.currentTarget) setExportMode(null);
            }
          },
          h(ExportReportModal, {
            format: exportMode,
            turnos: turnos,
            calc: calc,
            salario: salario,
            session: session,
            onClose: function () {
              setExportMode(null);
            }
          })
        )
      : null
  );
}


// ── js/app/root.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/root.js
//  Componente raíz · manejo de sesión y sincronización entre dispositivos
// ════════════════════════════════════════════════════════════════
function Root() {
  var ss = useState(function () {
    var raw = leer(SKEY, null);
    return validarSesion(raw);
  });
  var session = ss[0],
    setSession = ss[1];

  // Ref siempre actualizada: evita closures obsoletos en los listeners
  // de Supabase y de la vigilancia de sesión.
  var sessionRef = useRef(session);
  sessionRef.current = session;

  // Marca un cierre de sesión iniciado por el propio usuario en este
  // dispositivo, para no confundirlo con un cierre remoto (otro equipo).
  var cierreManualRef = useRef(false);

  function patchSession(p) {
    setSession(function (s) {
      return s ? Object.assign({}, s, p) : s;
    });
  }

  // Limpia los datos locales asociados a una sesión (cola de sync, IA,
  // y la sesión guardada). No borra credenciales offline: el usuario
  // debe poder volver a entrar con su correo/PIN aunque esté sin red.
  function limpiarSesionLocal(s) {
    try {
      if (s && typeof clearSyncQueue === 'function') clearSyncQueue(s.uid);
      if (s && typeof _aiClearHistory === 'function') _aiClearHistory(s.uid);
    } catch (e) {}
    grabar(SKEY, null);
  }

  // Cierre forzado al detectar que la sesión se cerró en otro dispositivo.
  // La sesión ya está revocada en el servidor: aquí solo limpiamos local.
  function forzarCierreRemoto() {
    var actual = sessionRef.current;
    if (!actual) return;
    cierreManualRef.current = false;
    limpiarSesionLocal(actual);
    grabar('mt_aviso', { tipo: 'remote_signout', ts: Date.now() });
    setSession(null);
    if (CLOUD_MODE && SUPA && SUPA.auth) {
      SUPA.auth.signOut({ scope: 'local' }).catch(function () {});
    }
  }

  // Cierre de sesión iniciado por el usuario desde este dispositivo.
  function signOut() {
    haptic();
    var actual = sessionRef.current;
    var wasCloud = actual && actual.cloud && !actual.pinOnly && !actual.guest;
    cierreManualRef.current = true;
    try {
      limpiarSesionLocal(actual);
      setSession(null);
      // scope 'global': revoca la sesión en TODOS los dispositivos.
      if (wasCloud && CLOUD_MODE && SUPA && SUPA.auth) {
        SUPA.auth.signOut({ scope: 'global' }).catch(function () {});
      }
    } catch (e) {
      try {
        grabar(SKEY, null);
      } catch (e2) {}
      setSession(null);
    }
  }

  function handleAuth(s) {
    var validated = validarSesion(s);
    cierreManualRef.current = false;
    grabar(SKEY, validated);
    setSession(validated);
    // Marca este device como "conocido" para el próximo arranque,
    // así podemos ofrecer login simplificado por PIN. No se borra al
    // cerrar sesión; el usuario lo limpia con la flecha ← del
    // FastPinScreen o al ingresar como otro usuario.
    try {
      if (validated && validated.uid && validated.email && !validated.guest) {
        grabar('mt_last_user', { uid: validated.uid, email: validated.email });
      }
    } catch (_) {}
    // Salir del "skip fast" cuando se loguea correctamente
    setSkipFast(false);
  }

  // ── Intro animation (se muestra para TODOS los usuarios) ──────
  var si = useState(true);
  var showIntro = si[0],
    setShowIntro = si[1];
  var se = useState(false);
  var introExit = se[0],
    setIntroExit = se[1];
  var ip = useState(false);
  var introPlayed = ip[0],
    setIntroPlayed = ip[1];

  useEffect(function () {
    var alive = true;
    var t1 = setTimeout(function () {
      if (!alive) return;
      setIntroExit(true);
      setTimeout(function () {
        if (!alive) return;
        setShowIntro(false);
        setIntroPlayed(true);
      }, 340);
    }, 1400);
    return function () {
      alive = false;
      clearTimeout(t1);
    };
  }, []);

  useEffect(function () {
    var t = setTimeout(function () {
      var s = document.getElementById('initSplash');
      if (s) {
        s.classList.add('fadeout');
        setTimeout(function () {
          if (s.parentNode) s.parentNode.removeChild(s);
        }, 600);
      }
    }, 700);
    return function () {
      clearTimeout(t);
    };
  }, []);

  // ── Sesión en la nube: aplicar y escuchar cambios de Supabase ──
  useEffect(function () {
    if (!CLOUD_MODE || !SUPA) return;

    var applying = false;
    function aplicar(supaSession) {
      if (!supaSession || !supaSession.user) return;
      if (applying) return;
      applying = true;

      var u = supaSession.user;
      var esAdminAuto = u.email === 'admin@miturno.com';
      var ses = validarSesion({
        uid: u.id,
        email: u.email || 'usuario@cloud',
        guest: false,
        cloud: true,
        isAdmin: esAdminAuto
      });

      grabar(SKEY, ses);
      setSession(ses);
      // Marca device conocido también cuando Supabase restaura sesión
      try {
        if (ses && ses.uid && ses.email) {
          grabar('mt_last_user', { uid: ses.uid, email: ses.email });
        }
      } catch (_) {}

      // Cachear los tokens de Supabase: habilita que FastPin restaure la
      // sesión REAL (setSession) sin pedir contraseña, así el device queda
      // autenticado y sincroniza de verdad (sube, baja y realtime).
      try {
        if (u.email && supaSession.access_token && supaSession.refresh_token) {
          var _okey = 'mt_offline_' + btoa(String(u.email).toLowerCase());
          var _oblob = leer(_okey, null) || {
            uid: u.id,
            email: String(u.email).toLowerCase(),
            cloud: true,
            guest: false,
            isAdmin: esAdminAuto
          };
          _oblob.access_token = supaSession.access_token;
          _oblob.refresh_token = supaSession.refresh_token;
          _oblob.token_expires_at = supaSession.expires_at || null;
          grabar(_okey, _oblob);
        }
      } catch (_) {}

      // Sesión autenticada confirmada → vaciar la cola pendiente y forzar
      // una convergencia de datos (cierra el hueco si se entró por PIN o
      // si realtime estuvo caído mientras hubo cambios en otro device).
      // Diferido con setTimeout: NUNCA llamar métodos de supabase (getSession
      // dentro de processQueue) de forma síncrona dentro del callback de
      // onAuthStateChange — puede bloquear el lock de auth.
      setTimeout(function () {
        try {
          if (typeof processQueue === 'function') processQueue(u.id);
        } catch (_) {}
        try {
          if (typeof window.__mtResync === 'function') window.__mtResync();
        } catch (_) {}
      }, 450);

      if (u.email) {
        // Lookup por user_id (estable) en vez de user_email (mutable):
        // si el usuario cambia su correo, el lookup por email queda
        // desincronizado un rato. El user_id nunca cambia.
        withTimeout(
          SUPA.from('pin_lookup').select('pin').eq('user_id', u.id).maybeSingle(),
          6000,
          'PIN lookup en aplicar'
        )
          .then(function (res) {
            // CRÍTICO (v53): si la query devolvió error (RLS, timeout sin
            // throw, etc.) NO tocar el PIN local. Antes el código asumía
            // 'primer login' y generaba un PIN aleatorio nuevo, pisando
            // el real del usuario → FastPinScreen mostraba 'PIN incorrecto'.
            if (res && res.error) {
              console.warn(
                '[MT] PIN lookup devolvió error — preservando PIN local:',
                res.error.message || res.error
              );
              applying = false;
              return;
            }
            if (res.data && res.data.pin) {
              var updated = Object.assign({}, ses);
              updated.pin = res.data.pin;
              if (res.data.pin === '9999') updated.isAdmin = true;
              grabar('mt_pin_' + u.id, res.data.pin);
              grabar(SKEY, updated);
              setSession(updated);
              applying = false;
              return;
            }
            // res.data === null y sin error → genuinamente no hay PIN en
            // pin_lookup. ANTES de generar uno nuevo random, revisar si
            // hay uno local de una sesión anterior — si lo hay, subirlo
            // en vez de generar otro (evita pérdida de PIN del usuario).
            var pinLocal = leer('mt_pin_' + u.id, null);
            if (pinLocal && /^\d{4}$/.test(String(pinLocal))) {
              guardarPINEnNube(u.id, u.email, pinLocal)
                .then(function () {
                  applying = false;
                })
                .catch(function () {
                  applying = false;
                });
              return;
            }
            // Primer login real: el PIN no se pudo guardar durante el
            // registro (sin sesión activa). Ahora que hay sesión, se
            // genera y guarda.
            generarPINUnico(u.id)
              .then(function (pin) {
                return guardarPINEnNube(u.id, u.email, pin).then(function (result) {
                  if (result.success) {
                    var updated = Object.assign({}, ses, { pin: pin });
                    grabar('mt_pin_' + u.id, pin);
                    grabar(SKEY, updated);
                    setSession(updated);
                  }
                  applying = false;
                });
              })
              .catch(function () {
                applying = false;
              });
          })
          .catch(function (e) {
            console.warn('[MT] PIN lookup falló (no crítico):', e.message || e);
            applying = false;
          });
      } else {
        applying = false;
      }
    }

    SUPA.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        aplicar(res.data.session);
      }
    });

    var sub = SUPA.auth.onAuthStateChange(function (event, supaSession) {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (supaSession) aplicar(supaSession);
      } else if (event === 'SIGNED_OUT') {
        var manual = cierreManualRef.current;
        cierreManualRef.current = false;
        var actual = sessionRef.current;
        limpiarSesionLocal(actual);
        // Si el cierre no lo pidió el usuario aquí, vino de otro
        // dispositivo (o caducó): dejamos un aviso para la pantalla
        // de acceso, así el usuario "lo nota".
        if (!manual && actual) {
          grabar('mt_aviso', { tipo: 'remote_signout', ts: Date.now() });
        }
        setSession(null);
        applying = false;
      }
    });

    return function () {
      try {
        if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
      } catch (e) {}
    };
  }, []);

  // ── Vigilancia de cierre de sesión entre dispositivos ──────────
  // Solo para usuarios reales de la nube (no invitados ni modo PIN local).
  var esSesionCloud = !!(
    session &&
    session.cloud &&
    !session.guest &&
    !session.pinOnly &&
    CLOUD_MODE &&
    SUPA
  );
  useEffect(
    function () {
      if (typeof startSessionSync !== 'function') return;
      if (!esSesionCloud) {
        if (typeof stopSessionSync === 'function') stopSessionSync();
        return;
      }
      startSessionSync(function () {
        forzarCierreRemoto();
      });
      return function () {
        if (typeof stopSessionSync === 'function') stopSessionSync();
      };
    },
    [esSesionCloud]
  );

  // ── Fast PIN: device "conocido" después de un login completo ─────
  // Cuando se cierra sesión preservamos credenciales offline (PIN +
  // sesión cacheada). Aquí detectamos si podemos saltar el login
  // completo y mostrar solo el ingreso del PIN.
  var skipFastS = useState(false);
  var skipFast = skipFastS[0],
    setSkipFast = skipFastS[1];
  var showForgotPinS = useState(false);
  var showForgotPin = showForgotPinS[0],
    setShowForgotPin = showForgotPinS[1];

  function _fastPinEligible() {
    if (skipFast) return null;
    try {
      var lu = leer('mt_last_user', null);
      if (!lu || !lu.uid || !lu.email) return null;
      var pin = leer('mt_pin_' + lu.uid, null);
      if (!pin || String(pin).length !== 4) return null;
      return lu;
    } catch (_) {
      return null;
    }
  }

  if (showIntro) return h(SplashScreen, { exit: introExit });

  if (!session) {
    var lastUser = _fastPinEligible();
    if (lastUser && typeof FastPinScreen === 'function') {
      return h(
        'div',
        null,
        h(FastPinScreen, {
          lastUser: lastUser,
          onAuth: handleAuth,
          onExitFastMode: function () {
            setSkipFast(true);
          },
          onForgotPin: function () {
            setShowForgotPin(true);
          }
        }),
        showForgotPin && typeof ForgotPinModal === 'function'
          ? h(ForgotPinModal, {
              lastUser: lastUser,
              onClose: function () {
                setShowForgotPin(false);
              },
              onPinReset: function (ses) {
                setShowForgotPin(false);
                handleAuth(ses);
              }
            })
          : null
      );
    }
    return h(AuthScreen, { onAuth: handleAuth });
  }
  return h(App, {
    key: session.uid,
    session: session,
    onSignOut: signOut,
    onSessionPatch: patchSession,
    introPlayed: introPlayed
  });
}


// ── js/app/sw-register.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js  (v58)
//  Estrategia: actualización 100% silenciosa
//
//  Flujo:
//    1. reg.update() en load + visibilitychange (si oculto > 60 s) + online
//    2. updatefound → SW instala en background; se captura versión destino
//       de version.json (una sola vez, sin polling)
//    3. SW en estado 'installed' → NO se aplica aún; se marca updatePending
//    4. Siguiente vez que el usuario vuelve al foreground (hidden→visible):
//       se envía SKIP_WAITING → controllerchange → reload
//    5. Para el usuario: abre la app, ya está actualizada. Sin toast, sin flash.
//    6. Si hay turno activo: espera a que termine antes de aplicar
//    7. Fallback: si updatePending lleva > 10 min y no hay turno activo,
//       aplica en el próximo ciclo de inactividad
//    8. Reload fantasma: detectado con sessionStorage + tope de 2 intentos
//    9. Modo nuclear: window._mtHardReset()
// ════════════════════════════════════════════════════════════════

(function () {
  if (!('serviceWorker' in navigator)) return;

  var MIN_CHECK_GAP_MS = 60 * 1000; // mínimo 60 s entre reg.update() calls
  var HIDE_THRESHOLD_MS = 60 * 1000; // visibilitychange solo si oculto > 60 s
  var FALLBACK_APPLY_MS = 10 * 60 * 1000; // si no hay hide/show, aplicar a los 10 min

  var localVersion = null; // versión al arrancar (capturada de version.json al detectar updatefound)
  var refreshing = false;
  var swReg = null;
  var lastCheckAt = 0;
  var hiddenSince = 0;
  var updatePending = false; // hay un SW instalado esperando tomar control
  var fallbackTimer = null;

  // ── Claves de sessionStorage para ghost-reload detection ──
  var PENDING_KEY = 'mt_pending_update';
  var TARGET_KEY = 'mt_pending_target';
  var ATTEMPT_KEY = 'mt_pending_attempts';

  // ── Boot: detectar reload fantasma con tope de 2 intentos ──
  (function detectStaleReload() {
    try {
      var pending = sessionStorage.getItem(PENDING_KEY);
      var target = sessionStorage.getItem(TARGET_KEY);
      var attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
      var current = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : null;

      if (!pending || pending !== '1') return;

      if (target && current && target !== current) {
        if (attempts >= 2) {
          console.warn('[MT] abortando ciclo de actualización tras 2 intentos fallidos');
          sessionStorage.removeItem(PENDING_KEY);
          sessionStorage.removeItem(TARGET_KEY);
          sessionStorage.removeItem(ATTEMPT_KEY);
          return;
        }
        sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1));
        console.warn(
          '[MT] reload fantasma (intento',
          attempts + 1,
          '): esperaba',
          target,
          'estoy en',
          current
        );
        setTimeout(function () {
          hardReset();
        }, 600);
      } else {
        sessionStorage.removeItem(PENDING_KEY);
        sessionStorage.removeItem(TARGET_KEY);
        sessionStorage.removeItem(ATTEMPT_KEY);
      }
    } catch (_) {}
  })();

  function hayTurnoActivo() {
    try {
      return !!window.__mtTurnoActivo;
    } catch (_) {
      return false;
    }
  }

  // ── Aplicar la actualización pendiente ──
  // Envía SKIP_WAITING al SW en estado 'waiting'; controllerchange hará el reload.
  function applyPendingUpdate() {
    if (refreshing || !swReg) return;
    if (!swReg.waiting) {
      updatePending = false;
      return;
    }
    if (hayTurnoActivo()) return; // esperar a que termine el turno
    clearTimeout(fallbackTimer);
    swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
    // controllerchange → reload
  }

  // ── Reload limpio sin toast ──
  function doReload(targetVersion) {
    if (refreshing) return;
    refreshing = true;
    try {
      sessionStorage.setItem(PENDING_KEY, '1');
      if (targetVersion) sessionStorage.setItem(TARGET_KEY, targetVersion);
    } catch (_) {}
    window.location.replace(window.location.pathname + '?_=' + Date.now() + window.location.hash);
  }

  // ── controllerchange: nuevo SW tomó control → reload ──
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    doReload(localVersion);
  });

  // ── Modo nuclear ──
  function hardReset(toastMsg) {
    if (refreshing) return;
    refreshing = true;
    if (toastMsg) {
      try {
        _flashToast(toastMsg, 2000);
      } catch (_) {}
    }

    var jobs = [];
    if (window.caches && caches.keys) {
      jobs.push(
        caches
          .keys()
          .then(function (keys) {
            return Promise.all(
              keys.map(function (k) {
                return caches.delete(k);
              })
            );
          })
          .catch(function () {})
      );
    }
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      jobs.push(
        navigator.serviceWorker
          .getRegistrations()
          .then(function (regs) {
            return Promise.all(
              regs.map(function (r) {
                return r.unregister().catch(function () {
                  return false;
                });
              })
            );
          })
          .catch(function () {})
      );
    }
    Promise.all(jobs)
      .then(function () {
        window.location.replace(
          window.location.pathname + '?nuke=' + Date.now() + window.location.hash
        );
      })
      .catch(function () {
        window.location.replace(window.location.pathname + '?nuke=' + Date.now());
      });
  }
  window._mtHardReset = hardReset;

  // ── Llamar reg.update() para que el browser busque cambios en sw.js ──
  function checkForUpdate(force) {
    var now = Date.now();
    if (!force && now - lastCheckAt < MIN_CHECK_GAP_MS) return;
    lastCheckAt = now;
    if (!swReg) {
      if (force) doReload(localVersion);
      return;
    }
    swReg.update().catch(function () {});
    // Si hay update pendiente y se forzó el check, intentar aplicar ahora
    if (force && updatePending && !hayTurnoActivo()) {
      applyPendingUpdate();
    }
  }
  window._mtCheckUpdate = checkForUpdate;

  // ── Registro ──
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('sw.js')
      .then(function (reg) {
        swReg = reg;
        console.log('[MT] SW registered', reg.scope);

        // Si ya hay un SW esperando de una sesión anterior, aplicarlo ahora
        // (el usuario acaba de abrir la app — momento ideal, no interrumpe nada)
        if (reg.waiting && navigator.serviceWorker.controller) {
          // Capturar versión objetivo antes de aplicar
          fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
            .then(function (r) {
              return r.json();
            })
            .then(function (j) {
              if (j && j.v) localVersion = j.v;
            })
            .catch(function () {})
            .then(function () {
              updatePending = true;
              applyPendingUpdate();
            });
          return;
        }

        // Escuchar nuevas actualizaciones encontradas durante esta sesión
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;

          // Capturar la versión objetivo una sola vez (para ghost-reload detection)
          fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
            .then(function (r) {
              return r.json();
            })
            .then(function (j) {
              if (j && j.v) localVersion = j.v;
            })
            .catch(function () {});

          nw.addEventListener('statechange', function () {
            // SW instalado y listo, con controller activo (no es first install)
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              updatePending = true;

              // Fallback: si el usuario no oculta la app en 10 min, aplicar igual
              clearTimeout(fallbackTimer);
              fallbackTimer = setTimeout(function () {
                if (updatePending && !hayTurnoActivo()) {
                  applyPendingUpdate();
                }
              }, FALLBACK_APPLY_MS);
            }
          });
        });

        // Disparar primer check de update (detecta si sw.js cambió desde last visit)
        swReg.update().catch(function () {});
      })
      .catch(function (err) {
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          console.warn('[MT] El Service Worker requiere HTTPS o localhost.');
        } else {
          console.warn('[MT] Error al registrar SW:', err);
        }
      });
  });

  // ── Escuchar mensajes del SW (SW_ACTIVATED para diagnóstico) ──
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'SW_ACTIVATED') {
      console.log('[MT] SW activado:', e.data.version);
    }
  });

  // ── visibilitychange: momento ideal para aplicar updates silenciosamente ──
  document.addEventListener(
    'visibilitychange',
    function () {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now();
      } else if (document.visibilityState === 'visible') {
        var hiddenFor = hiddenSince ? Date.now() - hiddenSince : 0;
        hiddenSince = 0;

        // Si hay update pendiente: usuario acaba de "abrir" la app → aplicar
        // Este es el momento más invisible posible para el usuario.
        if (updatePending) {
          if (!hayTurnoActivo()) {
            applyPendingUpdate();
            return;
          }
          // Turno activo: esperar, pero avisar sutilmente
          try {
            _flashToast('Actualización lista · se aplicará al finalizar el turno', 4000);
          } catch (_) {}
        }

        // Si estuvo oculto suficiente, buscar nuevas actualizaciones
        if (hiddenFor >= HIDE_THRESHOLD_MS) {
          checkForUpdate(false);
        }
      }
    },
    { passive: true }
  );

  // ── Aprovechar el evento online para buscar updates después de offline ──
  window.addEventListener(
    'online',
    function () {
      checkForUpdate(false);
    },
    { passive: true }
  );

  // ── Toast mínimo (solo para casos excepcionales: turno activo, nuke) ──
  function _flashToast(msg, durationMs) {
    if (document.getElementById('mt-upd-flash')) return;
    if (!document.getElementById('mt-upd-flash-style')) {
      var s = document.createElement('style');
      s.id = 'mt-upd-flash-style';
      s.textContent =
        '@keyframes mtUpdFlashIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}' +
        'to{opacity:1;transform:translateX(-50%) translateY(0)}}' +
        '@keyframes mtUpdFlashOut{to{opacity:0;transform:translateX(-50%) translateY(12px)}}';
      document.head.appendChild(s);
    }
    var t = document.createElement('div');
    t.id = 'mt-upd-flash';
    t.textContent = msg;
    t.setAttribute(
      'style',
      'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);' +
        'background:var(--accent,#5b86e5);color:#fff;font-family:inherit;' +
        'font-size:13px;font-weight:600;padding:10px 16px;border-radius:18px;' +
        'box-shadow:0 4px 24px rgba(91,134,229,0.4);z-index:99999;' +
        'animation:mtUpdFlashIn .28s ease both;max-width:calc(100vw - 40px);' +
        'text-align:center'
    );
    document.body.appendChild(t);
    if (durationMs) {
      setTimeout(function () {
        if (t.parentNode) {
          t.style.animation = 'mtUpdFlashOut .25s ease forwards';
          setTimeout(function () {
            if (t.parentNode) t.remove();
          }, 260);
        }
      }, durationMs);
    }
  }
})();


// ── js/app/init.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/init.js
//  Renderizado del componente Root
// ════════════════════════════════════════════════════════════════
// Inicio de la aplicación
try {
  // Test de dependencias críticas antes de arrancar
  console.log('[MT] Verificando entorno...');
  var deps = {
    React: !!window.React,
    ReactDOM: !!window.ReactDOM,
    Supabase: !!window.supabase || !!window.SUPA,
    Root: typeof Root !== 'undefined',
    Calculator: typeof doCalc !== 'undefined'
  };
  console.table(deps);

  if (window.React && window.ReactDOM && typeof Root !== 'undefined') {
    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(Root, null)
    );
    console.log('[MT] App montada con éxito.');
  } else {
    var missing = Object.keys(deps)
      .filter(function (k) { return !deps[k]; })
      .join(', ');
    throw new Error('Faltan dependencias críticas: ' + (missing || 'React/Root'));
  }
} catch (e) {
  // Retira el splash inicial: si no, su z-index taparía este mensaje.
  var sp = document.getElementById('initSplash');
  if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;font-family:-apple-system,sans-serif;text-align:center">' +
    '<div style="font-size:44px;margin-bottom:14px">⚠</div>' +
    '<div style="font-size:17px;font-weight:700;margin-bottom:6px">Error al iniciar</div>' +
    '<div style="font-size:12.5px;opacity:0.6">' + e.message + '</div></div>';
}


// ── js/app/install-prompt.js ──
// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/install-prompt.js
//  Prompt de instalación PWA — híbrido iOS / Android
//
//  Android: captura beforeinstallprompt → banner tuyo → diálogo
//           nativo del sistema al tocar (parece del SO, no de la app)
//  iOS:     bottom-sheet a colores de Mi Turno con 3 pasos
//
//  Lógica de aparición:
//   - Solo si la app NO está ya instalada (display-mode standalone)
//   - Solo si el usuario no la descartó antes (mt_install_dismissed)
//   - Solo después del 2do uso (mt_open_count >= 2)
//   - Solo una vez por sesión de pantalla
// ════════════════════════════════════════════════════════════════

(function () {
  // ── Detección de entorno ──────────────────────────────────────
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) return; // ya instalada, nada que hacer

  var dismissed = leer('mt_install_dismissed', false);
  if (dismissed) return;

  var openCount = parseInt(leer('mt_open_count', '0'), 10) || 0;
  openCount += 1;
  grabar('mt_open_count', String(openCount));

  if (openCount < 2) return; // primer uso: no molestar

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isAndroid = /android/i.test(navigator.userAgent);

  if (!isIOS && !isAndroid) return; // desktop: no aplica

  // ── Estado compartido ─────────────────────────────────────────
  var _deferredPrompt = null; // evento beforeinstallprompt guardado
  var _shown = false; // evitar doble render por sesión

  // Capturamos el evento nativo de Android antes de que el browser
  // lo muestre por su cuenta, así controlamos cuándo aparece.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    _deferredPrompt = e;
    if (!_shown) _tryShow();
  });

  // iOS no dispara beforeinstallprompt: mostramos directo
  if (isIOS) {
    // Pequeño delay para que la app termine de cargar visualmente
    setTimeout(function () {
      if (!_shown) _tryShow();
    }, 2800);
  }

  function _tryShow() {
    // Doble chequeo por si algo cambió mientras esperábamos el delay
    if (leer('mt_install_dismissed', false)) return;
    if (_shown) return;
    _shown = true;
    _renderPrompt();
  }

  function _dismiss() {
    grabar('mt_install_dismissed', true);
    var el = document.getElementById('mt-install-prompt');
    if (el) {
      el.style.transform = 'translateY(110%)';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 380);
    }
  }

  // ── Android: lanza el diálogo nativo ─────────────────────────
  function _triggerAndroid() {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(function (result) {
      _deferredPrompt = null;
      if (result.outcome === 'accepted') {
        grabar('mt_install_dismissed', true);
      }
      _dismiss();
    });
  }

  // ── Render ────────────────────────────────────────────────────
  function _renderPrompt() {
    var container = document.createElement('div');
    container.id = 'mt-install-prompt';

    // Overlay semitransparente solo en iOS (bottom-sheet necesita contexto)
    if (isIOS) {
      Object.assign(container.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '8500',
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'opacity 0.35s ease',
        opacity: '0'
      });
    } else {
      // Android: solo el banner en la parte inferior, sin overlay
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: '8500',
        transition: 'transform 0.38s cubic-bezier(.22,.8,.36,1), opacity 0.38s ease',
        transform: 'translateY(110%)',
        opacity: '0'
      });
    }

    document.body.appendChild(container);

    // Forzar reflow para que la transición de entrada se vea
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (isIOS) {
          container.style.opacity = '1';
        } else {
          container.style.transform = 'translateY(0)';
          container.style.opacity = '1';
        }
      });
    });

    if (isAndroid) {
      _renderAndroidBanner(container);
    } else {
      _renderIOSSheet(container);
      // Tocar fuera del sheet cierra
      container.addEventListener('click', function (e) {
        if (e.target === container) _dismiss();
      });
    }
  }

  // ── Banner Android ────────────────────────────────────────────
  function _renderAndroidBanner(container) {
    var banner = document.createElement('div');
    Object.assign(banner.style, {
      background: 'var(--surface, #fff)',
      borderTop: '1px solid var(--border, rgba(0,0,0,.09))',
      borderRadius: '20px 20px 0 0',
      padding: '16px 16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.13)'
    });

    // Ícono app
    var ico = document.createElement('img');
    ico.src = 'icon-192.png';
    ico.alt = 'Mi Turno';
    Object.assign(ico.style, {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      flexShrink: '0'
    });

    // Textos
    var texts = document.createElement('div');
    texts.style.flex = '1';
    var title = document.createElement('div');
    title.textContent = 'Agregar Mi Turno al inicio';
    Object.assign(title.style, {
      fontWeight: '700',
      fontSize: '15px',
      color: 'var(--text-1, #111)',
      marginBottom: '2px'
    });
    var sub = document.createElement('div');
    sub.textContent = 'Se abre al instante · funciona sin internet';
    Object.assign(sub.style, {
      fontSize: '13px',
      color: 'var(--text-2, #666)'
    });
    texts.appendChild(title);
    texts.appendChild(sub);

    // Botón instalar
    var btnInstall = document.createElement('button');
    btnInstall.textContent = 'Instalar';
    Object.assign(btnInstall.style, {
      background: 'var(--accent, #4f73f8)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      padding: '9px 18px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      flexShrink: '0',
      fontFamily: 'inherit'
    });
    btnInstall.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _triggerAndroid();
    });

    // X cerrar
    var btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    Object.assign(btnClose.style, {
      background: 'none',
      border: 'none',
      color: 'var(--text-2, #888)',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      flexShrink: '0',
      fontFamily: 'inherit',
      lineHeight: '1'
    });
    btnClose.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _dismiss();
    });

    banner.appendChild(ico);
    banner.appendChild(texts);
    banner.appendChild(btnInstall);
    banner.appendChild(btnClose);
    container.appendChild(banner);
  }

  // ── Bottom-sheet iOS ──────────────────────────────────────────
  function _renderIOSSheet(container) {
    var sheet = document.createElement('div');
    Object.assign(sheet.style, {
      background: 'var(--surface, #fff)',
      borderRadius: '24px 24px 0 0',
      padding: '0 0 40px',
      width: '100%',
      boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      transform: 'translateY(60px)',
      transition: 'transform 0.38s cubic-bezier(.22,.8,.36,1)',
      maxHeight: '85vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    });

    // Animar la hoja hacia arriba
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.style.transform = 'translateY(0)';
      });
    });

    // Handle
    var handle = document.createElement('div');
    Object.assign(handle.style, {
      width: '36px',
      height: '4px',
      background: 'var(--border, rgba(0,0,0,.15))',
      borderRadius: '2px',
      margin: '12px auto 0'
    });

    // Header
    var header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px 12px'
    });
    var hTitle = document.createElement('div');
    hTitle.textContent = 'Agregar a inicio';
    Object.assign(hTitle.style, {
      fontWeight: '700',
      fontSize: '17px',
      color: 'var(--text-1, #111)'
    });
    var btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    Object.assign(btnClose.style, {
      background: 'var(--surface2, #f0f0f0)',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      fontSize: '14px',
      cursor: 'pointer',
      color: 'var(--text-2, #666)',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    btnClose.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _dismiss();
    });
    header.appendChild(hTitle);
    header.appendChild(btnClose);

    // Cuerpo
    var body = document.createElement('div');
    body.style.padding = '4px 20px 0';

    // Por qué
    var why = document.createElement('div');
    Object.assign(why.style, {
      fontSize: '14px',
      color: 'var(--text-2, #555)',
      lineHeight: '1.5',
      marginBottom: '24px'
    });
    why.textContent =
      'Se abre como una app normal, sin el navegador, ocupa casi nada y funciona sin internet.';
    body.appendChild(why);

    // Pasos
    var pasos = [
      { ico: '⬆️', txt: 'Tocá el botón Compartir de la barra de abajo' },
      { ico: '➕', txt: 'Deslizá y elegí "Añadir a pantalla de inicio"' },
      { ico: '✅', txt: 'Tocá "Añadir" y listo — ¡ya aparece en tu inicio!' }
    ];

    pasos.forEach(function (paso, i) {
      var row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        marginBottom: i < pasos.length - 1 ? '20px' : '0'
      });

      var num = document.createElement('div');
      Object.assign(num.style, {
        minWidth: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'var(--accent, #4f73f8)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
        flexShrink: '0'
      });
      num.textContent = String(i + 1);

      var content = document.createElement('div');
      content.style.paddingTop = '3px';

      var icoEl = document.createElement('div');
      icoEl.style.fontSize = '20px';
      icoEl.style.marginBottom = '3px';
      icoEl.textContent = paso.ico;

      var txtEl = document.createElement('div');
      Object.assign(txtEl.style, {
        fontSize: '15px',
        color: 'var(--text-1, #111)',
        lineHeight: '1.4'
      });
      txtEl.textContent = paso.txt;

      content.appendChild(icoEl);
      content.appendChild(txtEl);
      row.appendChild(num);
      row.appendChild(content);
      body.appendChild(row);
    });

    // Nota Safari-only
    var nota = document.createElement('div');
    Object.assign(nota.style, {
      marginTop: '20px',
      padding: '12px 14px',
      background: 'var(--accent-dim, rgba(79,115,248,.08))',
      border: '1px solid var(--accent, #4f73f8)',
      borderRadius: '12px',
      fontSize: '13px',
      color: 'var(--accent, #4f73f8)',
      lineHeight: '1.45'
    });
    nota.textContent =
      'Disponible desde Safari y Chrome en iPhone. Si usás otro navegador, abrí la app en uno de estos dos.';
    body.appendChild(nota);

    sheet.appendChild(handle);
    sheet.appendChild(header);
    sheet.appendChild(body);
    container.appendChild(sheet);
  }
})();


})();
