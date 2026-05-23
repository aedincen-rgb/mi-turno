// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js
//  Estrategia de actualización agresiva con recuperación nuclear:
//   1. Network-first del shell (en sw.js)
//   2. reg.update() periódico cada 5 min + al volver al foreground
//   3. Polling de /version.json para detectar releases
//   4. controllerchange → recarga con cache-buster (?_=ts)
//   5. Detección de "reload fantasma": si pedimos actualizar y al
//      bootear la versión sigue siendo la vieja, escalamos al modo
//      nuclear (borrar caches + unregister SW + reload con timestamp)
//   6. Modo nuclear expuesto en window._mtHardReset() para recovery
//      manual desde Ajustes o desde el error boundary.
//  Los datos del turno activo viven en localStorage y NO se borran,
//  ni siquiera en el modo nuclear.
// ════════════════════════════════════════════════════════════════

(function () {
  if (!('serviceWorker' in navigator)) return;

  var POLL_MS = 5 * 60 * 1000;
  var localVersion = null;
  var refreshing = false;
  var swReg = null;

  // ── Claves de estado de actualización ──
  var PENDING_KEY = 'mt_pending_update'; // sessionStorage flag
  var TARGET_KEY = 'mt_pending_target';  // versión esperada tras el reload

  // ── Boot: detectar reload fantasma ──
  // Si el ciclo anterior intentó actualizar a una versión X y al cargar
  // la versión local sigue siendo distinta a X, el SW de iOS quedó zombi.
  // Disparamos modo nuclear.
  (function detectStaleReload() {
    try {
      var pending = sessionStorage.getItem(PENDING_KEY);
      var target = sessionStorage.getItem(TARGET_KEY);
      var current = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : null;
      if (pending === '1' && target && current && target !== current) {
        // El reload pasado NO trajo la versión nueva → escalamos
        console.warn('[MT] reload fantasma detectado, esperaba', target, 'pero estoy en', current);
        sessionStorage.removeItem(PENDING_KEY);
        sessionStorage.removeItem(TARGET_KEY);
        // Diferimos al próximo tick para que la app pueda mostrar al menos
        // el splash, evitando un loop nuclear ciego.
        setTimeout(function () { hardReset('Aplicando actualización…'); }, 600);
      } else if (pending === '1') {
        // Llegó la versión esperada — limpieza
        sessionStorage.removeItem(PENDING_KEY);
        sessionStorage.removeItem(TARGET_KEY);
      }
    } catch (_) {}
  })();

  // ── Reload "normal" con cache-buster ──
  function softReload(targetVersion) {
    if (refreshing) return;
    refreshing = true;
    try {
      sessionStorage.setItem(PENDING_KEY, '1');
      if (targetVersion) sessionStorage.setItem(TARGET_KEY, targetVersion);
    } catch (_) {}
    try { _flashToast('Actualizando a la última versión…'); } catch (_) {}
    setTimeout(function () {
      // location.replace evita que la página vieja quede en el history,
      // y el query string fuerza una navegación nueva (no "back-forward cache").
      var url = window.location.pathname + '?_=' + Date.now() + window.location.hash;
      window.location.replace(url);
    }, 400);
  }

  // ── Modo nuclear: borrar todo y recargar ──
  // Usado cuando el reload normal no aplicó la nueva versión (iOS zombi)
  // o cuando el usuario lo pide manualmente desde Ajustes.
  function hardReset(toastMsg) {
    if (refreshing) return;
    refreshing = true;
    try { _flashToast(toastMsg || 'Reiniciando app…'); } catch (_) {}

    var jobs = [];
    // 1. Borrar TODOS los caches del SW
    if (window.caches && caches.keys) {
      jobs.push(
        caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        }).catch(function () {})
      );
    }
    // 2. Desregistrar TODOS los SW
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      jobs.push(
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (r) {
            return r.unregister().catch(function () { return false; });
          }));
        }).catch(function () {})
      );
    }

    Promise.all(jobs).then(function () {
      // 3. Reload con timestamp único — iOS no puede ignorar esto
      var url = window.location.pathname + '?nuke=' + Date.now() + window.location.hash;
      window.location.replace(url);
    }).catch(function () {
      window.location.replace(window.location.pathname + '?nuke=' + Date.now());
    });
  }
  window._mtHardReset = hardReset;

  // ── Recarga única cuando un nuevo SW toma control ──
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    softReload(localVersion);
  });

  // ── Consulta /version.json ──
  function pollVersion() {
    if (!swReg) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.v) return;
        if (localVersion === null) { localVersion = j.v; return; }
        if (j.v !== localVersion) {
          localVersion = j.v;
          swReg.update().catch(function () {});
        }
      })
      .catch(function () {});
  }

  function checkForUpdate(force) {
    if (!swReg) {
      if (force) softReload(localVersion);
      return;
    }
    swReg.update().catch(function () {});
    pollVersion();
    if (force) {
      try { _flashToast('Buscando nueva versión…'); } catch (_) {}
      // Si en 2.5s no hubo controllerchange, hacemos soft reload de respaldo.
      // Si tras ese soft reload todavía no aplica, la detección de boot
      // escalará al modo nuclear automáticamente.
      setTimeout(function () {
        if (!refreshing) softReload(localVersion);
      }, 2500);
    }
  }
  window._mtCheckUpdate = checkForUpdate;

  // ── Registro ──
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
      .then(function (reg) {
        swReg = reg;
        console.log('[MT] SW registered', reg.scope);

        pollVersion();

        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        setInterval(checkForUpdate, POLL_MS);
      })
      .catch(function (err) {
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          console.warn('[MT] El Service Worker requiere HTTPS o localhost.');
        } else {
          console.warn('[MT] Error al registrar SW:', err);
        }
      });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkForUpdate();
  }, { passive: true });
  window.addEventListener('focus', checkForUpdate, { passive: true });

  function _flashToast(msg) {
    if (document.getElementById('mt-upd-flash')) return;
    if (!document.getElementById('mt-upd-flash-style')) {
      var s = document.createElement('style');
      s.id = 'mt-upd-flash-style';
      s.textContent =
        '@keyframes mtUpdFlashIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}' +
        'to{opacity:1;transform:translateX(-50%) translateY(0)}}';
      document.head.appendChild(s);
    }
    var t = document.createElement('div');
    t.id = 'mt-upd-flash';
    t.textContent = msg;
    t.setAttribute('style',
      'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);' +
      'background:var(--accent,#5b86e5);color:#fff;font-family:inherit;' +
      'font-size:13px;font-weight:600;padding:10px 16px;border-radius:18px;' +
      'box-shadow:0 4px 24px rgba(91,134,229,0.4);z-index:99999;' +
      'animation:mtUpdFlashIn .28s ease both');
    document.body.appendChild(t);
  }
})();
