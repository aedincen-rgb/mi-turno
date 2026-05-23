// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/home.js
//  Tab Inicio: turno activo y controles
// ════════════════════════════════════════════════════════════════

// ── Helper: tipo de hora actual ──────────────────────────────
function getTipoHoraActual(ahora, calc, turnos) {
  var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
  var isHoliday = esFest(ahora);

  // Calcular minutos ordinarios usados esta semana hasta ahora
  var lun = semLun(ahora);
  var mOrdUsados = 0;
  if (calc && turnos) {
    turnos.forEach(function (t) {
      var ini = new Date(t.inicio);
      var fin = t.fin ? new Date(t.fin) : ahora;
      if (ini >= lun) {
        var cats = calcCats(ini, fin, HSEM * 60);
        mOrdUsados += cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      }
    });
  }

  var isExtra = mOrdUsados >= HSEM * 60;

  if (isHoliday) {
    if (isExtra) return isNight ? RC.extraFestNoct : RC.extraFestDiur;
    return isNight ? RC.noctFest : RC.diurnaFest;
  } else {
    if (isExtra) return isNight ? RC.extraNoct : RC.extraDiurna;
    return isNight ? RC.noctOrd : RC.diurnaOrd;
  }
}

function HomeTab(props) {
  var calc = props.calc,
    activo = props.activo,
    ahora = props.ahora,
    vh = props.vh,
    turnos = props.turnos;

  // Frase IA rotativa (misma fuente y ritmo que el hero del Asistente)
  var moodPhrases = _aiHeroPhrases(props);
  var mp = useState(0);
  var moodIdx = mp[0],
    setMoodIdx = mp[1];
  useEffect(function () {
    var t = setInterval(function () {
      setMoodIdx(function (n) {
        return n + 1;
      });
    }, 7000);
    return function () {
      clearInterval(t);
    };
  }, []);

  var liveDelta = 0;
  if (activo && vh) {
    var nowMs = ahora.getTime();
    var minuteStart = Math.floor(nowMs / 60000) * 60000;
    var fracSec = (nowMs - minuteStart) / 1000;
    var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
    var isHoliday = esFest(ahora);
    var factor = isHoliday ? (isNight ? 2.1 : 1.75) : isNight ? 1.35 : 1.0;
    var perSec = (vh / 3600) * factor;
    liveDelta = perSec * fracSec;
  }
  var displayAmount = calc.totalCOP + liveDelta;

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;
  var pctMes = Math.min(100, (displayAmount / props.salario) * 100);
  var tipos = Object.keys(calc.bd).filter(function (k) {
    return calc.bd[k].mins > 0;
  });

  return h(
    'div',
    { className: 'fadeUp' },
    // Tarjeta 1: Estimado del Mes
    h(
      'div',
      { className: 'card', style: { textAlign: 'center', borderRadius: '32px' } },
      h('div', { className: 'hero-eyebrow' }, 'Estimado este mes'),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'center', margin: '12px 0 16px' } },
        h(
          'div',
          { className: 'num-glass-card' + (activo ? ' hero-amount-live' : '') },
          h('div', { className: 'hero-amount' }, fCOP(displayAmount))
        )
      ),
      h(
        'div',
        { className: 'hero-sub' },
        h('span', null, fDur(calc.totalMins) + ' registradas'),
        h('span', { className: 'hero-sub-dot' }),
        h('span', null, 'meta ' + fCOP(props.salario))
      )
    ),

    // Frase IA · texto limpio, rota cada 7 s, abre el Asistente al tocar
    h(
      'div',
      {
        className: 'mood-line',
        onClick: function () {
          haptic();
          if (props.onOpenAssistant) props.onOpenAssistant();
        }
      },
      h('span', { className: 'mood-spark' }, '✦'),
      h(
        'span',
        { className: 'mood-phrase', key: moodIdx },
        moodPhrases[moodIdx % moodPhrases.length]
      )
    ),

    // Control de turno · botón flotante (sin tarjeta que lo encajone)
    h(
      'div',
      { className: 'action-stage', style: { marginTop: 0 } },
      h(
        'button',
        {
          className: 'action-btn ' + (activo ? 'action-btn-stop' : 'action-btn-go'),
          onClick: function () {
            haptic();
            activo ? props.onFin() : props.onIni();
          }
        },
        activo
          ? h(
              'svg',
              {
                className: 'action-icon',
                viewBox: '0 0 24 24',
                width: 30,
                height: 30,
                'aria-hidden': 'true'
              },
              h('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 3, fill: 'currentColor' })
            )
          : h(
              'svg',
              {
                className: 'action-icon',
                viewBox: '0 0 24 24',
                width: 34,
                height: 34,
                'aria-hidden': 'true'
              },
              h('path', {
                d: 'M14.5 2.5 L5.5 13 L11 13 L9.5 21.5 L18.5 11 L13 11 Z',
                fill: 'currentColor'
              })
            ),
        h('div', { className: 'action-lbl' }, activo ? 'Parar' : 'Iniciar')
      ),
      activo
        ? h(
            'div',
            { className: 'active-box' },
            h(
              'div',
              { className: 'active-tag' },
              (function() {
                var tipo = getTipoHoraActual(ahora, calc, turnos);
                return h(
                  'span',
                  {
                    className: 'active-tipo',
                    style: { color: tipo.color }
                  },
                  tipo.icon + ' ' + tipo.label
                );
              })()
            ),
            h(
              'div',
              { style: { margin: '8px 0' } },
              h(
                'div',
                { className: 'num-glass-card', style: { padding: '6px 20px' } },
                h(
                  'div',
                  { className: 'active-timer', style: { fontSize: '42px' } },
                  fDur(durActual)
                )
              )
            ),
            h(
              'div',
              { className: 'active-since' },
              'Desde ' +
                new Date(activo.inicio).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
            ),
            durActual >= U12H / 60000 - 60
              ? h('div', { className: 'active-warn' }, '⚠ Próximo recordatorio de 12h')
              : null
          )
        : null
    ),

    // Tarjeta 3: Avance del Salario Base
    h(
      'div',
      { className: 'card' },
      h(
        'div',
        { className: 'prog-row' },
        h('span', { className: 'prog-lbl' }, 'Avance del salario base'),
        h(
          'span',
          {
            className: 'prog-val',
            style: {
              color: pctMes >= 100 ? 'var(--success)' : activo ? 'var(--accent)' : 'var(--text)'
            }
          },
          pctMes.toFixed(1) + '%'
        )
      ),
      h(
        'div',
        { className: 'bar-track' },
        h('div', {
          className:
            'bar-fill' + (pctMes >= 100 ? ' bar-fill-over' : '') + (activo ? ' bar-fill-live' : ''),
          style: { width: pctMes + '%' }
        })
      )
    ),

    tipos.length > 0 ? h('div', { className: 'sec-lbl' }, 'Desglose por tipo') : null,
    tipos.length === 0
      ? h(
          'div',
          { className: 'empty' },
          h('div', { className: 'empty-ico' }, '⏱'),
          h('div', { className: 'empty-txt' }, 'Presiona INICIAR para comenzar'),
          h('div', { className: 'empty-sub' }, 'Tu turno se registra automáticamente')
        )
      : tipos.map(function (tipo) {
          var val = calc.bd[tipo],
            r = RC[tipo];
          return h(
            'div',
            { key: tipo, className: 'brk-row', style: { '--brk-color': r.color } },
            h(
              'div',
              { className: 'brk-l' },
              h(
                'div',
                {
                  className: 'brk-chip',
                  style: { '--chip-bg': r.bg, '--chip-bd': r.bd, color: r.color }
                },
                r.icon
              ),
              h(
                'div',
                { className: 'brk-meta' },
                h('div', { className: 'brk-name' }, r.label),
                h(
                  'div',
                  { className: 'brk-detail' },
                  h('span', null, fDur(val.mins)),
                  h('span', { className: 'brk-detail-sep' }),
                  h('span', null, '×' + r.factor.toFixed(2))
                )
              )
            ),
            h('div', { className: 'brk-amount' }, fCOP(val.cop))
          );
        })
  );
}
