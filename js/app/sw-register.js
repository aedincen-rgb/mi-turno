// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/sw-register.js
//  Registro Service Worker
// ════════════════════════════════════════════════════════════════
// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('sw.js')
      .then(function (reg) {
        console.log('[MT] SW registered', reg.scope);
      })
      .catch(function (err) {
        console.warn('[MT] SW failed:', err);
      });
  });
}
