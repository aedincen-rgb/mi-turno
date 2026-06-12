// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/home.js
//  Tab Inicio: turno activo y controles
// ════════════════════════════════════════════════════════════════

// ── Saldo ordinario semanal restante (turnos cerrados) ───────
// Devuelve los minutos ordinarios que quedan en la semana actual
// antes de contar el turno activo. Usa la misma lógica min(8h, semanal).
function _semOrdRestante(ahora, turnos) {
  var lun = semLun(ahora);
  var semOrd = getHSEM(lun) * 60;
  if (!turnos) return semOrd;
  var ts = turnos
    .filter(function (t) {
      return t.fin && new Date(t.inicio) >= lun;
    })
    .sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
  ts.forEach(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return;
    var mOrd = Math.min(8 * 60, semOrd);
    var cats = calcCats(ini, fin, mOrd);
    var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
    semOrd = Math.max(0, semOrd - ord);
  });
  return semOrd;
}

// ── Helper: tipo de hora actual ──────────────────────────────
// limiteT = min(8h del día, saldo semanal restante) calculado en HomeTab
function getTipoHoraActual(ahora, durMins, limiteT) {
  var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
  var isHoliday = esFest(ahora);
  var isExtra = durMins >= limiteT;

  if (isHoliday) {
    if (isExtra) return isNight ? RC.extraFestNoct : RC.extraFestDiur;
    return isNight ? RC.noctFest : RC.diurnaFest;
  } else {
    if (isExtra) return isNight ? RC.extraNoct : RC.extraDiurna;
    return isNight ? RC.noctOrd : RC.diurnaOrd;
  }
}

