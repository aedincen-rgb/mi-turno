// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/onboarding.js
//  Tour guiado de 3 pasos para nuevos usuarios.
//  Spotlight + tarjeta con instrucciones. Solo en primer launch.
// ════════════════════════════════════════════════════════════════

// ─── CHECK: ¿ya hizo el onboarding? ────────────────────────────
function onboardingDone() {
  try { return localStorage.getItem('mt_onboarding_done') === '1'; }
  catch (_) { return true; }
}
function onboardingMarkDone() {
  try { localStorage.setItem('mt_onboarding_done', '1'); } catch (_) {}
}

// ─── STEPS ──────────────────────────────────────────────────────
var ONBOARDING_STEPS = [
  {
    id: 'salary',
    title: 'Configurá tu salario',
    body: 'Acá ponés cuánto ganás por mes. Es la base para todos los cálculos de recargos, extras y proyecciones.',
    target: function () {
      // Pestaña Ajustes (último tab)
      var tabs = document.querySelectorAll('.tabs button');
      return tabs && tabs.length >= 5 ? tabs[4] : null;
    },
    ringColor: '#ff9500'
  },
  {
    id: 'turno',
    title: 'Iniciá tu primer turno',
    body: 'Tocá este botón al llegar al trabajo. Yo calculo tus recargos en tiempo real — nocturno, festivo, extra. Cuando termines, lo cerrás.',
    target: function () {
      return document.querySelector('.hero-act-btn') ||
             document.querySelector('[class*=\"action\"] button') ||
             document.querySelector('.tab-content button');
    },
    ringColor: '#34c759'
  },
  {
    id: 'ai',
    title: 'Preguntame lo que quieras',
    body: 'Acá está tu asistente. Sabe de leyes colombianas, recargos, festivos. "¿Cuánto gané hoy?", "¿Y el mes pasado?". Probá, es gratis.',
    target: function () {
      var tabs = document.querySelectorAll('.tabs button');
      return tabs && tabs.length >= 3 ? tabs[2] : null;
    },
    ringColor: '#007aff'
  }
];

// ─── COMPONENTE ONBOARDING ──────────────────────────────────────
function OnboardingModal(props) {
  var stepState = useState(0);
  var step = stepState[0], setStep = stepState[1];
  var ringStyle = useState({});
  var ring = ringStyle[0], setRing = ringStyle[1];
  var visible = useState(false);
  var show = visible[0], setShow = visible[1];

  // Pequeño delay para que el DOM esté listo antes de calcular posición
  useEffect(function () {
    var t = setTimeout(function () { setShow(true); }, 400);
    return function () { clearTimeout(t); };
  }, []);

  // Recalcular posición del ring cuando cambia el step
  useEffect(function () {
    if (!show) return;
    var s = ONBOARDING_STEPS[step];
    if (!s || !s.target) return;
    // Pequeño delay para que el layout se asiente
    var t = setTimeout(function () {
      var el = typeof s.target === 'function' ? s.target() : null;
      if (el) {
        var r = el.getBoundingClientRect();
        setRing({
          top: r.top - 8,
          left: r.left - 8,
          width: r.width + 16,
          height: r.height + 16,
          color: s.ringColor,
          visible: true
        });
      } else {
        setRing({ visible: false });
      }
    }, 300);
    return function () { clearTimeout(t); };
  }, [step, show]);

  function next() {
    if (step >= ONBOARDING_STEPS.length - 1) {
      onboardingMarkDone();
      if (props.onDone) props.onDone();
      return;
    }
    haptic();
    setStep(step + 1);
  }

  function skip() {
    haptic();
    onboardingMarkDone();
    if (props.onDone) props.onDone();
  }

  if (!show) return null;

  var s = ONBOARDING_STEPS[step];
  var isLast = step >= ONBOARDING_STEPS.length - 1;

  return h(
    'div',
    {
      className: 'onboard-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Tutorial: ' + s.title
    },
    // Capa oscura con "agujero" donde está el target
    h('div', { className: 'onboard-mask', onClick: skip }),

    // Ring de spotlight alrededor del target
    ring.visible
      ? h('div', {
          className: 'onboard-ring',
          style: {
            top: ring.top + 'px',
            left: ring.left + 'px',
            width: ring.width + 'px',
            height: ring.height + 'px',
            '--ring-color': ring.color
          }
        })
      : null,

    // Tarjeta de instrucción
    h(
      'div',
      { className: 'onboard-card' },
      // Dots de progreso
      h(
        'div',
        { className: 'onboard-dots' },
        ONBOARDING_STEPS.map(function (_, i) {
          return h('div', {
            key: i,
            className: 'onboard-dot' + (i === step ? ' active' : '') +
                       (i < step ? ' done' : '')
          });
        })
      ),
      h('div', { className: 'onboard-step-num' }, (step + 1) + ' de ' + ONBOARDING_STEPS.length),
      h('h2', { className: 'onboard-title' }, s.title),
      h('p', { className: 'onboard-body' }, s.body),
      h(
        'div',
        { className: 'onboard-actions' },
        h('button', { className: 'onboard-skip', onClick: skip }, 'Saltar'),
        h(
          'button',
          { className: 'onboard-next', onClick: next },
          isLast ? '¡Listo! ✨' : 'Siguiente →'
        )
      )
    )
  );
}
