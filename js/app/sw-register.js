// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js
//  Estrategia de actualización agresiva (máxima cobertura):
//   1. Network-first del shell (en sw.js)
//   2. reg.update() periódico cada 5 min y al volver al foreground
//   3. Polling de /version.json para detectar releases sin tocar el SW
//   4. controllerchange → recarga automática silenciosa
//   5. Si llega nuevo SW, skipWaiting inmediato (sin banner)
//  Los datos del turno activo viven en localStorage, así que un
//  reload no pierde estado: al cargar se restaura desde dk(uid,'a').
// ════════════════════════════════════════════════════════════════

(function () {
  if (!('serviceWorker' in navigator)) return;

  var POLL_MS = 5 * 60 * 1000; // 5 minutos
  var localVersion = null;     // se setea con la primera lectura
  var refreshing = false;      // evita loops de recarga
  var swReg = null;

  // ── Recarga única cuando un nuevo SW toma control ──
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return;
    refreshing = true;
    // Pequeño toast efímero para que el usuario perciba el refresh
    try { _flashToast('Actualizando a la última versión…'); } catch (_) {}
    setTimeout(function () { window.location.reload(); }, 350);
  });

  // ── Consulta /version.json para detectar nuevo release ──
  // Aunque el SW se hubiera quedado pegado (iOS), esto fuerza un reg.update().
  function pollVersion() {
    if (!swReg) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.v) return;
        if (localVersion === null) { localVersion = j.v; return; }
        if (j.v !== localVersion) {
          localVersion = j.v;
          // Hay versión nueva en servidor → fuerza chequeo del SW
          swReg.update().catch(function () {});
        }
      })
      .catch(function () {});
  }

  function checkForUpdate() {
    if (!swReg) return;
    swReg.update().catch(function () {});
    pollVersion();
  }

  // ── Registro ──
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
      .then(function (reg) {
        swReg = reg;
        console.log('[MT] SW registered', reg.scope);

        // Primera lectura de versión (referencia local)
        pollVersion();

        // Auto-skipWaiting al detectar nuevo SW en estado 'installed'
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            // Solo aplica si ya había un SW controlando (no es primera carga)
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
              // El controllerchange listener arriba dispara el reload.
            }
          });
        });

        // Si ya hay un SW en espera al cargar (carrera con install), aplícalo
        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Chequeo periódico mientras la app está abierta
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

  // ── Re-check al volver al foreground (usuario regresa a la PWA) ──
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkForUpdate();
  }, { passive: true });

  // También en focus (algunos iOS no disparan visibilitychange consistente)
  window.addEventListener('focus', checkForUpdate, { passive: true });

  // ── Toast minimalista (no depende del estado React) ──
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
