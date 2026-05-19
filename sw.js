// ════════════════════════════════════════════════════════════════
//  MI TURNO · SERVICE WORKER v5
//  Offline-first: shell cache + stale-while-revalidate
// ════════════════════════════════════════════════════════════════
var CACHE = 'mt-v5';

// CDN libs — cache-first forever
var CDN_HOSTS = ['cdnjs.cloudflare.com', 'jsdelivr.net', 'fonts.gstatic.com', 'fonts.googleapis.com'];

// App shell — pre-cached on install so the app loads 100% offline
var SHELL = [
  '/',
  '/index.html',
  '/img/logo-mark.svg',
  // base
  '/css/base/variables.css',
  '/css/base/reset.css',
  '/css/base/typography.css',
  '/css/base/background.css',
  '/css/base/media-queries.css',
  '/css/base/blur-fix.css',
  // layout
  '/css/layout/header.css',
  '/css/layout/scroll.css',
  '/css/layout/hero-card.css',
  '/css/layout/progress-bar.css',
  '/css/layout/action-button.css',
  '/css/layout/shapes.css',
  '/css/layout/fade-animations.css',
  '/css/layout/misc-animations.css',
  '/css/layout/misc.css',
  // components
  '/css/components/cards.css',
  '/css/components/buttons.css',
  '/css/components/buttons-glass.css',
  '/css/components/inputs.css',
  '/css/components/switches.css',
  '/css/components/config-rows.css',
  '/css/components/dashboard-hero.css',
  '/css/components/dashboard-kpis.css',
  '/css/components/dashboard-chart.css',
  '/css/components/dashboard-tip.css',
  '/css/components/assistant-chat.css',
  '/css/components/history-list.css',
  '/css/components/auth-screen.css',
  '/css/components/misc.css',
  '/css/components/dark-mode-overrides.css',
  // modals
  '/css/modals/overlay.css',
  '/css/modals/modal-card.css',
  '/css/modals/bottom-sheets.css',
  '/css/modals/auth-screen.css',
  '/css/modals/assistant-chat.css',
  '/css/modals/time-picker.css',
  '/css/modals/splash.css',
  '/css/modals/misc.css',
  '/css/modals/dark-overrides.css',
  // animations
  '/css/animations/keyframes.css',
  // js config
  '/js/config.js',
  '/js/theme-boot.js',
  '/js/config/react-init.js',
  '/js/config/env.js',
  '/js/config/viewport-fix.js',
  '/js/config/globals.js',
  // js utils
  '/js/utils/storage.js',
  '/js/utils/format.js',
  '/js/utils/haptic.js',
  '/js/utils/network.js',
  '/js/utils/uuid.js',
  '/js/utils/festivos.js',
  '/js/utils/time.js',
  '/js/utils/validation.js',
  '/js/utils/otp.js',
  // js services
  '/js/services/supabase.js',
  '/js/services/supabase-init.js',
  '/js/services/calculator.js',
  '/js/services/data.js',
  '/js/services/ai.js',
  '/js/services/export-files.js',
  '/js/services/export-email.js',
  '/js/services/sync.js',
  // js tabs
  '/js/tabs/home.js',
  '/js/tabs/dashboard.js',
  '/js/tabs/assistant.js',
  '/js/tabs/history.js',
  '/js/tabs/config.js',
  // js modals
  '/js/modals/forgot-password.js',
  '/js/modals/pin-setup.js',
  '/js/modals/manage-account.js',
  '/js/modals/diagnostico.js',
  '/js/modals/asignar-pins.js',
  '/js/modals/usuarios.js',
  '/js/modals/export-report.js',
  // js app
  '/js/app/auth-screen.js',
  '/js/app/app-main.js',
  '/js/app/root.js',
  '/js/app/sw-register.js',
  '/js/app/init.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        // addAll aborts if any fetch fails; use individual adds with fallback
        return Promise.allSettled(
          SHELL.map(function (url) {
            return cache.add(url).catch(function (err) {
              console.warn('[SW] No se pudo cachear:', url, err);
            });
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function isCdnUrl(url) {
  return CDN_HOSTS.some(function (h) {
    return url.hostname.includes(h);
  });
}

function isSupabase(url) {
  return url.hostname.includes('supabase');
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

// Cache-first: return cached; fetch + update cache in background
function cacheFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
    });
  });
}

// Stale-while-revalidate: return cached immediately; fetch fresh in background
function staleWhileRevalidate(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (cached) {
      var fetchPromise = fetch(req)
        .then(function (res) {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(function () {
          return cached;
        });
      // Return cached immediately if available; otherwise wait for network
      return cached || fetchPromise;
    });
  });
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  var url;
  try {
    url = new URL(e.request.url);
  } catch (err) {
    return;
  }

  // Supabase API: always network-only (never cache auth/data calls)
  if (isSupabase(url)) return;

  // CDN libraries: cache-first (stable versions, never change)
  if (isCdnUrl(url)) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // Same-origin (local app files): stale-while-revalidate
  // → instant load from cache, updates in background
  if (isSameOrigin(url)) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }
});
