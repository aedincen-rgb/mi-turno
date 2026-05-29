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
