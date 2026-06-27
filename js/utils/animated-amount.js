// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/animated-amount.js
//  Número que "cuenta" hasta su valor — narrativa del dato (2026).
//  Reusable: <AnimatedCOP value={n} className="hero-amount" tag="div" />
// ════════════════════════════════════════════════════════════════
// Reglas de la casa: ES5 (var, sin arrow), hooks globales de react-init.js,
// fCOP de utils/format.js. Respeta prefers-reduced-motion y NO re-anima si el
// valor objetivo no cambió (evita jitter cuando el padre re-renderiza, p.ej.
// la frase del asistente que rota cada 7s o el tick de un turno activo).
function AnimatedCOP(props) {
  var target = typeof props.value === 'number' ? props.value : 0;
  var dur = props.duration || 900;
  var ds = useState(target);
  var display = ds[0];
  var setDisplay = ds[1];
  var prev = useRef(target);
  var raf = useRef(0);

  useEffect(
    function () {
      var from = prev.current;
      var to = target;
      prev.current = to;

      var reduce = false;
      try {
        reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {}

      // Salto directo: sin cambio, accesibilidad, o pedido explícito.
      if (reduce || props.instant || from === to) {
        setDisplay(to);
        return;
      }

      var start = 0;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setDisplay(Math.round(from + (to - from) * eased));
        if (p < 1) raf.current = window.requestAnimationFrame(step);
      }
      raf.current = window.requestAnimationFrame(step);

      return function () {
        if (raf.current) window.cancelAnimationFrame(raf.current);
      };
    },
    [target]
  );

  return h(props.tag || 'span', { className: props.className || null }, fCOP(display));
}

window.AnimatedCOP = AnimatedCOP;
