// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/history.js
//  Tab Historial
// ════════════════════════════════════════════════════════════════
function HistoryTab(props) {
  var activo = props.activo,
    turnos = props.turnos,
    durActual = props.durActual;
  var cs = useState(false);
  var conf = cs[0],
    setConf = cs[1];
  var ds = useState(null);
  var delId = ds[0],
    setDelId = ds[1];

  function doDel() {
    if (delId !== null) {
      haptic();
      props.onBorrarUno(delId);
      setDelId(null);
    }
  }

  return h(
    'div',
    { className: 'fadeUp' },
    delId !== null
      ? h(
          'div',
          {
            className: 'ovl',
            onClick: function (ev) {
              if (ev.target === ev.currentTarget) setDelId(null);
            }
          },
          h(
            'div',
            { className: 'modal-card', style: { textAlign: 'center' } },
            h('div', { style: { fontSize: 30, marginBottom: 12, opacity: 0.85 } }, '🗑'),
            h(
              'div',
              { style: { fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 } },
              '¿Eliminar turno?'
            ),
            h(
              'div',
              { style: { fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 } },
              'Esta acción no se puede deshacer.'
            ),
            h(
              'div',
              { className: 'confirm-row' },
              h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  onClick: function () {
                    haptic();
                    setDelId(null);
                  }
                },
                'Cancelar'
              ),
              h(
                'button',
                {
                  className: 'btn btn-danger btn-block',
                  onClick: doDel,
                  style: { background: 'var(--danger)', color: '#fff' }
                },
                'Eliminar'
              )
            )
          )
        )
      : null,

    activo
      ? h(
          'div',
          { className: 'hist-cur' },
          h(
            'div',
            { className: 'hist-cur-tag' },
            h('div', { className: 'active-dot', style: { width: 5, height: 5 } }),
            'En curso'
          ),
          h(
            'div',
            { style: { fontSize: 13, fontWeight: 600, color: 'var(--text)' } },
            new Date(activo.inicio).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit'
            }) +
              ' → ahora · ' +
              fDur(durActual)
          )
        )
      : null,

    turnos.length === 0 && !activo
      ? h(
          'div',
          { className: 'empty' },
          h('div', { className: 'empty-ico' }, '📋'),
          h('div', { className: 'empty-txt' }, 'Sin turnos registrados'),
          h('div', { className: 'empty-sub' }, 'Los turnos aparecerán aquí')
        )
      : null,

    turnos.length > 0
      ? h(
          'div',
          { className: 'card', style: { padding: 14 } },
          h('div', { className: 'card-ttl', style: { marginBottom: 10 } }, 'Exportar este mes'),
          h(
            'div',
            { className: 'export-row' },
            h(
              'button',
              {
                className: 'btn-glass glass-pdf',
                onClick: function () {
                  haptic();
                  props.onExportPDF();
                }
              },
              '📄 PDF'
            ),
            h(
              'button',
              {
                className: 'btn-glass glass-excel',
                onClick: function () {
                  haptic();
                  props.onExportExcel();
                }
              },
              '📊 Excel'
            )
          )
        )
      : null,

    turnos.slice(0, 60).map(function (t, i) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return null;
      var mins = Math.round((fin - ini) / 60000),
        fest = esFest(ini);
      return h(
        'div',
        { key: t.id || i, className: 'hist-row' },
        h(
          'div',
          { className: 'hist-head' },
          h(
            'div',
            { className: 'hist-date' },
            ini.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }),
            fest ? h('span', { className: 'bdg-fest' }, 'Fest') : null
          ),
          h(
            'div',
            { className: 'hist-right' },
            h('div', { className: 'hist-dur' }, fDur(mins)),
            h(
              'button',
              {
                className: 'hist-del',
                onClick: function () {
                  haptic();
                  setDelId(t.id || i);
                }
              },
              '✕'
            )
          )
        ),
        h(
          'div',
          { className: 'hist-detail' },
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) +
            ' → ' +
            fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        )
      );
    }),

    turnos.length > 0
      ? !conf
        ? h(
            'button',
            {
              className: 'btn btn-danger btn-block',
              onClick: function () {
                haptic();
                setConf(true);
              },
              style: { marginTop: 10 }
            },
            '🗑 Borrar todo el historial'
          )
        : h(
            'div',
            { className: 'confirm-row', style: { marginTop: 10 } },
            h(
              'button',
              {
                className: 'btn btn-ghost btn-block',
                onClick: function () {
                  haptic();
                  setConf(false);
                }
              },
              'Cancelar'
            ),
            h(
              'button',
              {
                className: 'btn btn-danger btn-block',
                onClick: function () {
                  haptic();
                  props.onBorrar();
                  setConf(false);
                },
                style: { background: 'var(--danger)', color: '#fff' }
              },
              'Sí, borrar'
            )
          )
      : null
  );
}
