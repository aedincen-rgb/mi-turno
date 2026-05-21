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
