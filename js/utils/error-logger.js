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
    _errors.forEach(function (e) {
      if (!e.id) e.id = generateUUID();
    });
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
  _listeners.forEach(function (cb) {
    cb(_errors);
  });
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
  _listeners = _listeners.filter(function (cb) {
    return cb !== callback;
  });
}

function initErrorLogger() {
  _loadLogs(); // Cargar logs existentes al iniciar
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
initErrorLogger(); // Inicializar el logger al cargar el script
