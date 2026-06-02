// ═══════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Pestaña Asistente IA — solo el componente AsistenteTab.
//  Los helpers viven en archivos separados desde v48:
//    · services/ai-history.js       historial + formato markdown
//    · services/ai-greeting.js      saludo + nombre + frases del hero
//    · modals/email-compose-card.js EmailComposeCard (inline en chat)
//  Globales usadas: useState, useEffect, useCallback, useRef, h,
//  haptic, aiAnswer, CLOUD_MODE, EmailComposeCard, _aiLoadHistory,
//  _aiSaveHistory, _aiClearHistory, _aiFormat, _aiHeroPhrases.
// ═══════════════════════════════════════════════════════════════

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
  var hi = useState(0);
  var heroIdx = hi[0],
    setHeroIdx = hi[1];
  var endRef = useRef(null);
  var inputRef = useRef(null);

  var tieneConversacion = msgs.length > 0;

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

  // Rotación de la frase del hero (cada 7 s, solo sin conversación)
  useEffect(
    function () {
      if (tieneConversacion) return;
      var t = setInterval(function () {
        setHeroIdx(function (n) {
          return n + 1;
        });
      }, 7000);
      return function () {
        clearInterval(t);
      };
    },
    [tieneConversacion]
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

  // Saludo según la hora del día (mismo helper que usa el historial)
  var saludo = _saludoHora(new Date());

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

  var phrases = _aiHeroPhrases(props);

  return h(
    'section',
    { className: 'fadeUp asistente-wrap', 'aria-label': 'Asistente AI' },

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
        h('div', { className: 'asistente-phrase', key: heroIdx }, phrases[heroIdx % phrases.length])
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
                'aria-label': cat.titulo + (abierta ? ' (abierto)' : ' (cerrado)'),
                'aria-expanded': abierta,
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
                      'aria-label': 'Preguntar: ' + q,
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

    // ═══ DESCRIPCIÓN FIJA (solo sin conversación) ═══
    !tieneConversacion &&
      h(
        'p',
        { className: 'asistente-about' },
        'Soy tu asistente. Conozco tus turnos, recargos y movimientos del mes — ' +
          'pregúntame en tus palabras o explora las categorías.'
      ),

    // ═══ CONVERSACIÓN ═══
    tieneConversacion &&
      h(
        'div',
        {
          className: 'asistente-chat',
          role: 'region',
          'aria-live': 'polite',
          'aria-atomic': 'false',
          'aria-label': 'Conversación con asistente'
        },
        msgs.map(function (m, i) {
          if (m.role === 'ai') {
            return h(
              'div',
              { key: i, className: 'asistente-msg ai', 'aria-label': 'Mensaje del asistente' },
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
        'aria-label': 'Tu mensaje al asistente',
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
      h(
        'button',
        { className: 'asistente-reset', onClick: clearChat, 'aria-label': 'Nueva conversación' },
        'Nueva conversación'
      )
  );
}
