// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js
//  Estrategia de actualización agresiva PERO respetuosa (v28):
//   1. Network-first del shell (en sw.js)
//   2. reg.update() periódico cada 15 min (antes 5) + al volver
//      al foreground SI estuvo oculto > 60 s
//   3. Throttle global: nunca dos checks en menos de 60 s
//   4. Polling de /version.json para detectar releases
//   5. controllerchange → softReload con cache-buster (?_=ts)
//      pero DIFERIDO hasta 30 s si hay turno activo
//   6. Detección de "reload fantasma": si tras 2 intentos
//      consecutivos no cambia la versión, mostramos error en vez
//      de seguir nukeando
//   7. Modo nuclear expuesto en window._mtHardReset()
//  Los datos del turno activo viven en localStorage y NO se borran,
//  ni siquiera en el modo nuclear.
// ════════════════════════════════════════════════════════════════

(function () {
  if (!('serviceWorker' in navigator)) return;

  var POLL_MS = 15 * 60 * 1000;     // 15 min (antes 5)
  var MIN_CHECK_GAP_MS = 60 * 1000; // mínimo 60 s entre checks
  var HIDE_THRESHOLD_MS = 60 * 1000; // visibilitychange solo si estuvo oculto > 60 s
  var ACTIVE_TURN_DEFER_MS = 30 * 1000; // si hay turno activo, espera 30 s antes de reload

  var localVersion = null;
  var refreshing = false;
  var swReg = null;
  var lastCheckAt = 0;
  var hiddenSince = 0;

  // ── Claves de estado ──
  var PENDING_KEY = 'mt_pending_update';
  var TARGET_KEY = 'mt_pending_target';
  var ATTEMPT_KEY = 'mt_pending_attempts'; // contador para cortar el loop

  // ── Boot: detectar reload fantasma con tope de intentos ──
  (function detectStaleReload() {
    try {
      var pending = sessionStorage.getItem(PENDING_KEY);
      var target = sessionStorage.getItem(TARGET_KEY);
      var attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
      var current = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : null;

      if (!pending || pending !== '1') return;

      if (target && current && target !== current) {
        // Mismatch → escalar, pero solo si no superamos el tope
        if (attempts >= 2) {
          // 2 intentos sin éxito: probablemente el servidor no tiene la
          // nueva versión todavía. Limpiamos y abortamos el ciclo.
          console.warn('[MT] abortando ciclo de actualización tras 2 intentos fallidos');
          sessionStorage.removeItem(PENDING_KEY);
          sessionStorage.removeItem(TARGET_KEY);
          sessionStorage.removeItem(ATTEMPT_KEY);
          return;
        }
        sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1));
        console.warn('[MT] reload fantasma (intento', attempts + 1, '): esperaba', target, 'estoy en', current);
        setTimeout(function () { hardReset('Aplicando actualización…'); }, 600);
      } else {
        // Match o sin target: limpieza normal
        sessionStorage.removeItem(PENDING_KEY);
        sessionStorage.removeItem(TARGET_KEY);
        sessionStorage.removeItem(ATTEMPT_KEY);
      }
    } catch (_) {}
  })();

  // ── ¿Hay turno activo? Defer el reload para no interrumpirlo ──
  function hayTurnoActivo() {
    try {
      // El app expone __mtTurnoActivo = true/false; cae a false si no está
      return !!window.__mtTurnoActivo;
    } catch (_) { return false; }
  }

  // ── Reload "normal" con cache-buster y defer si turno activo ──
  function softReload(targetVersion) {
    if (refreshing) return;
    refreshing = true;
    var doReload = function () {
      try {
        sessionStorage.setItem(PENDING_KEY, '1');
        if (targetVersion) sessionStorage.setItem(TARGET_KEY, targetVersion);
      } catch (_) {}
      var url = window.location.pathname + '?_=' + Date.now() + window.location.hash;
      window.location.replace(url);
    };
    if (hayTurnoActivo()) {
      // No interrumpimos un turno activo: mostramos aviso y esperamos
      try { _flashToast('Actualización lista — se aplicará al finalizar el turno', 5000); } catch (_) {}
      setTimeout(function () {
        if (hayTurnoActivo()) {
          // Sigue activo: reintenta después
          refreshing = false;
          setTimeout(function () { softReload(targetVersion); }, ACTIVE_TURN_DEFER_MS);
        } else {
          doReload();
        }
      }, ACTIVE_TURN_DEFER_MS);
      return;
    }
    try { _flashToast('Actualizando a la última versión…'); } catch (_) {}
    setTimeout(doReload, 400);
  }

  // ── Modo nuclear ──
  function hardReset(toastMsg) {
    if (refreshing) return;
    refreshing = true;
    try { _flashToast(toastMsg || 'Reiniciando app…'); } catch (_) {}

    var jobs = [];
    if (window.caches && caches.keys) {
      jobs.push(
        caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        }).catch(function () {})
      );
    }
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
      var url = window.location.pathname + '?nuke=' + Date.now() + window.location.hash;
      window.location.replace(url);
    }).catch(function () {
      window.location.replace(window.location.pathname + '?nuke=' + Date.now());
    });
  }
  window._mtHardReset = hardReset;

  // ── Recarga cuando un nuevo SW toma control ──
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    softReload(localVersion);
  });

  // ── Polling de /version.json ──
  function pollVersion() {
    if (!swReg) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r || !r.ok) {
          if (r) console.warn('[MT] version.json HTTP', r.status);
          return null;
        }
        return r.json();
      })
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
    var now = Date.now();
    if (!force && now - lastCheckAt < MIN_CHECK_GAP_MS) return;
    lastCheckAt = now;
    if (!swReg) {
      if (force) softReload(localVersion);
      return;
    }
    swReg.update().catch(function () {});
    pollVersion();
    if (force) {
      try { _flashToast('Buscando nueva versión…'); } catch (_) {}
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

        setInterval(function () { checkForUpdate(false); }, POLL_MS);
      })
      .catch(function (err) {
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          console.warn('[MT] El Service Worker requiere HTTPS o localhost.');
        } else {
          console.warn('[MT] Error al registrar SW:', err);
        }
      });
  });

  // ── visibilitychange: SOLO si estuvo oculto > HIDE_THRESHOLD_MS ──
  // Antes disparábamos en CADA cambio de visibilidad, que en iOS pasa
  // muy seguido (teclado, sheets del sistema, etc.) y eso saturaba el
  // ciclo de updates.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      hiddenSince = Date.now();
    } else if (document.visibilityState === 'visible') {
      var hiddenFor = hiddenSince ? Date.now() - hiddenSince : 0;
      if (hiddenFor >= HIDE_THRESHOLD_MS) {
        checkForUpdate(false);
      }
      hiddenSince = 0;
    }
  }, { passive: true });

  // ── Toast (no depende de React) ──
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
    t.setAttribute('style',
      'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);' +
      'background:var(--accent,#5b86e5);color:#fff;font-family:inherit;' +
      'font-size:13px;font-weight:600;padding:10px 16px;border-radius:18px;' +
      'box-shadow:0 4px 24px rgba(91,134,229,0.4);z-index:99999;' +
      'animation:mtUpdFlashIn .28s ease both;max-width:calc(100vw - 40px);' +
      'text-align:center');
    document.body.appendChild(t);
    if (durationMs) {
      setTimeout(function () {
        if (t.parentNode) {
          t.style.animation = 'mtUpdFlashOut .25s ease forwards';
          setTimeout(function () { if (t.parentNode) t.remove(); }, 260);
        }
      }, durationMs);
    }
  }
})();
