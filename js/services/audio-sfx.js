// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/audio-sfx.js
//  Efectos de sonido para Mi Turno
//  Fuente: Remotion SFX library (remotion.media CDN)
//  Licencia: MIT — https://github.com/remotion-dev/remotion
//
//  Sonidos seleccionados que aportan valor a la app:
//    · ding       — turno iniciado / finalizado con éxito
//    · whoosh     — notificación de recargo detectado
//    · uiSwitch   — cambio de modo / tema
//    · mouseClick — feedback táctil en botones
//    · pageTurn   — navegación entre pestañas
//    · shutterModern — reporte exportado
// ════════════════════════════════════════════════════════════════

// ─── CATÁLOGO DE SONIDOS ──────────────────────────────────────
var SFX = {
  // ✅  Notificaciones positivas
  ding: 'https://remotion.media/ding.wav',
  yippee: 'https://remotion.media/yippee.wav',

  // 🔔  Transiciones y cambios
  whoosh: 'https://remotion.media/whoosh.wav',
  uiSwitch: 'https://remotion.media/switch.wav',
  pageTurn: 'https://remotion.media/page-turn.wav',

  // 👆  Feedback táctil
  mouseClick: 'https://remotion.media/mouse-click.wav',

  // 📸  Acciones de exportar/guardar
  shutterModern: 'https://remotion.media/shutter-modern.wav',

  // ⚠️  Alertas y errores
  windowsXpError: 'https://remotion.media/windows-xp-error.wav',
  recordScratch: 'https://remotion.media/record-scratch.wav',

  // 🎮  Gamificación / logros
  animeWow: 'https://remotion.media/anime-wow.wav',
  bruh: 'https://remotion.media/bruh.wav',
  vineBoom: 'https://remotion.media/vine-boom.wav',
  triggered: 'https://remotion.media/triggered.wav'
};

// ─── REPRODUCTOR ÚNICO (evita solapamiento) ──────────────────
var _sfxAudio = null;

function sfxPlay(url) {
  if (!url) return;
  try {
    // Detener sonido anterior si sigue sonando
    if (_sfxAudio) {
      _sfxAudio.pause();
      _sfxAudio.currentTime = 0;
      _sfxAudio = null;
    }
    _sfxAudio = new Audio(url);
    _sfxAudio.volume = 0.4; // volumen moderado
    _sfxAudio.play().catch(function () {
      // Navegadores bloquean autoplay sin gesto del usuario.
      // No hacemos nada — el sonido es opcional.
    });
  } catch (e) {
    // Silencioso: Audio API no disponible
  }
}

// ─── FUNCIONES SEMÁNTICAS ─────────────────────────────────────
function sfxDing() {
  sfxPlay(SFX.ding);
}
function sfxWhoosh() {
  sfxPlay(SFX.whoosh);
}
function sfxSwitch() {
  sfxPlay(SFX.uiSwitch);
}
function sfxClick() {
  sfxPlay(SFX.mouseClick);
}
function sfxPageTurn() {
  sfxPlay(SFX.pageTurn);
}
function sfxShutter() {
  sfxPlay(SFX.shutterModern);
}
function sfxError() {
  sfxPlay(SFX.windowsXpError);
}
function sfxWow() {
  sfxPlay(SFX.animeWow);
}
function sfxYippee() {
  sfxPlay(SFX.yippee);
}
function sfxBruh() {
  sfxPlay(SFX.bruh);
}

// ─── PRELOAD OPCIONAL (carga en segundo plano) ────────────────
// Llama a sfxPreload() después del primer gesto del usuario
// para precargar los sonidos más usados y evitar latencia.
var _sfxPreloaded = false;
function sfxPreload() {
  if (_sfxPreloaded) return;
  _sfxPreloaded = true;
  var preloadList = [SFX.ding, SFX.whoosh, SFX.uiSwitch, SFX.mouseClick];
  for (var i = 0; i < preloadList.length; i++) {
    var a = new Audio();
    a.preload = 'auto';
    a.src = preloadList[i];
    // No llamamos a play(), solo precargamos
  }
}
