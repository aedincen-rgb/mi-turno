// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/whats-new.js
//  Modal "Novedades": al actualizar a una versión nueva, muestra un
//  changelog corto y elegante. Refuerza la percepción de app viva.
// ════════════════════════════════════════════════════════════════

// Changelog de la versión actual. Mantener breve (3-5 puntos), en tono
// cálido y sin jerga técnica. Al hacer un release con novedades visibles,
// actualizar WHATS_NEW.version a la nueva versión y la lista de cambios.
var WHATS_NEW = {
  version: 'v362',
  title: 'Novedades',
  items: [
    {
      ico: '🛟',
      ttl: 'Más a prueba de fallos',
      sub: 'Si algo se rompe, ahora ves una pantalla para reintentar — nunca una pantalla en blanco.'
    },
    {
      ico: '⚡',
      ttl: 'Abre más rápido',
      sub: 'Mientras cargan tus turnos verás un esquema animado en vez de una espera vacía.'
    },
    {
      ico: '🔒',
      ttl: 'Tu privacidad, tu control',
      sub: 'Desde Ajustes → Cuenta podés eliminar tu cuenta y todos tus datos cuando quieras.'
    }
  ]
};

// ¿Hay que mostrar el modal de novedades?
// - Solo a usuarios que YA usaban una versión anterior (no en primer install).
// - Solo una vez por versión.
function whatsNewShouldShow() {
  try {
    var seen = localStorage.getItem('mt_seen_version');
    var current = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : WHATS_NEW.version;
    // Primer install (sin marca previa): no mostrar, marcar silenciosamente.
    if (!seen) {
      localStorage.setItem('mt_seen_version', current);
      return false;
    }
    // Misma versión ya vista: nada que mostrar.
    if (seen === current) return false;
    // Versión distinta Y tenemos changelog para la actual.
    return WHATS_NEW.version === current;
  } catch (_) {
    return false;
  }
}

function whatsNewMarkSeen() {
  try {
    var current = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : WHATS_NEW.version;
    localStorage.setItem('mt_seen_version', current);
  } catch (_) {}
}

function WhatsNewModal(props) {
  function close() {
    try {
      if (typeof haptic === 'function') haptic();
    } catch (_) {}
    whatsNewMarkSeen();
    if (props && props.onClose) props.onClose();
  }

  return h(
    'div',
    {
      className: 'ovl wn-ovl',
      onClick: function (e) {
        if (e.target === e.currentTarget) close();
      }
    },
    h(
      'div',
      {
        className: 'wn-card',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Novedades de la versión'
      },
      h(
        'div',
        { className: 'wn-head' },
        h('div', { className: 'wn-spark', 'aria-hidden': 'true' }, '✨'),
        h('div', { className: 'wn-ttl' }, WHATS_NEW.title),
        h(
          'div',
          { className: 'wn-ver' },
          'Mi Turno ' + (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : WHATS_NEW.version)
        )
      ),
      h(
        'div',
        { className: 'wn-list' },
        WHATS_NEW.items.map(function (it, i) {
          return h(
            'div',
            { className: 'wn-item', key: i },
            h('div', { className: 'wn-item-ico', 'aria-hidden': 'true' }, it.ico),
            h(
              'div',
              { className: 'wn-item-txt' },
              h('div', { className: 'wn-item-ttl' }, it.ttl),
              h('div', { className: 'wn-item-sub' }, it.sub)
            )
          );
        })
      ),
      h('button', { type: 'button', className: 'wn-btn', onClick: close }, 'Entendido')
    )
  );
}
