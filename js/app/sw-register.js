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

        // Manejo de actualizaciones inteligentes
        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function () {
            // Si hay un controlador previo, significa que es una actualización (no la primera carga)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Deferir el confirm para evitar bloquear la carga inicial de la UI (Splash)
              setTimeout(function() {
                if (confirm('Nueva versión de Mi Turno disponible. ¿Actualizar ahora?')) {
                  newWorker.postMessage('skipWaiting');
                  window.location.reload();
                }
              }, 2500);
            }
          });
        });
      })
      .catch(function (err) {
        // Si falla el registro, verificamos si es por estar en un entorno no seguro
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          console.warn('[MT] El Service Worker requiere HTTPS o localhost.');
        } else {
          console.warn('[MT] Error al registrar SW. Revisa si sw.js existe en la raíz:', err);
        }
      });
  });
}
