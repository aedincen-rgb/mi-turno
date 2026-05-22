// ═══════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Asistente IA · categorías + historial persistente + correo
// ───────────────────────────────────────────────────────────────
//  Recibe: turnos, turnosAll, calc, salario, vh, session.
//  Globales usadas: useState, useEffect, useCallback, useRef, h,
//  haptic, aiAnswer, CLOUD_MODE, enviarReportePorEmail,
//  exportPDFBase64, exportExcelBase64.
// ═══════════════════════════════════════════════════════════════

// ── Historial de conversación, persistido por usuario ──────────
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
    // Solo las últimas 30 entradas; las acciones pendientes no se persisten.
    var trim = msgs.slice(-30).map(function (m) {
      if (m.action) return { role: m.role, content: m.content, _actionDone: true };
      return m;
    });
    localStorage.setItem(_getAiKey(uid), JSON.stringify(trim));
  } catch (_) {
    /* almacenamiento lleno o no disponible */
  }
}

function _aiClearHistory(uid) {
  try {
    localStorage.removeItem(_getAiKey(uid));
  } catch (e) {}
}

// ── Markdown ligero → HTML para las burbujas de la IA ──────────
function _aiFormat(text) {
  return String(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code style="padding:1px 6px;border-radius:6px;background:var(--accent-dim);color:var(--accent);font-size:0.92em">$1</code>'
    )
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// ═══════════════════════════════════════════════════════════════
//  TARJETA DE COMPOSICIÓN DE CORREO (inline en el chat)
// ═══════════════════════════════════════════════════════════════
function EmailComposeCard(props) {
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
      var fileBase64 = '';
      var filename =
        'mi-turno-reporte-' +
        new Date().toISOString().slice(0, 10) +
        '.' +
        (format[0] === 'pdf' ? 'pdf' : 'xlsx');
      if (attach[0]) {
        var turnosParaExport = props.parent.turnosAll || props.parent.turnos;
        var calcAdapt = {
          total: props.parent.calc.totalCOP,
          totalMin: props.parent.calc.totalMins
        };
        if (format[0] === 'pdf')
          fileBase64 = exportPDFBase64(turnosParaExport, calcAdapt, props.parent.salario);
        else fileBase64 = exportExcelBase64(turnosParaExport, calcAdapt, props.parent.salario);
      } else {
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
        .then(function () {
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

// ═══════════════════════════════════════════════════════════════
//  PESTAÑA ASISTENTE
// ═══════════════════════════════════════════════════════════════
function AsistenteTab(props) {
  var uid = (props.session && props.session.uid) || 'guest';

  var ms = useState(function () {
    return _aiLoadHistory(uid);
  });
  var msgs = ms[0],
    setMsgs = ms[1];
  var is = useState('');
  var input = is[0],
    setInput = is[1];
  var bs = useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var cs = useState(null);
  var openCat = cs[0],
    setOpenCat = cs[1];
  var endRef = useRef(null);
  var inputRef = useRef(null);

  // Recargar el historial al cambiar de usuario
  useEffect(
    function () {
      setMsgs(_aiLoadHistory(uid));
    },
    [uid]
  );

  // Guardar el historial cuando cambian los mensajes
  useEffect(
    function () {
      _aiSaveHistory(uid, msgs);
    },
    [msgs, uid]
  );

  // Auto-scroll al último mensaje
  useEffect(
    function () {
      if (endRef.current) {
        requestAnimationFrame(function () {
          if (endRef.current) endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        });
      }
    },
    [msgs, busy]
  );

  // Auto-grow del textarea
  useEffect(
    function () {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + 'px';
      }
    },
    [input]
  );

  var clearChat = useCallback(
    function () {
      haptic();
      setMsgs([]);
      setOpenCat(null);
      _aiClearHistory(uid);
    },
    [uid]
  );

  // Marca una acción (correo) como resuelta: enviada o descartada
  var resolveAction = useCallback(function (idx, result) {
    setMsgs(function (prev) {
      var copy = prev.slice();
      var msg = copy[idx];
      if (msg && msg.action) {
        copy[idx] = Object.assign({}, msg, {
          action: null,
          actionResult: result.ok
            ? { ok: true, msg: '✓ Correo enviado a ' + result.to }
            : { ok: false, msg: '✗ Borrador descartado' }
        });
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
      setOpenCat(null);

      if (q === '/limpiar' || q === '/clear' || q === '/reset') {
        clearChat();
        return;
      }

      setMsgs(function (p) {
        return p.concat([{ role: 'user', content: q }]);
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
          var newMsg;
          if (resp && typeof resp === 'object' && resp.action) {
            newMsg = { role: 'ai', content: resp.text, action: resp.action };
          } else if (resp && typeof resp === 'object') {
            newMsg = { role: 'ai', content: resp.text || String(resp) };
          } else {
            newMsg = { role: 'ai', content: String(resp) };
          }
          setMsgs(function (p) {
            return p.concat([newMsg]);
          });
          setBusy(false);
        },
        350 + Math.random() * 250
      );
    },
    [input, busy, props, clearChat]
  );

  // Saludo según la hora del día
  var hora = new Date().getHours();
  var saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Categorías: lista expandible (una abierta a la vez), nada de botonera
  var categorias = [
    {
      id: 'ingresos',
      icono: '$',
      titulo: 'Ingresos',
      desc: 'Cuánto llevas, tu mejor día y proyecciones',
      preguntas: [
        '¿Cuánto gané este mes?',
        'Mi mejor día',
        'Proyección de fin de mes',
        'Envía mi reporte por correo'
      ]
    },
    {
      id: 'tiempo',
      icono: '◷',
      titulo: 'Tiempo',
      desc: 'Horas trabajadas, ritmo y descansos',
      preguntas: [
        '¿Cuántas horas llevo?',
        '¿Cómo voy de ritmo?',
        'Días trabajados este mes',
        '¿Cuánto descanso he tenido?'
      ]
    },
    {
      id: 'analisis',
      icono: '✦',
      titulo: 'Análisis',
      desc: 'Festivos, horas extras y recargos',
      preguntas: [
        'Festivos trabajados',
        'Horas extras',
        'Resumen general',
        'Distribución por recargo'
      ]
    },
    {
      id: 'ayuda',
      icono: '?',
      titulo: 'Cómo funciona',
      desc: 'Entiende cómo calculo todo',
      preguntas: [
        '¿Cómo se calculan los recargos?',
        '¿Qué es el recargo nocturno?',
        '¿Cómo cuentan los festivos?',
        '¿Qué incluye el sueldo base?'
      ]
    }
  ];

  var tieneConversacion = msgs.length > 0;

  return h(
    'div',
    { className: 'fadeUp asistente-wrap' },

    // ═══ HERO: saludo cálido (solo sin conversación) ═══
    !tieneConversacion &&
      h(
        'div',
        { className: 'asistente-hero' },
        h(
          'div',
          { className: 'asistente-orb' },
          h('div', { className: 'asistente-orb-glow' }),
          h('div', { className: 'asistente-orb-symbol' }, '✦')
        ),
        h('h1', { className: 'asistente-greeting' }, saludo + '.'),
        h(
          'p',
          { className: 'asistente-intro' },
          'Soy tu asistente. Conozco tus turnos, recargos y movimientos del mes.',
          h('br'),
          h(
            'span',
            { className: 'asistente-intro-soft' },
            'Pregúntame en tus palabras, o explora las categorías.'
          )
        )
      ),

    // ═══ CATEGORÍAS EXPANDIBLES (solo sin conversación) ═══
    !tieneConversacion &&
      h(
        'div',
        { className: 'asistente-cats' },
        categorias.map(function (cat) {
          var abierta = openCat === cat.id;
          return h(
            'div',
            {
              key: cat.id,
              className: 'asistente-cat' + (abierta ? ' open' : '')
            },
            h(
              'button',
              {
                className: 'asistente-cat-head',
                onClick: function () {
                  haptic();
                  setOpenCat(abierta ? null : cat.id);
                }
              },
              h('div', { className: 'asistente-cat-ico' }, cat.icono),
              h(
                'div',
                { className: 'asistente-cat-txt' },
                h('div', { className: 'asistente-cat-ttl' }, cat.titulo),
                h('div', { className: 'asistente-cat-dsc' }, cat.desc)
              ),
              h('div', { className: 'asistente-cat-chev' }, abierta ? '−' : '+')
            ),
            abierta &&
              h(
                'div',
                { className: 'asistente-cat-body' },
                cat.preguntas.map(function (q, i) {
                  return h(
                    'button',
                    {
                      key: i,
                      className: 'asistente-cat-q',
                      onClick: function () {
                        send(q);
                      }
                    },
                    h('span', { className: 'asistente-cat-q-txt' }, q),
                    h('span', { className: 'asistente-cat-q-arr' }, '→')
                  );
                })
              )
          );
        })
      ),

    // ═══ CONVERSACIÓN ═══
    tieneConversacion &&
      h(
        'div',
        { className: 'asistente-chat' },
        msgs.map(function (m, i) {
          if (m.role === 'ai') {
            return h(
              'div',
              { key: i, className: 'asistente-msg ai' },
              h('div', { className: 'asistente-msg-orb' }, '✦'),
              h(
                'div',
                { className: 'asistente-col' },
                h('div', {
                  className: 'asistente-bubble ai',
                  dangerouslySetInnerHTML: { __html: _aiFormat(m.content) }
                }),
                m.action && m.action.type === 'email_compose'
                  ? h(EmailComposeCard, {
                      data: m.action.data,
                      parent: props,
                      onResolved: function (r) {
                        resolveAction(i, r);
                      }
                    })
                  : null,
                m.actionResult
                  ? h(
                      'div',
                      {
                        className: 'email-result-badge ' + (m.actionResult.ok ? 'ok' : 'bad')
                      },
                      m.actionResult.msg
                    )
                  : null
              )
            );
          }
          return h(
            'div',
            { key: i, className: 'asistente-msg user' },
            h('div', { className: 'asistente-bubble user' }, m.content)
          );
        }),
        busy &&
          h(
            'div',
            { className: 'asistente-msg ai' },
            h('div', { className: 'asistente-msg-orb' }, '✦'),
            h(
              'div',
              { className: 'asistente-bubble ai typing' },
              h('span', { className: 'asistente-dot' }),
              h('span', { className: 'asistente-dot' }),
              h('span', { className: 'asistente-dot' })
            )
          ),
        h('div', { ref: endRef })
      ),

    // ═══ COMPOSER ═══
    h(
      'div',
      { className: 'asistente-composer' },
      h('textarea', {
        ref: inputRef,
        className: 'asistente-input',
        placeholder: tieneConversacion ? 'Sigue preguntando…' : 'O escríbeme directamente…',
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
          className: 'asistente-send' + (input.trim() && !busy ? ' active' : ''),
          onClick: function () {
            send();
          },
          disabled: !input.trim() || busy,
          'aria-label': 'Enviar'
        },
        '↑'
      )
    ),

    // ═══ Reanudar / nueva conversación ═══
    tieneConversacion &&
      h('button', { className: 'asistente-reset', onClick: clearChat }, 'Nueva conversación')
  );
}
