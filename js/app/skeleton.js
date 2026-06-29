// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/skeleton.js
//  Placeholders animados (shimmer) que preservan el layout mientras
//  cargan los datos. Reemplaza el splash plano durante la carga de
//  turnos, dando sensación de velocidad y app-like.
// ════════════════════════════════════════════════════════════════
function _skBox(cls) {
  return h('div', { className: 'sk ' + (cls || ''), 'aria-hidden': 'true' });
}

function SkeletonScreen(props) {
  var compact = props && props.compact;
  return h(
    'div',
    {
      className: 'sk-screen',
      role: 'status',
      'aria-label': 'Cargando tus turnos',
      style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
    },
    // Header fantasma (refleja la estructura real del header)
    h(
      'div',
      { className: 'hdr' + (compact ? ' hdr--compact' : ''), 'aria-hidden': 'true' },
      h(
        'div',
        { className: 'hdr-l' },
        _skBox('sk-led'),
        _skBox('sk-logo'),
        h(
          'div',
          {
            className: 'hdr-info',
            style: { display: 'flex', flexDirection: 'column', gap: '6px' }
          },
          _skBox('sk-line sk-w90'),
          _skBox('sk-line sk-w60')
        )
      ),
      _skBox('sk-avatar')
    ),
    // Cuerpo: tarjeta hero + acción + filas
    h(
      'div',
      { className: 'sk-body' },
      _skBox('sk-hero'),
      _skBox('sk-action'),
      h('div', { className: 'sk-rows' }, _skBox('sk-row'), _skBox('sk-row'), _skBox('sk-row'))
    )
  );
}
