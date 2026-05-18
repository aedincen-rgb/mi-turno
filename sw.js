const CACHE_NAME = 'mi-turno-v4';
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalación: cachea CDN + todos los estáticos de la app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache CDN
      await Promise.allSettled(CDN_URLS.map(url =>
        fetch(url, {mode: 'cors'}).then(r => r.ok && cache.put(url, r))
      ));
      // Cache archivos propios (HTML, CSS, JS, iconos, manifest)
      const appResources = [
        './',
        './index.html',
        './manifest.json',
        './sw.js',
        './icon-180.png',
        './icon-192.png',
        './icon-512.png',
        // Incluye TODAS las rutas de tus 77 archivos, por ejemplo:
        './css/base/variables.css',
        './css/base/reset.css',
        // ... (agrega el resto de tus CSS y JS)
        './js/config.js',
        './js/app/init.js',
        // etc. (usa un array con todas las rutas reales)
      ];
      await Promise.allSettled(appResources.map(url =>
        fetch(url, {mode: 'cors'}).then(r => r.ok && cache.put(url, r))
      ));
    })
  );
  // NO usamos skipWaiting() aquí para evitar recargas forzadas
});

// Activación: limpia caches viejas SIN forzar clients.claim()
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
    // clients.claim() se llama solo si el usuario lo solicita explícitamente
  );
});

// Fetch: estrategia "Cache First" para offline-first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // No interceptar peticiones a Supabase (API dinámica)
  if (url.hostname.includes('supabase')) return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // Si falla la red, devuelve cache
    })
  );
});

// Mensaje para actualizar SW sin recargar
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    self.clients.claim();
  }
});
