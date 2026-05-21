// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/config.js
//  Tab Ajustes
// ════════════════════════════════════════════════════════════════
function ConfigTab(props) {
  var salario = props.salario,
    vh = props.valorHora,
    session = props.session;
  var es = useState(false);
  var editSal = es[0],
    setEditSal = es[1];
  var st = useState('');
  var tempSal = st[0],
    setTempSal = st[1];
  var gs = useState(false);
  var showMgtAcct = gs[0],
    setShowMgtAcct = gs[1];
  var dgs = useState(false);
  var showDiag = dgs[0],
    setShowDiag = dgs[1];
  var asg = useState(false);
  var showAsignar = asg[0],
    setShowAsignar = asg[1];
  var usg = useState(false);
  var showUsuarios = usg[0],
    setShowUsuarios = usg[1];
  var evs = useState(false);
  var showErrorViewer = evs[0],
    setShowErrorViewer = evs[1];

  function guardarSalario() {
    haptic();
    var v = parseFloat(tempSal) || SMIN;
    props.onSalario(v);
    setEditSal(false);
  }

  // Helper para renderizar herramientas admin integradas en el scroll
  function AdminToolWrapper(onClose, Component, extraProps) {
    return h('div', { className: 'admin-tool-inline fadeUp', style: { marginTop: 16, position: 'relative' } },
      h('button', { className: 'admin-tool-close', onClick: onClose, style: { position: 'absolute', right: 10, top: 10, zIndex: 10, background: 'var(--surface2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: 'var(--muted)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }, '✕'),
      h(Component, Object.assign({ session: session, onClose: onClose }, extraProps))
    );
  }

  return h(
    'div',
    { className: 'fadeUp' },

    // ── SALARIO ──
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Salario base mensual'),
      editSal
        ? h(
            'div',
            { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('input', {
              type: 'number',
              inputMode: 'numeric',
              className: 'inp',
              style: { marginBottom: 0, flex: 1 },
              value: tempSal,
              onChange: function (e) {
                setTempSal(e.target.value);
              },
              autoFocus: true
            }),
            h(
              'button',
              {
                className: 'btn btn-accent',
                onClick: guardarSalario,
                style: { padding: '12px 18px' }
              },
              '✓'
            )
          )
        : h(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h(
              'div',
              null,
              h(
                'div',
                {
                  style: {
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: '-0.6px',
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums'
                  }
                },
                fCOP(salario)
              ),
              h(
                'div',
                { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 3 } },
                'Hora base · ' + fCOP(vh)
              )
            ),
            h(
              'button',
              {
                className: 'btn-edit',
                onClick: function () {
                  haptic();
                  setTempSal(String(salario));
                  setEditSal(true);
                }
              },
              'Editar'
            )
          )
    ),

    // ── GESTIÓN DE CUENTA ──
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Mi cuenta'),
      h(
        'div',
        { className: 'user-row' },
        h(
          'div',
          {
            className: 'user-av',
            style: session.isAdmin
              ? { background: 'var(--accent)', border: '2px solid var(--accent)' }
              : {}
          },
          session.isAdmin ? '🔓' : (session.email ? session.email[0].toUpperCase() : 'U')
        ),
        h(
          'div',
          { style: { minWidth: 0, flex: 1 } },
          h(
            'div',
            { className: 'user-em', style: { display: 'flex', alignItems: 'center', gap: 6 } },
            h('span', null, session.email || 'sin email'),
            session.isAdmin
              ? h('span', { className: 'badge-admin' }, 'ADMIN')
              : null
          ),
          h('div', { className: 'user-sb' }, session.isAdmin ? 'Acceso administrativo completo' : 'Sincronizado en la nube')
        )
      ),
      h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
        h(
          'button',
          {
            className: 'btn-glass glass-account',
            onClick: function () { haptic(); setShowMgtAcct(true); }
          },
          '⚙ Gestionar'
        ),
        h(
          'button',
          {
            className: 'btn-glass glass-signout',
            onClick: function () { haptic(); props.onSignOut(); }
          },
          '⎋ Cerrar sesión'
        )
      )
    ),

    // ── RECARGOS ──
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Recargos · Ley 2101/2021'),
      Object.keys(RC).map(function (k) {
        var r = RC[k];
        return h(
          'div',
          { key: k, className: 'cfg-row' },
          h('span', { className: 'cfg-k' }, h('span', { className: 'rec-chip', style: { background: r.bg, color: r.color } }, r.icon), r.label),
          h('span', { className: 'cfg-v', style: { color: r.color } }, '+' + Math.round((r.factor - 1) * 100) + '%')
        );
      })
    ),

    // ── PANEL ADMIN ──
    session.isAdmin
      ? h(
          'div',
          { className: 'card', style: { border: '2px solid var(--accent)' } },
          h('div', { className: 'card-ttl', style: { color: 'var(--accent)' } }, '🔓 Panel Administrador'),
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
            h('button', { className: 'btn-glass', onClick: function () { haptic(); setShowDiag(true); } }, '📊 Diagnóstico'),
            h('button', { className: 'btn-glass', onClick: function () { haptic(); setShowUsuarios(true); } }, '👥 Usuarios')
          ),
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 } },
            h('button', { className: 'btn-glass', onClick: function () { haptic(); setShowAsignar(true); } }, '🔑 Asignar PINs'),
            h('button', { className: 'btn-glass', style: { color: 'var(--danger)', fontWeight: '800', border: '1px solid var(--danger)' }, onClick: function () { haptic(); setShowErrorViewer(true); } }, '🐞 Consola Dev')
          )
        )
      : null,

    // ── HERRAMIENTAS ADMIN INDEPENDIENTES (Fuera del panel) ──
    session.isAdmin && showDiag ? AdminToolWrapper(function() { setShowDiag(false); }, DiagnosticoModal) : null,
    session.isAdmin && showUsuarios ? AdminToolWrapper(function() { setShowUsuarios(false); }, UsuariosModal) : null,
    session.isAdmin && showAsignar ? AdminToolWrapper(function() { setShowAsignar(false); }, AsignarPINsModal) : null,
    session.isAdmin && showErrorViewer ? AdminToolWrapper(function() { setShowErrorViewer(false); }, ErrorViewerModal) : null,

    // Renderizado de Modales (Se mantienen al final del árbol)
    showMgtAcct
      ? h(
          'div',
          { className: 'ovl', onClick: function (ev) { if (ev.target === ev.currentTarget) setShowMgtAcct(false); } },
          h(ManageAccountModal, {
            session: session,
            onClose: function () { setShowMgtAcct(false); }
          })
        )
      : null,

    h('div', { style: { textAlign: 'center', padding: '10px 0 40px', fontSize: 11, color: 'var(--muted)', opacity: 0.7 } },
        'Mi Turno v2.6.0 · Pereira, Colombia'
    )
  );
}
