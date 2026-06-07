// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/dashboard.js
//  Tab Análisis: proyección y KPIs
// ════════════════════════════════════════════════════════════════
/* global h, useState, useRef, useMemo, useEffect, RC, window, document */

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
  var lineCanvasRef = useRef(null);
  var lineChartRef = useRef(null);

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
        ((calc.bd.diurnaFest || {}).mins || 0) +
        ((calc.bd.noctFest || {}).mins || 0) +
        ((calc.bd.extraFestDiur || {}).mins || 0) +
        ((calc.bd.extraFestNoct || {}).mins || 0);
      var noctMins =
        ((calc.bd.noctOrd || {}).mins || 0) +
        ((calc.bd.extraNoct || {}).mins || 0) +
        ((calc.bd.noctFest || {}).mins || 0) +
        ((calc.bd.extraFestNoct || {}).mins || 0);
      var proy = diaActual > 0 ? (totalCOP / diaActual) * diasMes : 0;
      var pctSalario = (totalCOP / salario) * 100;
      // Datos acumulados para gráfica de línea
      var acumData = [];
      var acum = 0;
      var metaDiaria = salario / diasMes;
      var lineaProy = [];
      dias.forEach(function (d, i) {
        acum += d.cop;
        acumData.push({ dia: i + 1, fecha: d.fecha, cop: Math.round(acum) });
        lineaProy.push({ dia: i + 1, cop: Math.round(metaDiaria * (i + 1)) });
      });
      // Días restantes
      var diasRestantes = diasMes - diaActual;
      var diasHabilesRest = 0;
      for (var dr = diaActual + 1; dr <= diasMes; dr++) {
        var fd = new Date(ahora.getFullYear(), ahora.getMonth(), dr);
        if (fd.getDay() !== 0) diasHabilesRest++;
      }
      // Eficiencia: COP/hora
      var eficiencia = totalMins > 0 ? totalCOP / (totalMins / 60) : 0;
      // % de horas extras
      var extrasMins =
        ((calc.bd.extraDiurna || {}).mins || 0) +
        ((calc.bd.extraNoct || {}).mins || 0) +
        ((calc.bd.extraFestDiur || {}).mins || 0) +
        ((calc.bd.extraFestNoct || {}).mins || 0);
      var pctExtras = totalMins > 0 ? (extrasMins / totalMins) * 100 : 0;
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
        turnosMes: turnosMes,
        acumData: acumData,
        lineaProy: lineaProy,
        diasRestantes: diasRestantes,
        diasHabilesRest: diasHabilesRest,
        eficiencia: eficiencia,
        extrasMins: extrasMins,
        pctExtras: pctExtras
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

  // ── Gráfica de línea: ingreso acumulado del mes ──
  useEffect(
    function () {
      if (!lineCanvasRef.current || !window.Chart) return;
      var acum = ctx.acumData;
      var proy = ctx.lineaProy;
      if (acum.length === 0) {
        if (lineChartRef.current) {
          lineChartRef.current.destroy();
          lineChartRef.current = null;
        }
        return;
      }
      if (lineChartRef.current) lineChartRef.current.destroy();
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      var textColor = isDark ? '#7a7a8a' : '#7a7a7a';
      lineChartRef.current = new window.Chart(lineCanvasRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: acum.map(function (d) { return d.fecha.slice(8); }),
          datasets: [
            {
              label: 'Acumulado real',
              data: acum.map(function (d) { return d.cop; }),
              borderColor: '#5b86e5',
              backgroundColor: 'rgba(91,134,229,0.08)',
              borderWidth: 2.5,
              pointRadius: acum.length <= 10 ? 4 : 2,
              pointBackgroundColor: '#5b86e5',
              pointBorderColor: '#fff',
              pointBorderWidth: 1.5,
              tension: 0.35,
              fill: true
            },
            {
              label: 'Proyección lineal',
              data: proy.map(function (d) { return d.cop; }),
              borderColor: isDark ? 'rgba(125,168,255,0.4)' : 'rgba(91,134,229,0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              tension: 0.35,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutQuart' },
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: { size: 10, family: 'DM Sans', weight: '600' },
                padding: 12,
                usePointStyle: true,
                boxWidth: 7
              }
            },
            tooltip: {
              callbacks: {
                label: function (c) {
                  return ' ' + c.dataset.label + ': ' + fCOP(c.raw);
                }
              },
              backgroundColor: 'rgba(20,20,24,0.94)',
              titleColor: '#d4ae74',
              bodyColor: '#fff',
              padding: 10,
              cornerRadius: 10
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 9, family: 'DM Sans' },
                maxTicksLimit: 10,
                maxRotation: 0
              }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 9, family: 'DM Sans' },
                callback: function (v) { return fCOP(v); }
              }
            }
          }
        }
      });
      return function () {
        if (lineChartRef.current) {
          lineChartRef.current.destroy();
          lineChartRef.current = null;
        }
      };
    },
    [ctx.acumData, props.themeKey]
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
    var extQ =
      typeof calcularExtras === 'function' ? calcularExtras(salario, prefs, 0.5) : { total: 0 };
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
          h('div', { className: 'kpi-label' }, q.rango.label + ' · ' + qStatus(q)),
          h('div', { className: 'kpi-val accent' }, fCOP(total)),
          h(
            'div',
            { className: 'kpi-sub' },
            formatRangoCorto(q.rango) + ' · ' + fDur(q.calc.totalMins)
          )
        );
      })
    );
  }

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Análisis y proyección' },
    quincenaBlock,
    h(
      'div',
      {
        className: 'dash-hero',
        'aria-label': 'Proyección: ' + fCOP(ctx.proy) + ' al cierre del mes'
      },
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
      h(
        'div',
        { className: 'ritmo-badge', 'aria-label': 'Estado de ritmo: ' + ritmoBadge },
        ritmoBadge
      )
    ),

    // ── Mini KPI strip: eficiencia, extras, días restantes ──
    h(
      'div',
      { className: 'dash-mini-strip' },
      h(
        'div',
        { className: 'dash-mini-stat', 'aria-label': 'Valor por hora: ' + fCOP(ctx.eficiencia) },
        h('div', { className: 'dash-mini-stat-val accent' }, fCOP(ctx.eficiencia)),
        h('div', { className: 'dash-mini-stat-lbl' }, 'por hora')
      ),
      h(
        'div',
        {
          className: 'dash-mini-stat',
          'aria-label': 'Horas extra: ' + ctx.pctExtras.toFixed(0) + '%'
        },
        h('div', { className: 'dash-mini-stat-val' }, ctx.pctExtras.toFixed(0) + '%'),
        h('div', { className: 'dash-mini-stat-lbl' }, 'extra')
      ),
      h(
        'div',
        {
          className: 'dash-mini-stat',
          'aria-label': 'Días restantes: ' + ctx.diasRestantes
        },
        h('div', { className: 'dash-mini-stat-val' }, ctx.diasRestantes),
        h('div', { className: 'dash-mini-stat-lbl' }, 'días rest.')
      )
    ),

    h(
      'div',
      { className: 'dash-kpi-grid' },
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Días trabajados: ' + ctx.diasTrab + ' de ' + ctx.diasMes
        },
        h('div', { className: 'kpi-label' }, 'Días Trabajados'),
        h('div', { className: 'kpi-val accent' }, ctx.diasTrab),
        h('div', { className: 'kpi-sub' }, 'de ' + ctx.diasMes + ' del mes')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Horas totales: ' + (ctx.totalMins / 60).toFixed(1) + ' horas'
        },
        h('div', { className: 'kpi-label' }, 'Horas Totales'),
        h('div', { className: 'kpi-val' }, (ctx.totalMins / 60).toFixed(1) + 'h'),
        h('div', { className: 'kpi-sub' }, ctx.promHoras.toFixed(1) + 'h promedio')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label': 'Promedio por turno: ' + fCOP(ctx.prom)
        },
        h('div', { className: 'kpi-label' }, 'Promedio'),
        h('div', { className: 'kpi-val' }, fCOP(ctx.prom)),
        h('div', { className: 'kpi-sub' }, 'por turno')
      ),
      h(
        'div',
        {
          className: 'kpi-card',
          'aria-label':
            'Mejor día: ' +
            (ctx.mejor
              ? fCOP(ctx.mejor.cop) +
                ' el ' +
                new Date(ctx.mejor.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short'
                })
              : 'Sin datos')
        },
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
      ),
      h(
        'div',
        { className: 'bar-legend' },
        h('div', { className: 'bar-legend-item' },
          h('div', { className: 'bar-legend-dot ld-reg' }), 'Normal'
        ),
        h('div', { className: 'bar-legend-item' },
          h('div', { className: 'bar-legend-dot ld-fest' }), 'Festivo'
        ),
        h('div', { className: 'bar-legend-item' },
          h('div', { className: 'bar-legend-dot ld-noc' }), 'Nocturno'
        )
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

    // ── Anillo de progreso: % del salario base ──
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Progreso sobre salario base'),
      h(
        'div',
        { className: 'progress-ring-card' },
        h(
          'div',
          { className: 'progress-ring-wrap', 'aria-label': 'Avance: ' + ctx.pctSalario.toFixed(0) + '% del salario base' },
          h(
            'svg',
            { className: 'progress-ring-svg', viewBox: '0 0 100 100' },
            h('defs', null,
              h('linearGradient', { id: 'prGrad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
                h('stop', { offset: '0%', stopColor: '#4166d4' }),
                h('stop', { offset: '50%', stopColor: '#5b86e5' }),
                h('stop', { offset: '100%', stopColor: '#7da8ff' })
              )
            ),
            h('circle', {
              className: 'progress-ring-bg',
              cx: '50', cy: '50', r: '42'
            }),
            h('circle', {
              className: 'progress-ring-fg',
              cx: '50', cy: '50', r: '42',
              strokeDasharray: 2 * Math.PI * 42,
              strokeDashoffset: 2 * Math.PI * 42 * (1 - Math.min(ctx.pctSalario / 100, 1))
            })
          ),
          h(
            'div',
            { className: 'progress-ring-pct' },
            ctx.pctSalario.toFixed(0) + '%',
            h('div', { className: 'progress-ring-label' }, 'de la meta')
          )
        ),
        h(
          'div',
          { className: 'progress-ring-info' },
          h('div', { className: 'progress-ring-info-title' }, 'Salario base: ' + fCOP(salario)),
          h(
            'div',
            { className: 'progress-ring-info-sub' },
            'Te faltan ' + fCOP(Math.max(0, salario - ctx.totalCOP)) + ' para alcanzar el 100%. ' +
            'Al ritmo actual ' + (ctx.proy >= salario ? 'superarías' : 'no alcanzarías') + ' la meta.'
          )
        )
      )
    ),

    // ── Gráfica de línea: ingreso acumulado ──
    ctx.acumData.length > 0
      ? h(
          'div',
          { className: 'card' },
          h('div', { className: 'card-ttl' }, 'Ingreso acumulado del mes'),
          h('div', { className: 'line-chart-wrap' }, h('canvas', { ref: lineCanvasRef }))
        )
      : null,

    // ── Desglose financiero ──
    h(
      'div',
      { className: 'card' },
      h('div', { className: 'card-ttl' }, 'Resumen financiero'),
      h(
        'div',
        { className: 'fin-summary' },
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Total ganado'),
          h('div', { className: 'fin-summary-val' }, fCOP(ctx.totalCOP))
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Proyección a fin de mes'),
          h(
            'div',
            {
              className: 'fin-summary-val ' + (ctx.proy >= salario ? 'good' : 'warn')
            },
            fCOP(ctx.proy)
          )
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Horas nocturnas'),
          h('div', { className: 'fin-summary-val' }, fDur(ctx.noctMins))
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Horas festivas'),
          h('div', { className: 'fin-summary-val' }, fDur(ctx.festMins))
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Horas extra totales'),
          h('div', { className: 'fin-summary-val' }, fDur(ctx.extrasMins))
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Valor promedio por hora'),
          h('div', { className: 'fin-summary-val good' }, fCOP(ctx.eficiencia) + '/h')
        ),
        h('div', { className: 'fin-summary-div' }),
        h(
          'div',
          { className: 'fin-summary-row' },
          h('div', { className: 'fin-summary-lbl' }, 'Días hábiles disponibles'),
          h('div', { className: 'fin-summary-val' }, ctx.diasHabilesRest + ' de ' + ctx.diasRestantes)
        )
      )
    ),

    h('div', { className: 'tip-box', dangerouslySetInnerHTML: { __html: tip } }),

    // ── Botones de compartir ──
    h(
      'div',
      { className: 'dash-share-group' },
      typeof navigator !== 'undefined' && navigator.share
        ? h(
            'button',
            {
              className: 'dash-share-btn',
              onClick: function () {
                haptic();
                var shareText =
                  '📊 *Mi Turno* · Mis números del mes\n\n' +
                  '💰 Total ganado: ' + fCOP(ctx.totalCOP) + '\n' +
                  '📅 ' + ctx.diasTrab + ' turnos en ' + ctx.diasMes + ' días\n' +
                  '⏰ ' + fDur(ctx.totalMins) + ' trabajadas\n' +
                  '🎯 ' + ctx.pctSalario.toFixed(0) + '% del salario base (' + fCOP(salario) + ')\n' +
                  '🔮 Proyección: ' + fCOP(ctx.proy) + '\n' +
                  '💵 Promedio: ' + fCOP(ctx.prom) + '/turno · ' + fCOP(ctx.eficiencia) + '/h\n' +
                  (ctx.festMins > 0 ? '⛪ Festivos: ' + fDur(ctx.festMins) + '\n' : '') +
                  (ctx.noctMins > 0 ? '🌙 Nocturnas: ' + fDur(ctx.noctMins) + '\n' : '') +
                  (ctx.extrasMins > 0 ? '➕ Extras: ' + fDur(ctx.extrasMins) + '\n' : '') +
                  '\n🚀 Calculado con Mi Turno · miturno.one';
                navigator.share({
                  title: 'Mi Turno · Mis números del mes',
                  text: shareText,
                  url: 'https://miturno.one'
                }).catch(function () {});
              },
              'aria-label': 'Compartir mis números'
            },
            '📤 Compartir'
          )
        : null,
      h(
        'a',
        {
          className: 'dash-share-btn dash-share-wa',
          href: 'https://api.whatsapp.com/send?text=' + encodeURIComponent(
            '📊 *Mi Turno* · Mis números del mes\n\n' +
            '💰 Total ganado: ' + fCOP(ctx.totalCOP) + '\n' +
            '📅 ' + ctx.diasTrab + ' turnos en ' + ctx.diasMes + ' días\n' +
            '⏰ ' + fDur(ctx.totalMins) + ' trabajadas\n' +
            '🎯 ' + ctx.pctSalario.toFixed(0) + '% del salario base (' + fCOP(salario) + ')\n' +
            '🔮 Proyección: ' + fCOP(ctx.proy) + '\n' +
            '💵 Promedio: ' + fCOP(ctx.prom) + '/turno · ' + fCOP(ctx.eficiencia) + '/h\n' +
            (ctx.festMins > 0 ? '⛪ Festivos: ' + fDur(ctx.festMins) + '\n' : '') +
            (ctx.noctMins > 0 ? '🌙 Nocturnas: ' + fDur(ctx.noctMins) + '\n' : '') +
            (ctx.extrasMins > 0 ? '➕ Extras: ' + fDur(ctx.extrasMins) + '\n' : '') +
            '\n🚀 Calculado con Mi Turno · miturno.one'
          ),
          target: '_blank',
          rel: 'noopener',
          onClick: function () { haptic(); },
          'aria-label': 'Enviar por WhatsApp'
        },
        '💬 WhatsApp'
      )
    ),

    // ── Vista previa del mensaje ──
    h(
      'div',
      { className: 'dash-share-preview', 'aria-label': 'Vista previa del mensaje a compartir' },
      '📊 *Mi Turno* · Mis números del mes\n\n' +
      '💰 Total ganado: ' + fCOP(ctx.totalCOP) + '\n' +
      '📅 ' + ctx.diasTrab + ' turnos en ' + ctx.diasMes + ' días\n' +
      '⏰ ' + fDur(ctx.totalMins) + ' trabajadas\n' +
      '🎯 ' + ctx.pctSalario.toFixed(0) + '% del salario base (' + fCOP(salario) + ')\n' +
      '🔮 Proyección: ' + fCOP(ctx.proy) + '\n' +
      '💵 Promedio: ' + fCOP(ctx.prom) + '/turno · ' + fCOP(ctx.eficiencia) + '/h\n' +
      (ctx.festMins > 0 ? '⛪ Festivos: ' + fDur(ctx.festMins) + '\n' : '') +
      (ctx.noctMins > 0 ? '🌙 Nocturnas: ' + fDur(ctx.noctMins) + '\n' : '') +
      (ctx.extrasMins > 0 ? '➕ Extras: ' + fDur(ctx.extrasMins) + '\n' : '') +
      '\n🚀 Calculado con Mi Turno · miturno.one'
    )
  );
}
