// ════════════════════════════════════════════════════════════════
//  MI TURNO · Notificaciones Inteligentes
//  Notificaciones push y en-app
// ════════════════════════════════════════════════════════════════

/* global Notification */ // ESLint: definir global

// Configuración inicial
document.addEventListener('DOMContentLoaded', function () {
  if ('Notification' in window) {
    Notification.requestPermission().then(function (perm) {
      if (perm === 'granted') {
        console.log('[Notificaciones] Permisos concedidos');
      }
    });
  }
});

// Enviar notificación inteligente
function sendSmartNotification(titulo, cuerpo, tipo) {
  try {
    // Notificación en-app
    showToast(cuerpo, tipo || 'info');

    // Notificación push si está permitido
    if (Notification.permission === 'granted') {
      new Notification(titulo, {
        body: cuerpo,
        icon: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'mi-turno-notif'
      });
    }

    // Feedback háptico en dispositivos móviles
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (e) {
    console.error('[Notificaciones] Error:', e);
  }
}

// Ejemplo de uso:
// sendSmartNotification('Recordatorio', 'Tu turno finaliza en 30 min', 'warning');
