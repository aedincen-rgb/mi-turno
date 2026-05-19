// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/error-logger.js
//  Captura y gestiona errores de runtime offline
// ════════════════════════════════════════════════════════════════

var _errorLogsKey = 'mt_error_logs';
var _maxLogs = 50;
var _errors = [];
var _listeners = [];

function _loadLogs() {
  try {
    var stored = leer(_errorLogsKey, []);
    _errors = Array.isArray(stored) ? stored : [];
    _errors.forEach(e => {
      if (!e.id) e.id = generateUUID();
    });
    _errors = _errors.slice(-_maxLogs);
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
    online: navigator.onLine,
    url: window.location.href,
    ua: navigator.userAgent.split(' ').pop()
  };

  _errors.push(newError);
  _errors = _errors.slice(-_maxLogs);
  _saveLogs();
  _notifyListeners();
  console.error('[ErrorLogger] Error capturado:', newError);
}

function getErrors() {
  return _errors.slice();
}

function clearErrors() {
  _errors = [];
  _saveLogs();
  _notifyListeners();
}

function deleteError(id) {
  _errors = _errors.filter(e => e.id !== id);
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
  window.onunhandledrejection = function (event) {
    logError({
      message: event.reason
        ? event.reason.message || event.reason.toString()
        : 'Unhandled Rejection',
      stack: event.reason ? event.reason.stack : 'No stack trace available',
      filename: 'Promise Rejection',
      lineno: 0,
      colno: 0,
      type: 'unhandledrejection'
    });
    return false;
  };
}
initErrorLogger();
