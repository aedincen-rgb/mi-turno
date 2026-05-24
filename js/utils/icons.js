// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/icons.js
//  Generador de iconos SVG para la navegación
// ════════════════════════════════════════════════════════════════
function tabIcon(name) {
  var c = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'tab-icon-svg'
  };
  if (name === 'home')
    return h(
      'svg',
      c,
      h('circle', { cx: 12, cy: 14, r: 7.5 }),
      h('path', { d: 'M12 10 L12 14 L15 14' }),
      h('path', { d: 'M9.5 3 L14.5 3' }),
      h('path', { d: 'M12 3 L12 6.5' })
    );
  if (name === 'chart')
    return h(
      'svg',
      c,
      h('path', { d: 'M6 20 L6 13' }),
      h('path', { d: 'M12 20 L12 6' }),
      h('path', { d: 'M18 20 L18 10' }),
      h('path', { d: 'M4 21 L20 21' })
    );
  if (name === 'sparkle')
    return h(
      'svg',
      Object.assign({}, c, {
        style: { 
          transform: 'scale(1.22)', 
          filter: 'drop-shadow(0 0 2px rgba(91, 134, 229, 0.45))' 
        },
        strokeWidth: 2,
        stroke: '#5B86E5'
      }),
      h('path', { d: 'M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z' })
    );
  if (name === 'history')
    return h(
      'svg',
      c,
      h('circle', { cx: 12, cy: 12, r: 9 }),
      h('path', { d: 'M12 7 L12 12 L15.5 14' })
    );
  if (name === 'settings')
    return h(
      'svg',
      c,
      h('path', { d: 'M4 7.5 L10.5 7.5' }),
      h('path', { d: 'M14.5 7.5 L20 7.5' }),
      h('circle', { cx: 12.5, cy: 7.5, r: 1.9 }),
      h('path', { d: 'M4 16.5 L6.5 16.5' }),
      h('path', { d: 'M10.5 16.5 L20 16.5' }),
      h('circle', { cx: 8.5, cy: 16.5, r: 1.9 })
    );
  return null;
}