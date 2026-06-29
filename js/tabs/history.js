// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/history.js
//  Tab Historial
// ════════════════════════════════════════════════════════════════
/* global h, useState, useMemo, haptic, esFest, esNoct, semLun, fDur, fCOP, doCalc, doCalcPerTurno, RC, _saludoHora, _aiNombrePersonal */

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

  // Turno seleccionado para ver detalle en bottom sheet
  var dts = useState(null);
  var detail = dts[0],
    setDetail = dts[1];

  // Formato seleccionado del exportador (segmented control estilo iOS)
  var ff = useState('pdf');
  var fmt = ff[0],
    setFmt = ff[1];

  // Verificador de nómina
  var vvs = useState(false);
  var showVerif = vvs[0],
    setShowVerif = vvs[1];
  var vms = useState('');
  var verifInput = vms[0],
    setVerifInput = vms[1];

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
  var nm = typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: session }) : '';
  // Mismo helper que el asistente — fuente única de verdad
  var saludo = typeof _saludoHora === 'function' ? _saludoHora(ahora) : 'Hola';
  var saludoCompleto = nm ? saludo + ', ' + nm : saludo;

  // Stats del mes en curso (turnos cerrados de este mes)
  var mesActual = ahora.getMonth();
  var anioActual = ahora.getFullYear();
  var minsMes = 0;
  var turnosMes = 0;
  var diasSetMes = {};
  var turnosMesArr = [];
  turnos.forEach(function (t) {
    if (!t.fin) return;
    var ini = new Date(t.inicio);
    if (ini.getMonth() === mesActual && ini.getFullYear() === anioActual) {
      var fin = new Date(t.fin);
      minsMes += (fin - ini) / 60000;
      turnosMes++;
      diasSetMes[ini.getDate()] = true;
      turnosMesArr.push(t);
    }
  });
  var diasMes = Object.keys(diasSetMes).length;
  var horasMes = Math.round(minsMes / 60);
  var nombreMes = ahora.toLocaleDateString('es-CO', { month: 'long' });
  nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  // Ingreso por turno con atribución marginal (mismo algoritmo semanal que
  // doCalc), así la suma coincide con el total. Se calcula sobre TODOS los
  // turnos (no solo los visibles) para que el agrupado por semana sea
  // correcto en los bordes. No depende de `ahora`: los turnos cerrados no
  // cambian, evitando recálculos en cada tick del reloj.
  var vh = props.vh || 0;
  var visibles = turnos.slice(0, 60);
  var perTurno = useMemo(
    function () {
      if (!vh) return { byId: {} };
      try {
        return doCalcPerTurno(turnos, vh);
      } catch (_) {
        return { byId: {} };
      }
    },
    [turnos, vh]
  );
  function copDe(t, idx) {
    var key = t.id != null ? t.id : 'idx_' + idx;
    var e = perTurno.byId[key];
    return e && e.cop ? e.cop : 0;
  }
  var maxCop = useMemo(
    function () {
      var m = 1;
      visibles.forEach(function (t, i) {
        var c = copDe(t, i);
        if (c > m) m = c;
      });
      return m;
    },
    [perTurno, turnos]
  );

  var verifMonto = parseInt((verifInput || '').replace(/[^0-9]/g, ''), 10);
  var verifResult = null;
  if (!isNaN(verifMonto) && verifMonto > 0 && vh > 0 && turnosMesArr.length > 0) {
    var verifCalc = doCalc(turnosMesArr, null, ahora, vh);
    var verifEsp = Math.round(verifCalc.totalCOP);
    var verifDif = verifMonto - verifEsp;
    verifResult = { esperado: verifEsp, pagado: verifMonto, dif: verifDif };
  }

  return h(
    'section',
    { className: 'fadeUp', 'aria-label': 'Historial de turnos' },
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
            {
              className: 'modal-card',
              style: { textAlign: 'center' },
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': 'Confirmación para eliminar turno'
            },
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
                  },
                  'aria-label': 'Cancelar eliminación'
                },
                'Cancelar'
              ),
              h(
                'button',
                {
                  className: 'btn btn-danger btn-block',
                  onClick: doDel,
                  style: { background: 'var(--danger)', color: '#fff' },
                  'aria-label': 'Confirmar eliminación de turno'
                },
                'Eliminar'
              )
            )
          )
        )
      : null,

    // ═══ Bottom sheet de detalle del turno ═══
    detail
      ? (function () {
          var t = detail.t;
          var ini = new Date(t.inicio),
            fin = new Date(t.fin);
          var mins = Math.round((fin - ini) / 60000);
          var fest = esFest(ini);
          var key = t.id != null ? t.id : 'idx_' + detail.idx;
          var entry = perTurno.byId[key] || { bd: {} };
          var bd = entry.bd || {};
          var cats = Object.keys(bd).filter(function (k) {
            return bd[k].mins > 0;
          });
          var fechaLarga = ini.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          function cerrar() {
            setDetail(null);
          }
          return h(
            'div',
            {
              className: 'mol-ov',
              onClick: function (ev) {
                if (ev.target === ev.currentTarget) cerrar();
              }
            },
            h(
              'div',
              {
                className: 'mol-sh',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Detalle del turno del ' + fechaLarga
              },
              h('div', { className: 'mol-hdl' }),
              h(
                'div',
                { className: 'td-head' },
                h(
                  'div',
                  { className: 'td-fecha' },
                  fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)
                ),
                fest ? h('span', { className: 'bdg-fest' }, 'Festivo') : null
              ),
              detail.cop > 0 ? h('div', { className: 'td-monto' }, fCOP(detail.cop)) : null,
              h(
                'div',
                { className: 'td-grid' },
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Entrada'),
                  h(
                    'div',
                    { className: 'td-cell-val' },
                    ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                  ),
                  h(
                    'span',
                    { className: 'td-cell-date' },
                    ini.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  )
                ),
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Salida'),
                  h(
                    'div',
                    { className: 'td-cell-val' },
                    fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                  ),
                  h(
                    'span',
                    { className: 'td-cell-date' },
                    fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  )
                ),
                h(
                  'div',
                  { className: 'td-cell' },
                  h('div', { className: 'td-cell-lbl' }, 'Duración'),
                  h('div', { className: 'td-cell-val' }, fDur(mins))
                )
              ),
              cats.length > 0
                ? h(
                    'div',
                    { className: 'td-bd' },
                    h('div', { className: 'td-bd-ttl' }, 'Desglose por recargo'),
                    cats.map(function (k) {
                      var rc = RC[k] || { short: k, color: 'var(--accent)' };
                      return h(
                        'div',
                        { key: k, className: 'td-bd-row' },
                        h(
                          'div',
                          { className: 'td-bd-name' },
                          h('span', {
                            className: 'td-bd-dot',
                            style: { background: rc.color }
                          }),
                          rc.short
                        ),
                        h('div', { className: 'td-bd-mins' }, fDur(bd[k].mins)),
                        h('div', { className: 'td-bd-cop' }, fCOP(bd[k].cop))
                      );
                    })
                  )
                : null,
              h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  style: { marginTop: 16 },
                  onClick: function () {
                    haptic();
                    cerrar();
                  },
                  'aria-label': 'Cerrar detalle del turno'
                },
                'Cerrar'
              )
            )
          );
        })()
      : null,

    // ═══ Bottom sheet verificador de nómina ═══
    showVerif
      ? (function () {
          function cerrarVerif() {
            setShowVerif(false);
            setVerifInput('');
          }
          return h(
            'div',
            {
              className: 'mol-ov',
              onClick: function (ev) {
                if (ev.target === ev.currentTarget) cerrarVerif();
              }
            },
            h(
              'div',
              {
                className: 'mol-sh',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Verificador de nómina'
              },
              h('div', { className: 'mol-hdl' }),
              h('div', { className: 'hist-verif-ttl' }, '¿Te pagaron bien?'),
              h('div', { className: 'hist-verif-sub' }, 'Ingresá el monto que recibiste este mes'),
              h(
                'div',
                { className: 'hist-verif-inp-wrap' },
                h('span', { className: 'hist-verif-inp-pfx' }, '$'),
                h('input', {
                  className: 'hist-verif-inp',
                  type: 'tel',
                  inputMode: 'numeric',
                  placeholder: '1.200.000',
                  value: verifInput,
                  'aria-label': 'Monto recibido en pesos',
                  onChange: function (ev) {
                    setVerifInput(ev.target.value);
                  }
                })
              ),
              verifResult
                ? h(
                    'div',
                    { className: 'hist-verif-result' },
                    h(
                      'div',
                      { className: 'hist-verif-row' },
                      h('span', { className: 'hist-verif-row-lbl' }, 'Lo que debiste recibir'),
                      h('span', { className: 'hist-verif-row-val' }, fCOP(verifResult.esperado))
                    ),
                    h(
                      'div',
                      { className: 'hist-verif-row' },
                      h('span', { className: 'hist-verif-row-lbl' }, 'Lo que recibiste'),
                      h('span', { className: 'hist-verif-row-val' }, fCOP(verifResult.pagado))
                    ),
                    h('div', { className: 'hist-verif-divider' }),
                    h(
                      'div',
                      {
                        className:
                          'hist-verif-row ' +
                          (verifResult.dif < -(verifResult.esperado * 0.02)
                            ? 'hist-verif-warn'
                            : 'hist-verif-ok')
                      },
                      h(
                        'span',
                        { className: 'hist-verif-row-lbl' },
                        verifResult.dif >= 0 ? 'Diferencia a tu favor' : 'Te deben'
                      ),
                      h(
                        'span',
                        { className: 'hist-verif-row-val' },
                        fCOP(Math.abs(verifResult.dif))
                      )
                    ),
                    h(
                      'div',
                      { className: 'hist-verif-hint' },
                      verifResult.dif < -(verifResult.esperado * 0.02)
                        ? 'Hay una diferencia. Revisá los recargos con tu empleador.'
                        : 'El pago está dentro del rango estimado.'
                    ),
                    verifResult.dif < -(verifResult.esperado * 0.02)
                      ? h(
                          'button',
                          {
                            className: 'btn btn-primary btn-block',
                            style: { marginTop: 12 },
                            onClick: function () {
                              haptic();
                              var txt = encodeURIComponent(
                                'Hola, revisé mi nómina con Mi Turno y hay una diferencia.\n' +
                                  'Estimado: ' +
                                  fCOP(verifResult.esperado) +
                                  '\nRecibido: ' +
                                  fCOP(verifResult.pagado) +
                                  '\nDiferencia: ' +
                                  fCOP(Math.abs(verifResult.dif))
                              );
                              window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
                            },
                            'aria-label': 'Compartir diferencia por WhatsApp'
                          },
                          'Reclamar por WhatsApp'
                        )
                      : null
                  )
                : null,
              h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  style: { marginTop: 16 },
                  onClick: function () {
                    haptic();
                    cerrarVerif();
                  },
                  'aria-label': 'Cerrar verificador de nómina'
                },
                'Cerrar'
              )
            )
          );
        })()
      : null,

    // ═══ HERO con peso visual (estilo IA) ═══
    h(
      'div',
      { className: 'hist-hero' },
      h('div', { className: 'hist-hero-eyebrow' }, nombreMes + ' · resumen'),
      h('h1', { className: 'hist-hero-greeting' }, saludoCompleto + '.'),
      h(
        'div',
        { className: 'hist-hero-stats', role: 'group', 'aria-label': 'Resumen de ' + nombreMes },
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': turnosMes + (turnosMes === 1 ? ' turno' : ' turnos')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, turnosMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            turnosMes === 1 ? 'turno' : 'turnos'
          )
        ),
        h('div', { className: 'hist-hero-sep', 'aria-hidden': 'true' }),
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': horasMes + (horasMes === 1 ? ' hora' : ' horas')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, horasMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            horasMes === 1 ? 'hora' : 'horas'
          )
        ),
        h('div', { className: 'hist-hero-sep', 'aria-hidden': 'true' }),
        h(
          'div',
          {
            className: 'hist-hero-stat',
            role: 'img',
            'aria-label': diasMes + (diasMes === 1 ? ' día' : ' días')
          },
          h('div', { className: 'hist-hero-stat-num', 'aria-hidden': 'true' }, diasMes),
          h(
            'div',
            { className: 'hist-hero-stat-lbl', 'aria-hidden': 'true' },
            diasMes === 1 ? 'día' : 'días'
          )
        )
      )
    ),

    activo
      ? h(
          'div',
          {
            className: 'hist-cur',
            role: 'status',
            'aria-live': 'polite',
            'aria-label':
              'Turno en curso desde las ' +
              new Date(activo.inicio).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
              }) +
              '. Duración ' +
              fDur(durActual)
          },
          h(
            'div',
            { className: 'hist-cur-tag', 'aria-hidden': 'true' },
            h('div', { className: 'active-dot', style: { width: 5, height: 5 } }),
            'En curso'
          ),
          h(
            'div',
            {
              style: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
              'aria-hidden': 'true'
            },
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

    turnosMesArr.length > 0
      ? h(
          'button',
          {
            className: 'hist-verif-cta',
            onClick: function () {
              haptic();
              setShowVerif(true);
            },
            'aria-label': 'Verificar si te pagaron bien este mes'
          },
          h('span', { className: 'hist-verif-cta-ico' }, '🔍'),
          h(
            'div',
            { className: 'hist-verif-cta-body' },
            h('div', { className: 'hist-verif-cta-ttl' }, '¿Te pagaron bien?'),
            h('div', { className: 'hist-verif-cta-sub' }, 'Verificá tu nómina de ' + nombreMes)
          ),
          h('span', { className: 'hist-verif-cta-chev' }, '›')
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
                onClick: function () {
                  haptic();
                  setFmt('pdf');
                }
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
                onClick: function () {
                  haptic();
                  setFmt('excel');
                }
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

    (function () {
      var grupos = [];
      visibles.forEach(function (t, i) {
        var ini = new Date(t.inicio);
        if (!t.fin || isNaN(ini.getTime())) return;
        var lun = semLun(ini);
        var semKey = lun.getTime();
        var last = grupos[grupos.length - 1];
        if (!last || last.key !== semKey) {
          grupos.push({ key: semKey, lun: lun, items: [] });
        }
        grupos[grupos.length - 1].items.push({ t: t, i: i });
      });
      return grupos.map(function (grupo) {
        var lun = grupo.lun;
        var dom = new Date(lun.getTime());
        dom.setDate(dom.getDate() + 6);
        var lunStr = lun.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        var domStr = dom.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        var semCop = grupo.items.reduce(function (acc, item) {
          return acc + copDe(item.t, item.i);
        }, 0);
        var semCnt = grupo.items.length;
        return h(
          'div',
          { key: grupo.key, className: 'hist-sem-group' },
          h(
            'div',
            { className: 'hist-sem-head', 'aria-hidden': 'true' },
            h('span', { className: 'hist-sem-rng' }, lunStr + ' – ' + domStr),
            h(
              'span',
              { className: 'hist-sem-meta' },
              semCnt +
                (semCnt === 1 ? ' turno' : ' turnos') +
                (semCop > 0 ? ' · ' + fCOP(semCop) : '')
            )
          ),
          grupo.items.map(function (item) {
            var t = item.t;
            var i = item.i;
            var ini = new Date(t.inicio);
            var fin = new Date(t.fin);
            if (isNaN(fin.getTime())) return null;
            var mins = Math.round((fin - ini) / 60000);
            var fest = esFest(ini);
            var entryKey = t.id != null ? t.id : 'idx_' + i;
            var entry = perTurno.byId[entryKey] || { bd: {} };
            var bd = entry.bd || {};
            var cop = copDe(t, i);
            var pct = cop > 0 ? Math.max(Math.round((cop / maxCop) * 100), 6) : 0;
            var barCls = fest ? 'hist-bar-fill bf-fest' : 'hist-bar-fill';
            var noct =
              esNoct(ini) ||
              (bd.noctOrd && bd.noctOrd.mins > 0) ||
              (bd.extraNoct && bd.extraNoct.mins > 0);
            var tipoCls = fest
              ? 'hist-tipo-dot--fest'
              : noct
                ? 'hist-tipo-dot--noct'
                : 'hist-tipo-dot--diurno';
            var tipoLabel = fest ? 'festivo' : noct ? 'nocturno' : 'diurno';
            var fechaRow = ini.toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });
            var rowLabel =
              'Turno ' +
              tipoLabel +
              ' del ' +
              fechaRow +
              '. Duración ' +
              fDur(mins) +
              (cop > 0 ? '. Ingreso ' + fCOP(cop) : '') +
              '. Toca para ver el detalle.';
            return h(
              'div',
              {
                key: t.id || i,
                className: 'hist-row hist-row--tap',
                role: 'button',
                'aria-label': rowLabel,
                onClick: function () {
                  haptic();
                  setDetail({ t: t, cop: cop, idx: i });
                }
              },
              h(
                'div',
                { className: 'hist-head' },
                h(
                  'div',
                  { className: 'hist-date' },
                  h('span', {
                    className: 'hist-tipo-dot ' + tipoCls,
                    'aria-hidden': 'true'
                  }),
                  ini.toLocaleDateString('es-CO', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  }),
                  fest ? h('span', { className: 'bdg-fest' }, 'Fest') : null
                ),
                h(
                  'div',
                  { className: 'hist-right' },
                  cop > 0 ? h('div', { className: 'hist-cop' }, fCOP(cop)) : null,
                  h('div', { className: 'hist-dur' }, fDur(mins)),
                  h(
                    'button',
                    {
                      className: 'hist-del',
                      'aria-label':
                        'Borrar turno del ' +
                        ini.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
                      onClick: function (ev) {
                        ev.stopPropagation();
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
              ),
              cop > 0
                ? h(
                    'div',
                    { className: 'hist-bar-track' },
                    h('div', { className: barCls, style: { width: pct + '%' } })
                  )
                : null
            );
          })
        );
      });
    })(),

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
              style: { marginTop: 10 },
              'aria-label': 'Borrar todo el historial de turnos'
            },
            '🗑 Borrar todo el historial'
          )
        : h(
            'div',
            {
              className: 'confirm-row',
              style: { marginTop: 10 },
              role: 'group',
              'aria-label': 'Confirmar borrado de todo el historial'
            },
            h(
              'button',
              {
                className: 'btn btn-ghost btn-block',
                onClick: function () {
                  haptic();
                  setConf(false);
                },
                'aria-label': 'Cancelar borrado del historial'
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
                style: { background: 'var(--danger)', color: '#fff' },
                'aria-label': 'Confirmar borrado de todo el historial'
              },
              'Sí, borrar'
            )
          )
      : null
  );
}
