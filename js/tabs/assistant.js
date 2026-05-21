// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Tab Asistente IA · 50+ capacidades · email compose · memoria · pills
// ════════════════════════════════════════════════════════════════

var MOTIVATIONAL_MSGS = [
  "¡Hoy será gran turno! 🚀✨",
  "Tu esfuerzo vale mucho. 💪💰",
  "¡A darle con toda! 🔥👷",
  "Mereces un descanso pronto. ☕🧘",
  "¡Metas cerca de cumplirse! 🎯👏"
];

// Genera una clave única por usuario para evitar fugas de datos
function _getAiKey(uid) {
  return 'mt_ai_his_' + (uid || 'guest');
}

function _aiLoadHistory(uid) {
  try {
    var s = localStorage.getItem(_getAiKey(uid));
    return s ? JSON.parse(s) : [];
  } catch (_) {
    return [];
  }
}

function _aiSaveHistory(uid, msgs) {
  if (!uid) return;
  try {
    // Solo últimas 30 entradas; nunca persistimos acciones pendientes
    var trim = msgs.slice(-30).map(function (m) {
      if (m.action) return { role: m.role, content: m.content, ts: m.ts, _actionDone: true };
      return m;
    });
    localStorage.setItem(_getAiKey(uid), JSON.stringify(trim));
  } catch (_) {
    /* ignore */
  }
}

function _aiClearHistory(uid) {
  try { localStorage.removeItem(_getAiKey(uid)); } catch (e) { }
}

