// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/forgot-password.js
//  Modal para gestionar turnos olvidados (más de 12 horas activos)
// ════════════════════════════════════════════════════════════════
function ModalOlvidado(props) {
  var ini = new Date(props.inicio);
  var sug = new Date(ini.getTime() + 8 * 3600000);
  var hs = useState(String(Math.min(sug.getHours(), 23)).padStart(2, '0'));
  var ms = useState(String(sug.getMinutes()).padStart(2, '0'));
  var hora = hs[0],
    setH = hs[1];
  var min = ms[0],
    setM = ms[1];
  var opH = Array.from({ length: 24 }, function (_, i) {
    return String(i).padStart(2, '0');
  });
  var opM = Array.from({ length: 60 }, function (_, i) {
    return String(i).padStart(2, '0');
  });
  function guardar() {
    haptic();
    var fin = new Date(ini);
    fin.setHours(parseInt(hora), parseInt(min), 0, 0);
    if (fin <= ini) fin.setDate(fin.getDate() + 1);
    props.onGuardar(fin.toISOString());
  }
  return h(
    'div',
    { className: 'mol-ov' },
    h(
      'div',
      { className: 'mol-sh' },
      h('div', { className: 'mol-hdl' }),
      h(
        'div',
        { style: { textAlign: 'center' } },
        h('div', { style: { fontSize: 38, marginBottom: 10, opacity: 0.85 } }, '⏰'),
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text)',
              marginBottom: 6
            }
          },
          'Más de 12h en turno'
        ),
        h(
          'div',
          { style: { fontSize: 12, color: 'var(--muted)', fontWeight: 500 } },
          'Inicio: ',
          ini.toLocaleString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        )
      ),
      h(
        'div',
        {
          style: {
            fontSize: 12.5,
            color: 'var(--text)',
            fontWeight: 600,
            marginTop: 18,
            textAlign: 'center'
          }
        },
        '¿A qué hora terminaste?'
      ),
      h(
        'div',
        { className: 'time-row' },
        h(
          'div',
          { className: 'time-col' },
          h('div', { className: 'time-col-lbl' }, 'Hora'),
          h(
            'select',
            {
              className: 'ios-sel',
              value: hora,
              onChange: function (e) {
                haptic();
                setH(e.target.value);
              }
            },
            opH.map(function (v) {
              return h('option', { key: v, value: v }, v);
            })
          )
        ),
        h('span', { className: 'colon' }, ':'),
        h(
          'div',
          { className: 'time-col' },
          h('div', { className: 'time-col-lbl' }, 'Min'),
          h(
            'select',
            {
              className: 'ios-sel',
              value: min,
              onChange: function (e) {
                haptic();
                setM(e.target.value);
              }
            },
            opM.map(function (v) {
              return h('option', { key: v, value: v }, v);
            })
          )
        )
      ),
      h(
        'button',
        { className: 'btn btn-accent btn-block', onClick: guardar, style: { marginBottom: 8 } },
        'Guardar turno'
      ),
      h(
        'button',
        {
          className: 'btn btn-ghost btn-block',
          onClick: function () {
            haptic();
            props.onContinuar();
          }
        },
        'Sigue activo'
      )
    )
  );
}
