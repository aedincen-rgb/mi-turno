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
      _onlineListeners.forEach(fn => fn());
    } else {
      _offlineListeners.forEach(fn => fn());
    }
  }
}

window.addEventListener('online', _updateOnlineStatus);
window.addEventListener('offline', _updateOnlineStatus);

function isOnline() { return _isOnline; }
function onOnline(callback) { _onlineListeners.push(callback); }
function onOffline(callback) { _offlineListeners.push(callback); }

function removeOnlineListener(callback) { _onlineListeners = _onlineListeners.filter(fn => fn !== callback); }
function removeOfflineListener(callback) { _offlineListeners = _offlineListeners.filter(fn => fn !== callback); }

/**
 * Wrapper de fetch que maneja el estado offline antes de intentar la petición.
 * @param {string} url 
 * @param {Object} options 
 */
async function fetchWithOfflineSupport(url, options) {
  if (!navigator.onLine) {
    return { 
      offline: true, 
      error: 'Sin conexión a internet. La operación se sincronizará cuando vuelvas a estar online.' 
    };
  }

  try {
    // Aplicamos un tiempo de espera para evitar que la app se quede bloqueada en el splash
    const response = await withTimeout(fetch(url, options), 10000, 'La conexión');
    return response;
  } catch (error) {
    console.warn('[MT] Fallback offline activado para:', url, error);
    return { offline: true, error: traducirError(error) };
  }
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
  if (low.indexOf('duplicate key') >= 0 || low.indexOf('unique constraint') >= 0 || low.indexOf('23505') >= 0)
    return 'Ya existe un registro con esa información única (ej. el PIN ya está en uso).';
  if (low.indexOf('database error') >= 0 || low.indexOf('pgrst') >= 0)
    return 'Error de base de datos. Los cambios se guardaron localmente.';
  return msg;
}