// Quick pills DINÁMICAS según el estado del usuario
function _aiBuildPills(props) {
  var pills = [];
  var hasShifts = (props.calc.totalMins || 0) > 0;
  var ahora = new Date();
  var diaActual = ahora.getDate();
  var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  var diasRestantes = diasMes - diaActual;
  var pctSalario = props.salario > 0 ? ((props.calc.totalCOP || 0) / props.salario) * 100 : 0;
  var extraMins =
    (props.calc.bd?.extraDiurna?.mins || 0) +
    (props.calc.bd?.extraNoct?.mins || 0) +
    (props.calc.bd?.extraFestDiur?.mins || 0) +
    (props.calc.bd?.extraFestNoct?.mins || 0);
  var festMins =
    (props.calc.bd?.diurnaFest?.mins || 0) +
    (props.calc.bd?.noctFest?.mins || 0) +
    (props.calc.bd?.extraFestDiur?.mins || 0) +
    (props.calc.bd?.extraFestNoct?.mins || 0);
  var noctMins =
    (props.calc.bd?.noctOrd?.mins || 0) +
    (props.calc.bd?.extraNoct?.mins || 0) +
    (props.calc.bd?.noctFest?.mins || 0) +
    (props.calc.bd?.extraFestNoct?.mins || 0);

  if (!hasShifts) {
    return [
      '¿Cómo funciona la app?',
      'Próximos festivos',
      '¿Qué es jornada nocturna?',
      '¿Cómo se calculan los recargos?',
      '/capacidades'
    ];
  }

  pills.push('Resumen del mes');
  if (diaActual >= 25 || diasRestantes <= 5) pills.push('Proyección al cierre');
  if (pctSalario < 100 && pctSalario > 30) pills.push('¿Cuándo llego a la meta?');
  if (pctSalario >= 100) pills.push('¿Cuánto extra llevo sobre la meta?');
  if (extraMins > 0) pills.push('Mis horas extras');
  if (festMins > 0) pills.push('Festivos trabajados');
  if (noctMins > 0) pills.push('Horas nocturnas');
  pills.push('Mi mejor día');
  pills.push('Compara con mes pasado');

  // ── Nueva categoría: composición de email ──
  if (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE) {
    pills.push('Envía mi reporte por correo');
    if (extraMins > 0) pills.push('Redacta un correo para mi jefe');
  }

  pills.push('Próximos festivos');
  pills.push('Mi racha actual');

  return pills.slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
//  TARJETA DE COMPOSICIÓN DE EMAIL (inline en el chat)
// ═══════════════════════════════════════════════════════════════
function EmailComposeCard(props) {
  // props: {data:{to,subject,body,format,attach}, parent, onResolved}
  var to = useState(props.data.to || '');
  var subject = useState(props.data.subject || '');
  var body = useState(props.data.body || '');
  var format = useState(props.data.format || 'pdf');
  var attach = useState(props.data.attach !== false);
  var status = useState('edit'); // edit | sending | done | error
  var err = useState(null);

  var cloud = typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE;
  var canSend =
    cloud &&
    to[0].trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to[0].trim()) &&
    subject[0].trim() &&
    body[0].trim();

  function doSend() {
    if (!canSend || status[0] === 'sending') return;
    haptic();
    status[1]('sending');
    err[1](null);
    try {
      // Generar adjunto si toca
      var fileBase64 = '';
      var filename =
        'mi-turno-reporte-' +
        new Date().toISOString().slice(0, 10) +
        '.' +
        (format[0] === 'pdf' ? 'pdf' : 'xlsx');
      if (attach[0]) {
        var turnosParaExport = props.parent.turnosAll || props.parent.turnos;
        // Adaptar al formato que espera exportPDFBase64/exportExcelBase64
        var calcAdapt = {
          total: props.parent.calc.totalCOP,
          totalMin: props.parent.calc.totalMins
        };
        if (format[0] === 'pdf')
          fileBase64 = exportPDFBase64(turnosParaExport, calcAdapt, props.parent.salario);
        else fileBase64 = exportExcelBase64(turnosParaExport, calcAdapt, props.parent.salario);
      } else {
        // Edge function requiere fileBase64 — usamos un placeholder mínimo
        fileBase64 = exportPDFBase64([], { total: 0, totalMin: 0 }, props.parent.salario);
        filename = 'mi-turno-sin-adjunto.pdf';
      }

      enviarReportePorEmail({
        to: to[0].trim(),
        format: format[0],
        filename: filename,
        fileBase64: fileBase64,
        subject: subject[0].trim(),
        message: body[0]
      })
        .then(function (r) {
          status[1]('done');
          if (props.onResolved) props.onResolved({ ok: true, to: to[0].trim() });
        })
        .catch(function (e) {
          status[1]('error');
          err[1](e.message || 'Error al enviar');
        });
    } catch (e) {
      status[1]('error');
      err[1]('No pude generar el archivo: ' + (e.message || 'error desconocido'));
    }
  }

  function discard() {
    haptic();
    if (props.onResolved) props.onResolved({ ok: false, cancelled: true });
  }

  // Estados
  if (status[0] === 'done') {
    return h(
      'div',
      { className: 'email-card email-card-done' },
      h('div', { className: 'email-card-ico' }, '✅'),
      h(
        'div',
        { className: 'email-card-msg' },
        h('strong', null, 'Enviado'),
        ' a ',
        h('span', { style: { color: 'var(--accent)' } }, to[0])
      )
    );
  }
  if (status[0] === 'sending') {
    return h(
      'div',
      { className: 'email-card email-card-sending' },
      h('span', { className: 'sp-in', style: { fontSize: 18 } }),
      h('span', { style: { color: 'var(--muted)' } }, 'Enviando reporte...')
    );
  }

  return h(
    'div',
    { className: 'email-card' },
    h(
      'div',
      { className: 'email-card-hdr' },
      h('div', { className: 'email-card-hdr-ico' }, '✉'),
      h(
        'div',
        { style: { flex: 1 } },
        h('div', { className: 'email-card-ttl' }, 'Nuevo correo'),
        h('div', { className: 'email-card-sub' }, 'Generado por IA · revisa antes de enviar')
      )
    ),

    !cloud
      ? h(
        'div',
        { className: 'email-card-warn' },
        '⚠ Necesitas modo cloud activo para enviar correos.'
      )
      : null,

    h('label', { className: 'email-card-lbl' }, 'PARA'),
    h('input', {
      type: 'email',
      className: 'email-card-inp',
      value: to[0],
      placeholder: 'destinatario@correo.com',
      onChange: function (e) {
        to[1](e.target.value);
      }
    }),

    h('label', { className: 'email-card-lbl' }, 'ASUNTO'),
    h('input', {
      type: 'text',
      className: 'email-card-inp',
      value: subject[0],
      onChange: function (e) {
        subject[1](e.target.value);
      }
    }),

    h('label', { className: 'email-card-lbl' }, 'MENSAJE'),
    h('textarea', {
      className: 'email-card-txt',
      value: body[0],
      rows: 8,
      onChange: function (e) {
        body[1](e.target.value);
      }
    }),

    h(
      'div',
      { className: 'email-card-opts' },
      h(
        'label',
        { className: 'email-card-opt' },
        h('input', {
          type: 'checkbox',
          checked: attach[0],
          onChange: function (e) {
            attach[1](e.target.checked);
          }
        }),
        h('span', null, 'Adjuntar reporte')
      ),
      attach[0]
        ? h(
          'div',
          { className: 'email-card-fmt' },
          h(
            'button',
            {
              className: 'email-card-fmt-btn' + (format[0] === 'pdf' ? ' on' : ''),
              onClick: function () {
                haptic();
                format[1]('pdf');
              }
            },
            '📄 PDF'
          ),
          h(
            'button',
            {
              className: 'email-card-fmt-btn' + (format[0] === 'xlsx' ? ' on' : ''),
              onClick: function () {
                haptic();
                format[1]('xlsx');
              }
            },
            '📊 Excel'
          )
        )
        : null
    ),

    err[0] ? h('div', { className: 'email-card-err' }, err[0]) : null,

    h(
      'div',
      { className: 'email-card-actions' },
      h(
        'button',
        { className: 'email-card-btn email-card-btn-ghost', onClick: discard },
        'Descartar'
      ),
      h(
        'button',
        {
          className: 'email-card-btn email-card-btn-send',
          onClick: doSend,
          disabled: !canSend
        },
        '📤 Enviar'
      )
    )
  );
}

