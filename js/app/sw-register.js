// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js
//  Registro Service Worker + banner de actualización no bloqueante
// ════════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('sw.js')
      .then(function (reg) {
        console.log('[MT] SW registered', reg.scope);

        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function () {
            // Solo mostrar el banner si ya había un SW activo (= actualización real, no primera carga)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              _showUpdateBanner(newWorker);
            }
          });
        });
      })
      .catch(function (err) {
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          console.warn('[MT] El Service Worker requiere HTTPS o localhost.');
        } else {
          console.warn('[MT] Error al registrar SW. Revisa si sw.js existe en la raíz:', err);
        }
      });
  });
}

// ── Banner de actualización: no bloqueante, con animación de entrada ──
function _showUpdateBanner(newWorker) {
  if (document.getElementById('mt-update-banner')) return;

  // Inyectar keyframe una sola vez
  if (!document.getElementById('mt-upd-style')) {
    var s = document.createElement('style');
    s.id = 'mt-upd-style';
    s.textContent =
      '@keyframes mtSlideUp{' +
      'from{opacity:0;transform:translateX(-50%) translateY(20px)}' +
      'to{opacity:1;transform:translateX(-50%) translateY(0)}}' +
      '@keyframes mtFadeOut{' +
      'to{opacity:0;transform:translateX(-50%) translateY(12px)}}';
    document.head.appendChild(s);
  }

  var banner = document.createElement('div');
  banner.id = 'mt-update-banner';
  banner.setAttribute(
    'style',
    'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);' +
    'display:flex;align-items:center;gap:10px;' +
    'padding:11px 14px 11px 18px;border-radius:20px;' +
    'background:var(--accent,#5b86e5);color:#fff;' +
    'font-family:inherit;font-size:13.5px;font-weight:600;' +
    'box-shadow:0 4px 28px rgba(91,134,229,0.38);' +
    'z-index:9999;max-width:calc(100vw - 32px);white-space:nowrap;' +
    'animation:mtSlideUp 0.42s cubic-bezier(0.34,1.56,0.64,1) both'
  );

  var txt = document.createElement('span');
  txt.textContent = '✦ Nueva versión disponible';
  banner.appendChild(txt);

  var btnOk = document.createElement('button');
  btnOk.textContent = 'Actualizar';
  btnOk.setAttribute(
    'style',
    'background:rgba(255,255,255,0.22);border:none;color:#fff;' +
    'padding:5px 13px;border-radius:10px;cursor:pointer;' +
    'font-size:13px;font-weight:700;flex-shrink:0'
  );
  btnOk.addEventListener('click', function () {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  banner.appendChild(btnOk);

  var btnX = document.createElement('button');
  btnX.textContent = '×';
  btnX.setAttribute(
    'style',
    'background:none;border:none;color:rgba(255,255,255,0.65);' +
    'font-size:20px;line-height:1;cursor:pointer;padding:0 4px;flex-shrink:0'
  );
  btnX.addEventListener('click', function () {
    banner.style.animation = 'mtFadeOut 0.25s ease forwards';
    setTimeout(function () { banner.remove(); }, 260);
  });
  banner.appendChild(btnX);

  document.body.appendChild(banner);
}