function HomeTab(props) {
  var prefs =
    props.prefs ||
    (typeof QUINCENA_PREFS_DEFAULT !== 'undefined'
      ? QUINCENA_PREFS_DEFAULT
      : { auxTransp: false, prestaciones: false, quincenaMode: false });
  var modoQuincena = !!prefs.quincenaMode && props.quincena;
  // Si el modo quincenal está activo usamos el cálculo filtrado al rango,
  // si no, el cálculo mensual estándar.
  var calc = modoQuincena ? props.quincena.calc : props.calc;
  var activo = props.activo,
    ahora = props.ahora,
    vh = props.vh,
    turnos = props.turnos;

  // Onboarding del primer turno: tooltip sobre el botón INICIAR.
  // Se muestra solo cuando no hay turnos ni turno activo, y no fue descartado antes.
  var ob = useState(function () {
    if (activo) return false;
    if (turnos && turnos.length > 0) return false;
    return !leer('mt_ob_done', false);
  });
  var showOb = ob[0],
    setShowOb = ob[1];

  // Ocultar el tooltip en cuanto el usuario inicia su primer turno
  useEffect(
    function () {
      if (activo && showOb) {
        grabar('mt_ob_done', true);
        setShowOb(false);
      }
      if (turnos && turnos.length > 0 && showOb) {
        grabar('mt_ob_done', true);
        setShowOb(false);
      }
    },
    [activo, turnos]
  );

  function dismissOb() {
    grabar('mt_ob_done', true);
    setShowOb(false);
  }

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

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;
  // Límite ordinario del turno activo: el menor entre 8h diarias y el saldo semanal de 46h
  var limiteActivo = Math.min(8 * 60, _semOrdRestante(ahora, turnos));
  var liveDelta = 0;
  if (activo && vh) {
    var nowMs = ahora.getTime();
    var minuteStart = Math.floor(nowMs / 60000) * 60000;
    var fracSec = (nowMs - minuteStart) / 1000;
    var isNight = ahora.getHours() >= 21 || ahora.getHours() < 6;
    var isHoliday = esFest(ahora);
    var isExtra = durActual >= limiteActivo;
    // Matriz completa: noche × festivo × extra
    var factor = isExtra
      ? isHoliday
        ? isNight
          ? 2.5
          : 2.0
        : isNight
          ? 1.75
          : 1.25
      : isHoliday
        ? isNight
          ? 2.1
          : 1.75
        : isNight
          ? 1.35
          : 1.0;
    var perSec = (vh / 3600) * factor;
    liveDelta = perSec * fracSec;
  }
  // El "tick" en vivo se cuenta solo si el turno activo cae dentro de la quincena
  var aplicaLive = true;
  if (modoQuincena && activo) {
    var iniAct = new Date(activo.inicio);
    aplicaLive = iniAct >= props.quincena.rango.ini && iniAct < props.quincena.rango.fin;
  }
  var subTotal = calc.totalCOP + (aplicaLive ? liveDelta : 0);
  // Proporción para los extras: en modo quincenal sumamos la mitad
  var propExtras = modoQuincena ? 0.5 : 1;
  var extras =
    typeof calcularExtras === 'function'
      ? calcularExtras(props.salario, prefs, propExtras)
      : { aux: 0, prest: 0, total: 0 };
  var displayAmount = subTotal + extras.total;
  // Meta: salario completo o medio salario en modo quincena
  var metaSalario = modoQuincena ? props.salario / 2 : props.salario;
  var pctMes = metaSalario > 0 ? Math.min(100, (displayAmount / metaSalario) * 100) : 0;
  var tipos = Object.keys(calc.bd).filter(function (k) {
    return calc.bd[k].mins > 0;
  });

  // Aviso si el usuario nunca confirmó su salario en Ajustes.
  // Si props.salarioConfigured no viene (app-main viejo en caché),
  // caemos al heurístico viejo (<= SMIN) para compatibilidad.
  var salarioSinConfig =
    typeof props.salarioConfigured === 'boolean' ? !props.salarioConfigured : props.salario <= SMIN;

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Inicio' },
    // Aviso de salario no configurado
    salarioSinConfig
      ? h(
          'div',
          {
            className: 'card',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--warn-dim)',
              border: '1.5px solid var(--warn)',
              borderRadius: '18px',
              padding: '14px 16px',
              marginBottom: '4px'
            }
          },
          h('span', { style: { fontSize: '20px', flexShrink: 0 } }, '⚠️'),
          h(
            'div',
            { style: { flex: 1 } },
            h(
              'div',
              {
                style: {
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: 'var(--warn)',
                  marginBottom: '2px'
                }
              },
              'Salario no configurado'
            ),
            h(
              'div',
              { style: { fontSize: '12.5px', color: 'var(--text-2)' } },
              'Estás usando el salario mínimo legal. El estimado podría estar muy por debajo de tu salario real.'
            )
          ),
          h(
            'button',
            {
              style: {
                flexShrink: 0,
                background: 'var(--warn)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              },
              onClick: function () {
                haptic();
                if (props.onOpenConfig) props.onOpenConfig();
              }
            },
            'Ajustar'
          )
        )
      : null,
    // Tarjeta 1: Estimado (mes o quincena)
    h(
      'div',
      {
        className: 'card',
        style: { textAlign: 'center', borderRadius: '32px' },
        'aria-label': 'Estimado de ganancia: ' + fCOP(displayAmount)
      },
      h(
        'div',
        { className: 'hero-eyebrow' },
        modoQuincena
          ? 'Estimado ' +
              props.quincena.rango.label +
              ' · ' +
              formatRangoCorto(props.quincena.rango)
          : 'Estimado este mes'
      ),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'center', margin: '12px 0 16px' } },
        h(
          'div',
          { className: 'num-glass-card' + (activo && aplicaLive ? ' hero-amount-live' : '') },
          h('div', { className: 'hero-amount' }, fCOP(displayAmount))
        )
      ),
      h(
        'div',
        { className: 'hero-sub' },
        // Mensaje amable cuando la quincena recién arranca y no hay turnos
        // todavía: evita el susto de leer "0h 00m registradas" como si la
        // app hubiera perdido datos. Solo aplica en modo quincenal.
        modoQuincena && calc.totalMins === 0
          ? h(
              'span',
              null,
              'Sin turnos en ' +
                (props.quincena && props.quincena.rango && props.quincena.rango.label
                  ? props.quincena.rango.label
                  : 'esta quincena') +
                ' todavía'
            )
          : h('span', null, fDur(calc.totalMins) + ' registradas'),
        h('span', { className: 'hero-sub-dot' }),
        h('span', null, 'meta ' + fCOP(metaSalario))
      ),
      extras.total > 0
        ? h(
            'div',
            {
              className: 'hero-sub',
              style: { marginTop: '6px', fontSize: '11.5px', opacity: 0.78 }
            },
            'Incluye ',
            extras.aux > 0 ? h('span', null, 'aux. transporte ' + fCOP(extras.aux)) : null,
            extras.aux > 0 && extras.prest > 0 ? h('span', { className: 'hero-sub-dot' }) : null,
            extras.prest > 0 ? h('span', null, 'prestaciones ' + fCOP(extras.prest)) : null
          )
        : null
    ),

    // Frase IA · texto limpio, rota cada 7 s, abre el Asistente al tocar
    h(
      'div',
      {
        className: 'mood-line',
        'aria-label': 'Consejo del asistente IA',
        'aria-live': 'polite',
        'aria-atomic': 'true',
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

    // Control de turno · tarjeta horizontal "Toca para iniciar"
    h(
      'div',
      { className: 'action-stage', style: { marginTop: 0 } },
      h(
        'button',
        {
          className: 'start-card ' + (activo ? 'start-card--stop' : 'start-card--go'),
          'aria-label': activo ? 'Detener turno' : 'Iniciar turno',
          onClick: function () {
            haptic();
            activo ? props.onFin() : props.onIni();
          }
        },
        h(
          'span',
          { className: 'start-card-text' },
          activo ? 'Toca para detener' : 'Toca para iniciar'
        ),
        h(
          'span',
          { className: 'start-card-circle', 'aria-hidden': 'true' },
          activo
            ? h(
                'svg',
                { viewBox: '0 0 24 24', width: 20, height: 20 },
                h('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 3, fill: 'currentColor' })
              )
            : h(
                'svg',
                { viewBox: '0 0 24 24', width: 24, height: 24 },
                h('path', {
                  d: 'M9 5l7 7-7 7',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 2.6,
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round'
                })
              )
        )
      ),
      activo
        ? h(
            'div',
            { className: 'active-box' },
            h(
              'div',
              { className: 'active-tag' },
              (function () {
                var tipo = getTipoHoraActual(ahora, durActual, limiteActivo);
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
        h(
          'span',
          { className: 'prog-lbl' },
          modoQuincena ? 'Avance de la quincena' : 'Avance del salario base'
        ),
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

    // Tooltip onboarding — debajo del botón, flujo normal, no tapado por el header
    showOb &&
      h(
        'div',
        {
          style: {
            textAlign: 'center',
            animation: 'ob-float 2.4s ease-in-out infinite',
            marginBottom: '8px'
          }
        },
        // Flecha apuntando hacia arriba (al botón)
        h('div', {
          style: {
            width: 0,
            height: 0,
            margin: '0 auto 6px',
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '10px solid var(--accent-deep)'
          }
        }),
        // Burbuja
        h(
          'div',
          {
            style: {
              display: 'inline-block',
              background: 'var(--accent-deep)',
              color: '#fff',
              borderRadius: '16px',
              padding: '11px 18px',
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: 1.4,
              boxShadow: '0 4px 20px rgba(79,115,248,0.35)',
              cursor: 'pointer'
            },
            onClick: dismissOb
          },
          'Tocá para iniciar tu primer turno ⚡'
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