function AsistenteTab(props) {
  var uid = props.session.uid; // Get the current user's UID

  // Initialize msgs state with user-specific history
  var ms = useState(function () {
    return _aiLoadHistory(uid);
  });
  var msgs = ms[0],
    setMsgs = ms[1];
  var is = useState('');
  var input = is[0],
    setInput = is[1];
  var bs = useState(false);
  var busy = bs[0], setBusy = bs[1];
  var winRef = useRef(null);

  // Estado para los mensajes motivacionales rotativos
  var mtIdx = useState(0);
  var msgIdx = mtIdx[0], setMsgIdx = mtIdx[1];

  useEffect(function () {
    var interval = setInterval(function () {
      setMsgIdx(function (prev) { return (prev + 1) % MOTIVATIONAL_MSGS.length; });
    }, 7000); // Cambia cada 7 segundos
    return function () { clearInterval(interval); };
  }, []);

  // Cargar historial solo una vez cuando cambia el usuario (UID)
  useEffect(function () {
    setMsgs(_aiLoadHistory(uid));
  }, [uid]);

  // Effect to save history when msgs or uid changes
  useEffect(
    function () {
      _aiSaveHistory(uid, msgs);
    },
    [msgs, uid] // Add uid to dependencies
  );

  // Efecto visual: Scroll al fondo solo cuando hay mensajes nuevos o la IA piensa
  useEffect(function () {
    if (winRef.current) {
      requestAnimationFrame(function () {
        if (winRef.current) winRef.current.scrollTop = winRef.current.scrollHeight;
      });
    }
  },
    [msgs, busy]
  );

  var clearChat = useCallback(function () {
    haptic();
    setMsgs([]);
    try {
      _aiClearHistory(uid);
    } catch (_) {
      /* ignore */
    }
  }, [uid]);

  // Marcar acción como resuelta (enviado, cancelado o error)
  var resolveAction = useCallback(function (idx, result) {
    setMsgs(function (prev) {
      var copy = prev.slice();
      var msg = copy[idx];
      if (msg && msg.action) {
        msg.action = null;
        if (result.ok) {
          msg.actionResult = { ok: true, msg: '✅ Correo enviado a ' + result.to };
        } else if (result.cancelled) {
          msg.actionResult = { ok: false, msg: '✗ Borrador descartado' };
        }
      }
      return copy;
    });
  }, []);

  var send = useCallback(
    function (text) {
      var q = (text || input).trim();
      if (!q || busy) return;
      haptic();
      setInput('');

      if (q === '/limpiar' || q === '/clear' || q === '/reset') {
        clearChat();
        return;
      }

      setMsgs(function (p) {
        return p.concat([{ role: 'user', content: q, ts: Date.now() }]);
      });
      setBusy(true);
      setTimeout(
        function () {
          var resp = aiAnswer(q, {
            turnos: props.turnos,
            turnosAll: props.turnosAll || props.turnos,
            calc: props.calc,
            salario: props.salario,
            vh: props.vh,
            session: props.session
          });
          // resp puede ser string o {text, action}
          var newMsg;
          if (resp && typeof resp === 'object' && resp.action) {
            newMsg = { role: 'ai', content: resp.text, action: resp.action, ts: Date.now() };
          } else {
            newMsg = { role: 'ai', content: String(resp), ts: Date.now() };
          }
          setMsgs(function (p) {
            return p.concat([newMsg]);
          });
          setBusy(false);
          // Scroll to bottom after AI response
          if (winRef.current) {
            requestAnimationFrame(function () {
              if (winRef.current) winRef.current.scrollTop = winRef.current.scrollHeight;
            });
          }
        },
        280 + Math.random() * 220
      );
    },
    [input, busy, props, clearChat]
  );

  var pills = React.useMemo(
    function () {
      return _aiBuildPills(props);
    },
    [props.calc, props.salario]
  );

  return h(
    'div',
    { className: 'fadeUp' },
    h(
      'div',
      { className: 'card' },
      h(
        'div',
        { className: 'ai-header' },
        h('div', { className: 'ai-avatar' }, '✦'),
        h(
          'div',
          { style: { flex: 1, minWidth: 0 } },
          h(
            'div',
            {
              style: {
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.3px'
              }
            },
            'Asistente de Turno'
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
            'Tu copiloto de nómina 🤖 · analizo, calculo y te ayudo a ganar más'
          )
        ),
        msgs.length > 0
          ? h(
            'button',
            {
              className: 'ai-clear-btn',
              onClick: clearChat,
              title: 'Limpiar conversación',
              style: {
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--glass-mid)',
                border: '1px solid var(--glass-border-sm)',
                color: 'var(--muted)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backdropFilter: 'var(--blur-sm)',
                WebkitBackdropFilter: 'var(--blur-sm)'
              }
            },
            '⟲'
          )
          : null
      ),
      h(
        'div',
        {
          style: {
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 8
          }
        },
        'Sugerencias inteligentes'
      ),
      h(
        'div',
        { className: 'quick-pills' },
        pills.map(function (p, i) {
          return h(
            'button',
            {
              key: i,
              className: 'quick-pill',
              onClick: function () {
                send(p);
              }
            },
            p
          );
        })
      ),
      h(
        'div',
        { ref: winRef, className: 'chat-window' },
        msgs.length === 0
          ? h(
            'div',
            { className: 'ai-empty' },
            h('div', { className: 'ai-empty-icon' }, '✦'),
            h(
              'div',
              null,
              '¡Hola! Soy tu asistente de turno 🤗',
              h('br'),
              h(
                'span',
                { style: { fontSize: 11.5, opacity: 0.7 } },
                'Pregúntame lo que quieras sobre tu mes, tus ingresos o pídeme que redacte un correo para tu jefe.'
              ),
              h('br'),
              h(
                'span',
                { style: { fontSize: 11, opacity: 0.55, marginTop: 6, display: 'inline-block' } },
                'Ideas: ',
                h('em', null, '"¿Cómo voy este mes?" · "¿Cuánto ganaré si trabajo 4h más?" · "Envía mi reporte a juan@empresa.com"')
              )
            )
          )
          : msgs
            .map(function (m, i) {
              var bubble = h('div', {
                className: 'chat-bubble',
                dangerouslySetInnerHTML: {
                  __html: m.content
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(
                      /`([^`]+)`/g,
                      '<code style="padding:1px 6px;border-radius:6px;background:var(--accent-dim);color:var(--accent);font-size:0.92em">$1</code>'
                    )
                    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                }
              });
              var actionCard = null;
              if (m.action && m.action.type === 'email_compose') {
                actionCard = h(EmailComposeCard, {
                  data: m.action.data,
                  parent: props,
                  onResolved: function (r) {
                    resolveAction(i, r);
                  }
                });
              }
              var resultBadge = m.actionResult
                ? h(
                  'div',
                  { className: 'email-result-badge' + (m.actionResult.ok ? ' ok' : ' bad') },
                  m.actionResult.msg
                )
                : null;
              return h(
                'div',
                { key: i, className: 'chat-msg ' + m.role },
                h('div', { className: 'chat-icon' }, m.role === 'ai' ? '✦' : '·'),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      flex: 1,
                      minWidth: 0,
                      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                    }
                  },
                  bubble,
                  actionCard,
                  resultBadge
                )
              );
            })
            .concat(
              busy
                ? [
                  h(
                    'div',
                    { key: 'thk', className: 'chat-msg ai' },
                    h('div', { className: 'chat-icon' }, '✦'),
                    h(
                      'div',
                      {
                        className: 'chat-bubble chat-thinking',
                        style: { color: 'var(--muted)' }
                      },
                      h('span', { className: 'thk-dot' }, '·'),
                      h('span', { className: 'thk-dot' }, '·'),
                      h('span', { className: 'thk-dot' }, '·')
                    )
                  )
                ]
                : []
            )
      ),
      h(
        'div',
        { className: 'chat-input-row' },
        h('textarea', {
          className: 'chat-input',
          placeholder: MOTIVATIONAL_MSGS[msgIdx],
          value: input,
          onChange: function (e) {
            setInput(e.target.value);
          },
          onKeyDown: function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          },
          rows: 1
        }),
        h(
          'button',
          {
            className: 'chat-send-btn',
            onClick: function () {
              send();
            },
            disabled: busy || !input.trim()
          },
          '→'
        )
      )
    )
  );
}
