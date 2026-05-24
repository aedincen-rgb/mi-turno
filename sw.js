// ════════════════════════════════════════════════════════════════
//  MI TURNO · SERVICE WORKER
//  Cache de librerías CDN para arranque rápido offline-first
const CACHE = 'mt-v40'; // CRÍTICO: flush inmediato de cola + IN_FLIGHT guard + listener leak fix
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

const appResources = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './version.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  // CSS (38 archivos)
  './css/base/variables.css',
  './css/base/reset.css',
  './css/base/typography.css',
  './css/base/background.css',
  './css/base/media-queries.css',
  './css/base/blur-fix.css',
  './css/layout/header.css',
  './css/layout/scroll.css',
  './css/layout/hero-card.css',
  './css/layout/progress-bar.css',
  './css/layout/action-button.css',
  './css/layout/shapes.css',
  './css/layout/fade-animations.css',
  './css/layout/misc-animations.css',
  './css/layout/misc.css',
  './css/components/cards.css',
  './css/components/buttons.css',
  './css/components/buttons-glass.css',
  './css/components/inputs.css',
  './css/components/switches.css',
  './css/components/config-rows.css',
  './css/components/dashboard-hero.css',
  './css/components/dashboard-kpis.css',
  './css/components/dashboard-chart.css',
  './css/components/dashboard-tip.css',
  './css/components/assistant-chat.css',
  './css/components/history-list.css',
  './css/components/fast-pin.css',
  './css/components/auth-screen.css',
  './css/components/misc.css',
  './css/components/dark-mode-overrides.css',
  './css/modals/overlay.css',
  './css/modals/modal-card.css',
  './css/modals/bottom-sheets.css',
  './css/modals/auth-screen.css',
  './css/modals/assistant-chat.css',
  './css/modals/time-picker.css',
  './css/modals/splash.css',
  './css/modals/misc.css',
  './css/modals/dark-overrides.css',
  './css/animations/keyframes.css',
  // JS (39 archivos)
  './js/config.js',
  './js/theme-boot.js',
  './js/config/react-init.js',
  './js/config/env.js',
  './js/config/viewport-fix.js',
  './js/config/globals.js',
  './js/utils/storage.js',
  './js/utils/format.js',
  './js/utils/haptic.js',
  './js/utils/error-logger.js',
  './js/utils/network.js',
  './js/utils/uuid.js',
  './js/utils/icons.js',
  './js/utils/festivos.js',
  './js/utils/time.js',
  './js/utils/validation.js',
  './js/utils/otp.js',
  './js/services/supabase.js',
  './js/services/supabase-init.js',
  './js/services/calculator.js',
  './js/services/quincena.js',
  './js/services/data.js',
  './js/services/ai.js',
  './js/services/export-files.js',
  './js/services/export-email.js',
  './js/tabs/home.js',
  './js/tabs/dashboard.js',
  './js/tabs/assistant.js',
  './js/tabs/history.js',
  './js/tabs/config.js',
  './js/tabs/sync-queue.js',
  './js/modals/error-viewer.js',
  './js/modals/forgot-password.js',
  './js/modals/forgot-pin.js',
  './js/modals/pin-setup.js',
  './js/modals/manage-account.js',
  './js/modals/diagnostico.js',
  './js/modals/asignar-pins.js',
  './js/modals/usuarios.js',
  './js/modals/export-report.js',
  './js/app/auth-screen.js',
  './js/app/fast-pin-screen.js',
  './js/app/app-main.js',
  './js/app/root.js',
  './js/app/sw-register.js',
  './js/app/init.js'
];

self.addEventListener('install', function (e) {
  var all = CDN.concat(appResources);
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.allSettled(all.map(function (u) {
      // `cache: 'reload'` evita que el HTTP cache (Vercel/disco) sirva versiones viejas
      // durante el precache — clave porque /css/* y /js/* son `immutable` por 1 año.
      var opts = u.indexOf('http') === 0
        ? { mode: 'cors', cache: 'reload' }
        : { cache: 'reload' };
      return fetch(u, opts).then(function (r) { if (r.ok) return c.put(u, r); });
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) {
  if (e.data && (e.data === 'skipWaiting' || e.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.indexOf('supabase') >= 0) return;

  var sameHost = u.hostname === self.location.hostname;
  var isCDN = u.hostname.indexOf('cdnjs') >= 0 || u.hostname.indexOf('jsdelivr') >= 0 || u.hostname.indexOf('fonts.g') >= 0;
  var isStatic = sameHost || isCDN;
  if (!isStatic) return;

  // ── Shell crítico (HTML / sw.js / version.json) → network-first ──
  // Garantiza que la entrada esté siempre fresca para detectar nueva versión.
  // Si la red falla, cae al caché para mantener offline-first.
  var path = u.pathname;
  var isShell = sameHost && (
    path === '/' ||
    path.endsWith('/index.html') ||
    path.endsWith('/sw.js') ||
    path.endsWith('/version.json') ||
    path.endsWith('/manifest.json')
  );

  if (isShell) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(function (r) {
          if (r && r.ok) {
            var clone = r.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          }
          return r;
        })
        .catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // ── Resto de assets (JS/CSS/img/CDN) → cache-first ──
  // El SW invalida vía `CACHE = mt-vNN` al instalar la nueva versión.
  e.respondWith(caches.match(e.request).then(function (cached) {
    if (cached) return cached;
    return fetch(e.request).then(function (r) {
      if (r.ok) { var clone = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, clone); }); }
      return r;
    }).catch(function () { return cached; });
  }));
});
