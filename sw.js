// ════════════════════════════════════════════════════════════════
//  MI TURNO · SERVICE WORKER
//  Cache de librerías CDN para arranque rápido offline-first
// ════════════════════════════════════════════════════════════════
const CACHE='mt-v3';
const CDN=[
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.allSettled(CDN.map(function(u){
      return fetch(u,{mode:'cors'}).then(function(r){if(r.ok)return c.put(u,r);});
    }));
  }).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname.indexOf('supabase')>=0)return;
  if(u.hostname.indexOf('cdnjs')>=0||u.hostname.indexOf('jsdelivr')>=0||u.hostname.indexOf('fonts.g')>=0){
    e.respondWith(caches.match(e.request).then(function(cached){
      if(cached)return cached;
      return fetch(e.request).then(function(r){
        if(r.ok){var clone=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,clone);});}
        return r;
      }).catch(function(){return cached;});
    }));
  }
});
