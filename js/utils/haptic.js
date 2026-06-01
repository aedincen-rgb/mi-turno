// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/haptic.js
//  Vibración háptica — patrones diferenciados por intención
// ════════════════════════════════════════════════════════════════
function _vibrate(pattern) {
  try {
    if (window.navigator && navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) {}
}

// Tap neutro (taps de UI, navegación)
function haptic() {
  _vibrate(5);
}

// Éxito: doble pulso corto y suave
function hapticSuccess() {
  _vibrate([10, 40, 14]);
}

// Error: tres pulsos firmes (patrón de rechazo)
function hapticError() {
  _vibrate([35, 28, 35, 28, 35]);
}

// Advertencia: un pulso medio seguido de uno corto
function hapticWarning() {
  _vibrate([22, 50, 12]);
}
