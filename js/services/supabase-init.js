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

  // Detecta errores de autenticación (token expirado, anon key inválida).
  // Distinto de errores de red: un 401/403 es permanente hasta que el
  // usuario vuelva a loguearse; un error de fetch es temporal.
  function _esErrorDeAuthCloud(err) {
    if (!err) return false;
    var code = err.code || err.status || 0;
    if (code === 400 || code === 401 || code === 403) return true;
    var msg = (err.message || err.toString() || '').toLowerCase();
    return (
      msg.indexOf('jwt expired') >= 0 ||
      msg.indexOf('invalid api key') >= 0 ||
      msg.indexOf('invalid jwt') >= 0 ||
      msg.indexOf('token') >= 0 ||
      msg.indexOf('auth') >= 0 ||
      msg.indexOf('unauthorized') >= 0 ||
      msg.indexOf('forbidden') >= 0 ||
      msg.indexOf('not found') >= 0
    );
  }

  // Detecta errores de red (fetch, timeout, DNS).
  function _esErrorDeRedCloud(err) {
    if (!err) return false;
    var msg = (err.message || err.toString() || '').toLowerCase();
    return (
      msg.indexOf('fetch') >= 0 ||
      msg.indexOf('network') >= 0 ||
      msg.indexOf('timeout') >= 0 ||
      msg.indexOf('tiempo de espera') >= 0 ||
      msg.indexOf('load failed') >= 0
    );
  }

  // Prueba real de conectividad: hace una consulta ligera a la API REST
  // para verificar que el token es válido y Supabase responde. Un simple
  // getSession() no basta porque retorna datos cacheados aunque el token
  // esté expirado y el refresh haya fallado — eso dejaba CLOUD_MODE=true
  // con la API realmente rota y la cola de sync en bucle infinito.
  function _probarConexionReal() {
    return SUPA.from('perfiles').select('id', { count: 'exact', head: true });
  }

  function intentar(retries) {
    return withTimeout(
      _probarConexionReal().then(function () { return true; }),
      timeout,
      'Conexión Supabase'
    )
      .then(function () { return true; })
      .catch(function (e) {
        if (retries > 0) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              intentar(retries - 1).then(resolve);
            }, 1500);
          });
        }
        // Error de autenticación → desactivar todo (sin sesión válida
        // no se puede hacer nada contra Supabase hasta re-login).
        if (_esErrorDeAuthCloud(e)) {
          CLOUD_MODE = false;
          SUPA = null;
          CLOUD_ERROR = traducirError(e);
        } else if (_esErrorDeRedCloud(e)) {
          // Error de red: mantenemos SUPA vivo pero desactivamos
          // CLOUD_MODE para que la cola de sync no intente en bucle
          // infinito contra un backend inalcanzable. Cuando la red
          // vuelva, onOnline rehabilita el flujo.
          CLOUD_MODE = false;
          CLOUD_ERROR = 'Sin conexión al servidor';
        } else {
          // Fallo desconocido: ser conservadores y desactivar
          CLOUD_MODE = false;
          CLOUD_ERROR = traducirError(e);
        }
        return false;
      });
  }
  return intentar(maxRetries);
})();
