// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/error-logger.js
//  Captura de errores de runtime: almacenamiento local + envío a Supabase.
//  Consolidado: antes existía un duplicado en js/services/error-logger.js
//  que sobreescribía window.onerror y rompía el visor de diagnóstico.
// ════════════════════════════════════════════════════════════════

var _errorLogsKey = 'mt_error_logs';
var _maxLogs = 50; // Máximo de errores a almacenar
var _errors = []; // Cache en memoria
var _listeners = []; // Listeners para notificar cambios

// ── Envío a Supabase (batch, no bloqueante) ────────────────────
var _supaQueue = [];
var _supaProcessing = false;

function _shouldLogToSupa(message) {
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

function _getStackTrace(error) {
  if (!error || !error.stack) return '';
  return error.stack.substring(0, 500);
}

function _flushSupaLogs() {
  if (_supaQueue.length === 0 || !window.SUPA || !isOnline()) {
    _supaProcessing = false;
    return;
  }
  _supaProcessing = true;

  setTimeout(function () {
    var batch = _supaQueue.splice(0, 10);
    window.SUPA.from('error_logs')
      .insert(batch)
      .then(function () {
        _supaProcessing = false;
        if (_supaQueue.length > 0) _flushSupaLogs();
      })
      .catch(function () {
        _supaProcessing = false;
      });
  }, 50);
}

function _enqueueSupaError(errorData) {
  if (!window.SUPA || !isOnline()) return;
  _supaQueue.push(errorData);
  if (!_supaProcessing) _flushSupaLogs();
}

// ── Almacenamiento local ──────────────────────────────────────

function _loadLogs() {
  try {
    var stored = leer(_errorLogsKey, []);
    _errors = Array.isArray(stored) ? stored : [];
    _errors.forEach(function (e) {
      if (!e.id) e.id = generateUUID();
    });
    _errors = _errors.slice(-_maxLogs);
  } catch (e) {
    _errors = [];
  }
}

function _saveLogs() {
  try {
    grabar(_errorLogsKey, _errors);
  } catch (e) {}
}

function _notifyListeners() {
  _listeners.forEach(function (cb) {
    cb(_errors);
  });
}

// ── API pública ───────────────────────────────────────────────

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
    online: navigator.onLine,
    url: window.location.href,
    ua: navigator.userAgent.split(' ').pop()
  };

  _errors.push(newError);
  _errors = _errors.slice(-_maxLogs);
  _saveLogs();
  _notifyListeners();

  // Envío a Supabase si aplica (fire-and-forget)
  if (_shouldLogToSupa(newError.message)) {
    var uid = null;
    try {
      var sess = leer('mt_sess');
      if (sess) {
        var parsed = JSON.parse(sess);
        uid = parsed.user ? parsed.user.id : null;
      }
    } catch (_) {}

    _enqueueSupaError({
      message: String(newError.message).substring(0, 255),
      source: newError.filename,
      line: newError.lineno,
      col: newError.colno,
      stack: newError.stack.substring(0, 500),
      version: window.MT_APP_VERSION || 'unknown',
      user_id: uid,
      ua: navigator.userAgent.substring(0, 255),
      url: window.location.pathname
    });
  }
}

function getErrors() {
  return _errors.slice();
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
  _listeners = _listeners.filter(function (cb) {
    return cb !== callback;
  });
}

// ── Inicialización ────────────────────────────────────────────

function initErrorLogger() {
  _loadLogs();

  window.onerror = function (message, source, lineno, colno, error) {
    logError({
      message: message,
      filename: source,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : 'No stack trace available',
      type: 'error'
    });
    return false;
  };

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var msg =
      typeof reason === 'string'
        ? reason
        : reason && reason.message
          ? reason.message
          : String(reason);

    logError({
      message: 'Unhandled Promise: ' + String(msg).substring(0, 220),
      stack: reason && reason.stack ? reason.stack : 'No stack trace available',
      filename: 'Promise Rejection',
      lineno: 0,
      colno: 0,
      type: 'unhandledrejection'
    });
  });
}

initErrorLogger();
