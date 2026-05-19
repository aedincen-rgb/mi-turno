// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/splash.js
//  Pantalla de carga (React) — logo inline sin fondo cuadrado
// ════════════════════════════════════════════════════════════════
function SplashScreen(props) {
  var cls = 'splash' + (props.exit ? ' splash--exit' : '') + (props.plain ? ' splash--plain' : '');

  return h(
    'div',
    { className: cls },
    h(
      'div',
      { className: 'sp-logo-wrap' },
      h(
        'svg',
        {
          className: 'sp-logo',
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 512 512',
          role: 'img',
          'aria-label': 'Mi Turno'
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            {
              id: 'sp-ltr',
              x1: '256',
              y1: '55',
              x2: '256',
              y2: '425',
              gradientUnits: 'userSpaceOnUse'
            },
            h('stop', { offset: '0%', stopColor: '#B4D0FF' }),
            h('stop', { offset: '25%', stopColor: '#6FA0FA' }),
            h('stop', { offset: '65%', stopColor: '#4475EC' }),
            h('stop', { offset: '100%', stopColor: '#2C52C8' })
          )
        ),
        h('path', {
          d: 'M 96,422 L 96,182 C 96,93 196,93 196,182 L 196,422 M 196,422 L 196,182 C 196,93 296,93 296,182 L 296,422',
          fill: 'none',
          stroke: 'url(#sp-ltr)',
          strokeWidth: '86',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }),
        h('line', {
          x1: '398',
          y1: '182',
          x2: '398',
          y2: '422',
          stroke: 'url(#sp-ltr)',
          strokeWidth: '86',
          strokeLinecap: 'round'
        }),
        h('circle', { cx: '418', cy: '70', r: '46', fill: 'url(#sp-ltr)' })
      ),
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
