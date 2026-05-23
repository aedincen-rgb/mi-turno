// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/dashboard.js
//  Tab Análisis: proyección y KPIs
// ════════════════════════════════════════════════════════════════
function DashboardTab(props) {
  var calc = props.calc,
    turnos = props.turnos,
    salario = props.salario,
    vh = props.vh,
    ahora = props.ahora;
  var prefs = props.prefs || { auxTransp: false, prestaciones: false, quincenaMode: false };
  var modoQuincena = !!prefs.quincenaMode && props.quincenasMes;
  var canvasRef = useRef(null);
  var chartRef = useRef(null);

  var ctx = useMemo(
    function () {
      var ini = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      var diaActual = ahora.getDate();
      var turnosMes = turnos.filter(function (t) {
        return new Date(t.inicio) >= ini;
      });
      var dias = calcPorDia(turnosMes, vh);
      var diasTrab = dias.length;
      var totalMins = calc.totalMins,
        totalCOP = calc.totalCOP;
      var prom = diasTrab > 0 ? totalCOP / diasTrab : 0;
      var promHoras = diasTrab > 0 ? totalMins / diasTrab / 60 : 0;
      var mejor =
        dias.length > 0
          ? dias.reduce(function (a, b) {
              return b.cop > a.cop ? b : a;
            }, dias[0])
          : null;
      var festMins =
        (calc.bd.diurnaFest?.mins || 0) +
        (calc.bd.noctFest?.mins || 0) +
        (calc.bd.extraFestDiur?.mins || 0) +
        (calc.bd.extraFestNoct?.mins || 0);
      var noctMins =
        (calc.bd.noctOrd?.mins || 0) +
        (calc.bd.extraNoct?.mins || 0) +
        (calc.bd.noctFest?.mins || 0) +
        (calc.bd.extraFestNoct?.mins || 0);
      var proy = diaActual > 0 ? (totalCOP / diaActual) * diasMes : 0;
      var pctSalario = (totalCOP / salario) * 100;
      return {
        dias: dias,
        diasTrab: diasTrab,
        diasMes: diasMes,
        diaActual: diaActual,
        prom: prom,
        promHoras: promHoras,
        mejor: mejor,
        festMins: festMins,
        noctMins: noctMins,
        proy: proy,
        pctSalario: pctSalario,
        totalMins: totalMins,
        totalCOP: totalCOP,
        turnosMes: turnosMes
      };
    },
    [calc, turnos, salario, vh, ahora.getMonth(), ahora.getDate()]
  );

  useEffect(
    function () {
      if (!canvasRef.current || !window.Chart) return;
      var tipos = Object.keys(calc.bd).filter(function (k) {
        return calc.bd[k].mins > 0;
      });
      if (tipos.length === 0) {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
        return;
      }
      var labels = tipos.map(function (k) {
        return RC[k].short;
      });
      var data = tipos.map(function (k) {
        return Math.round(calc.bd[k].cop);
      });
      var colors = tipos.map(function (k) {
        return RC[k].color;
      });
      if (chartRef.current) chartRef.current.destroy();
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 10 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateScale: true, duration: 900, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: isDark ? '#7a7a8a' : '#7a7a7a',
                font: { size: 10, family: 'DM Sans', weight: '600' },
                padding: 10,
                usePointStyle: true,
                boxWidth: 7
              }
            },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return ' ' + c.label + ': ' + fCOP(c.raw);
                }
              },
              backgroundColor: 'rgba(20,20,24,0.94)',
              titleColor: '#d4ae74',
              bodyColor: '#fff',
              padding: 10,
              cornerRadius: 10
            }
          },
          cutout: '68%'
        }
      });
      return function () {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    },
    [calc, props.themeKey]
  );

  if (ctx.diasTrab === 0) {
    return h(
      'div',
      { className: 'fadeUp' },
      h(
        'div',
        { className: 'dash-hero' },
        h('div', { className: 'dash-hero-label' }, 'Proyección al cierre del mes'),
        h('div', { className: 'dash-hero-amount' }, fCOP(0)),
        h('div', { className: 'dash-hero-sub' }, 'Sin turnos registrados aún')
      ),
      h(
        'div',
        { className: 'empty' },
        h('div', { className: 'empty-ico' }, '📊'),
        h('div', { className: 'empty-txt' }, 'Sin datos para mostrar'),
        h('div', { className: 'empty-sub' }, 'Registra tu primer turno para ver el análisis')
      )
    );
  }

  var ritmoBadge = '';
  if (ctx.pctSalario >= (ctx.diaActual / ctx.diasMes) * 100 * 1.1)
    ritmoBadge = '↑ Por encima del ritmo';
  else if (ctx.pctSalario >= (ctx.diaActual / ctx.diasMes) * 100 * 0.9) ritmoBadge = '✓ Buen ritmo';
  else ritmoBadge = '↓ Por debajo del ritmo';

  var tip = '';
  if (ctx.festMins > 0)
    tip =
      'Has trabajado <strong>' +
      fDur(ctx.festMins) +
      '</strong> en festivos, esos turnos pagan con recargo del 75% al 150%.';
  else if (ctx.noctMins > ctx.totalMins * 0.4)
    tip =
      'El ' +
      ((ctx.noctMins / ctx.totalMins) * 100).toFixed(0) +
      '% de tus horas son <strong>nocturnas</strong>, eso eleva tu salario.';
  else
    tip =
      'Con tu promedio de <strong>' +
      fCOP(ctx.prom) +
      '</strong> por turno, vas camino a <strong>' +
      fCOP(ctx.proy) +
      '</strong>.';

  var maxVal = Math.max.apply(
    null,
    ctx.dias
      .map(function (d) {
        return d.cop;
      })
      .concat([1])
  );
  var CH = 124;

  // Q1 / Q2 cards (solo cuando el modo quincenal está activo)
  var quincenaBlock = null;
  if (modoQuincena) {
    var qs = props.quincenasMes;
    var extQ = typeof calcularExtras === 'function' ? calcularExtras(salario, prefs, 0.5) : { total: 0 };
    var ahoraMs = ahora.getTime();
    function qStatus(q) {
      if (ahoraMs < q.rango.ini.getTime()) return 'Próxima';
      if (ahoraMs >= q.rango.fin.getTime()) return 'Cerrada';
      return 'En curso';
    }
    quincenaBlock = h(
      'div',
      { className: 'dash-kpi-grid', style: { marginBottom: '16px' } },
      [qs.q1, qs.q2].map(function (q) {
        var total = q.calc.totalCOP + extQ.total;
        return h(
          'div',
          { key: q.rango.label, className: 'kpi-card' },
          h(
            'div',
            { className: 'kpi-label' },
            q.rango.label + ' · ' + qStatus(q)
          ),
          h('div', { className: 'kpi-val accent' }, fCOP(total)),
          h(
            'div',
            { className: 'kpi-sub' },
            formatRangoCorto(q.rango) +
              ' · ' +
              fDur(q.calc.totalMins)
          )
        );
      })
    );
  }

  return h(
    'div',
    { className: 'fadeUp' },
    quincenaBlock,
    h(
      'div',
      { className: 'dash-hero' },
      h('div', { className: 'dash-hero-label' }, 'Proyección al cierre del mes'),
      h('div', { className: 'dash-hero-amount' }, fCOP(ctx.proy)),
      h(
        'div',
        { className: 'dash-hero-sub' },
        'Basado en ' +
          ctx.diasTrab +
          ' día' +
          (ctx.diasTrab !== 1 ? 's' : '') +
          ' · promedio ' +
          fCOP(ctx.prom)
      ),
      h('div', { className: 'ritmo-badge' }, ritmoBadge)
    ),

    h(
      'div',
      { className: 'dash-kpi-grid' },
      h(
        'div',
        { className: 'kpi-card' },
        h('div', { className: 'kpi-label' }, 'Días Trabajados'),
        h('div', { className: 'kpi-val accent' }, ctx.diasTrab),
        h('div', { className: 'kpi-sub' }, 'de ' + ctx.diasMes + ' del mes')
      ),
      h(
        'div',
        { className: 'kpi-card' },
        h('div', { className: 'kpi-label' }, 'Horas Totales'),
        h('div', { className: 'kpi-val' }, (ctx.totalMins / 60).toFixed(1) + 'h'),
        h('div', { className: 'kpi-sub' }, ctx.promHoras.toFixed(1) + 'h promedio')
      ),
      h(
        'div',
        { className: 'kpi-card' },
        h('div', { className: 'kpi-label' }, 'Promedio'),
        h('div', { className: 'kpi-val' }, fCOP(ctx.prom)),
        h('div', { className: 'kpi-sub' }, 'por turno')
      ),
      h(
        'div',
        { className: 'kpi-card' },
        h('div', { className: 'kpi-label' }, 'Mejor Día'),
        h('div', { className: 'kpi-val accent' }, ctx.mejor ? fCOP(ctx.mejor.cop) : '—'),
        h(
          'div',
          { className: 'kpi-sub' },
          ctx.mejor
            ? new Date(ctx.mejor.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short'
              })
            : '—'
        )
      )
    ),

    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Ingreso por día trabajado'),
      h(
        'div',
        { className: 'bar-chart-wrap' },
        ctx.dias.map(function (d) {
          var hh = Math.max(Math.round((d.cop / maxVal) * CH), 4);
          var cls = d.fest ? 'bf-fest' : d.noct ? 'bf-noc' : '';
          return h(
            'div',
            { key: d.fecha, className: 'bar-col' },
            h('div', {
              className: 'bar-fill-v ' + cls,
              style: { height: hh + 'px' },
              title: d.fecha + ': ' + fCOP(d.cop)
            }),
            h('div', { className: 'bar-label' }, d.fecha.slice(8))
          );
        })
      )
    ),

    Object.keys(calc.bd).filter(function (k) {
      return calc.bd[k].mins > 0;
    }).length > 0
      ? h(
          'div',
          { className: 'card' },
          h('div', { className: 'card-ttl' }, 'Distribución por recargo'),
          h('div', { className: 'chart-wrap' }, h('canvas', { ref: canvasRef }))
        )
      : null,

    h('div', { className: 'tip-box', dangerouslySetInnerHTML: { __html: tip } })
  );
}
