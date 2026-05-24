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

  // Formato seleccionado del exportador (segmented control estilo iOS)
  var ff = useState('pdf');
  var fmt = ff[0], setFmt = ff[1];

  function doDel() {
    if (delId !== null) {
      haptic();
      props.onBorrarUno(delId);
      setDelId(null);
    }
  }
  function doExport() {
    haptic();
    if (fmt === 'pdf') props.onExportPDF();
    else props.onExportExcel();
  }

  // ── Datos para el hero (peso visual al estilo IA) ─────────
  var ahora = props.ahora || new Date();
  var session = props.session || {};
  // Nombre personal: mismo helper usado en el asistente
  var nm = typeof _aiNombrePersonal === 'function'
    ? _aiNombrePersonal({ session: session })
    : '';
  var hora = ahora.getHours();
  var saludo =
    hora >= 5 && hora < 12 ? 'Buenos días' :
    hora >= 12 && hora < 19 ? 'Buenas tardes' :
    'Buenas noches';
  var saludoCompleto = nm ? saludo + ', ' + nm : saludo;

  // Stats del mes en curso (turnos cerrados de este mes)
  var mesActual = ahora.getMonth();
  var anioActual = ahora.getFullYear();
  var minsMes = 0;
  var turnosMes = 0;
  var diasSetMes = {};
  turnos.forEach(function (t) {
    if (!t.fin) return;
    var ini = new Date(t.inicio);
    if (ini.getMonth() === mesActual && ini.getFullYear() === anioActual) {
      var fin = new Date(t.fin);
      minsMes += (fin - ini) / 60000;
      turnosMes++;
      diasSetMes[ini.getDate()] = true;
    }
  });
  var diasMes = Object.keys(diasSetMes).length;
  var horasMes = Math.round(minsMes / 60);
  var nombreMes = ahora.toLocaleDateString('es-CO', { month: 'long' });
  nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

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

    // ═══ HERO con peso visual (estilo IA) ═══
    h(
      'div',
      { className: 'hist-hero' },
      h('div', { className: 'hist-hero-eyebrow' }, nombreMes + ' · resumen'),
      h('h1', { className: 'hist-hero-greeting' }, saludoCompleto + '.'),
      h(
        'div',
        { className: 'hist-hero-stats' },
        h(
          'div',
          { className: 'hist-hero-stat' },
          h('div', { className: 'hist-hero-stat-num' }, turnosMes),
          h('div', { className: 'hist-hero-stat-lbl' }, turnosMes === 1 ? 'turno' : 'turnos')
        ),
        h('div', { className: 'hist-hero-sep' }),
        h(
          'div',
          { className: 'hist-hero-stat' },
          h('div', { className: 'hist-hero-stat-num' }, horasMes),
          h('div', { className: 'hist-hero-stat-lbl' }, horasMes === 1 ? 'hora' : 'horas')
        ),
        h('div', { className: 'hist-hero-sep' }),
        h(
          'div',
          { className: 'hist-hero-stat' },
          h('div', { className: 'hist-hero-stat-num' }, diasMes),
          h('div', { className: 'hist-hero-stat-lbl' }, diasMes === 1 ? 'día' : 'días')
        )
      )
    ),

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
          { className: 'hist-export' },
          h('div', { className: 'hist-export-ttl' }, 'Exportar ' + nombreMes),
          // ── Segmented control estilo iOS ──
          h(
            'div',
            { className: 'hist-fmt-seg', role: 'tablist' },
            h(
              'button',
              {
                className: 'hist-fmt-opt' + (fmt === 'pdf' ? ' active' : ''),
                role: 'tab',
                'aria-selected': fmt === 'pdf',
                onClick: function () { haptic(); setFmt('pdf'); }
              },
              h('span', { className: 'hist-fmt-ico' }, '📄'),
              'PDF'
            ),
            h(
              'button',
              {
                className: 'hist-fmt-opt' + (fmt === 'excel' ? ' active' : ''),
                role: 'tab',
                'aria-selected': fmt === 'excel',
                onClick: function () { haptic(); setFmt('excel'); }
              },
              h('span', { className: 'hist-fmt-ico' }, '📊'),
              'Excel'
            )
          ),
          // ── CTA de exportación ──
          h(
            'button',
            {
              className: 'hist-export-cta',
              onClick: doExport,
              'aria-label': 'Exportar como ' + (fmt === 'pdf' ? 'PDF' : 'Excel')
            },
            h('span', { className: 'hist-export-cta-ico' }, '↓'),
            h(
              'span',
              { className: 'hist-export-cta-txt' },
              'Descargar ' + (fmt === 'pdf' ? 'PDF' : 'Excel')
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
