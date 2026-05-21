// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/splash.js
//  Componente de pantalla de carga inicial
// ════════════════════════════════════════════════════════════════
function SplashScreen(props) {
  var cls = 'splash' + (props.exit ? ' splash--exit' : '') + (props.plain ? ' splash--plain' : '');
  return h(
    'div',
    { className: cls },
    h(
      'div',
      { className: 'sp-logo-wrap' },
      h('img', {
        src: 'img/logo-mark.svg',
        className: 'sp-logo',
        alt: 'Mi Turno',
        draggable: false
      }),
      h('span', { className: 'sp-glow' }),
      h('span', { className: 'sp-ping' }),
      h('span', { className: 'sp-ping-2' })
    ),
    h('div', { className: 'sp-ttl' }, 'Mi Turno'),
    h('div', { className: 'sp-sub' }, 'Colombia · Nómina inteligente'),
    h(
      'div',
      { className: 'sp-dots' },
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' })
    )
  );
}