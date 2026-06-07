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
  var recognitionRef = useRef(null);

  // Estado de escucha por voz
  var ls = useState(false);
  var listening = ls[0], setListening = ls[1];

  // Estado de reproducción de voz (anillo de progreso)
  var speakRef = useRef({ msgIdx: -1, status: 'idle', progress: 0, utterance: null, startTime: 0, pausedAt: 0 });
  var sps = useState({ idx: -1, status: 'idle', progress: 0 });
  var speakUI = sps[0], setSpeakUI = sps[1];

  var tieneConversacion = msgs.length > 0;

  // ── Helpers de voz ──
  function cleanSpeakText(text) {
    return (text || '')
      .replace(/\*\*|__|\*|`/g, '')
      .replace(/🏆/g, function () {
        return ' ¡' + (typeof _glTerm === 'function' ? _glTerm('champion') : 'campeón') + '! ';
      })
      .replace(/[🔥🚀✨💪🙌🎉🎯💡⚡🌟👑💎📊💰📅🔮🤖📖⚖️📡📱♿🔗📧⚠️✅📋⏱📤💬🔊🛡📦📂🔑🛠🐞👥◷✦🎬🍎🇨🇴]/g, '')
      .replace(/(\d+)mins\b/g, '$1 minutos')
      .replace(/\bmins\b/g, 'minutos')
      .replace(/(\d+)m\b/g, '$1 minutos')
      .replace(/(\d+)h\b/g, '$1 horas')
      .replace(/\$|USD/g, ' pesos ')
      .replace(/\bCOP\b/g, 'pesos');
  }

  function startSpeak(idx, text) {
    var clean = cleanSpeakText(text);
    var utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'es-CO';
    utter.rate = 1.1;
    
    var st = speakRef.current;
    st.msgIdx = idx; st.status = 'speaking'; st.progress = 0;
    st.startTime = Date.now(); st.pausedAt = 0; st.utterance = utter;
    st._estimatedDuration = clean.length * 55; // ~55ms por carácter en español
    
    utter.onboundary = function (e) {
      if (e.name === 'word' && st.status === 'speaking') {
        var elapsed = Date.now() - st.startTime;
        var progress = Math.min(0.95, elapsed / st._estimatedDuration);
        st.progress = progress;
        setSpeakUI({ idx: idx, status: 'speaking', progress: progress });
      }
    };
    
    utter.onend = function () {
      if (st.msgIdx === idx) {
        st.status = 'idle'; st.progress = 1;
        setSpeakUI({ idx: idx, status: 'idle', progress: 0 });
        setTimeout(function () {
          if (speakRef.current.msgIdx === idx && speakRef.current.status === 'idle') {
            setSpeakUI({ idx: -1, status: 'idle', progress: 0 });
          }
        }, 2000);
      }
    };
    
    utter.onerror = function () {
      st.status = 'idle'; st.progress = 0;
      setSpeakUI({ idx: -1, status: 'idle', progress: 0 });
    };
    
    speechSynthesis.speak(utter);
    setSpeakUI({ idx: idx, status: 'speaking', progress: 0 });
  }

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
      if (typeof aiResetConv === 'function') aiResetConv();
      if (typeof aiClearMemory === 'function') aiClearMemory();
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
          } else if (resp && typeof resp === 'object' && resp.actions) {
            newMsg = { role: 'ai', content: resp.text, actions: resp.actions };
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

    // ═══ HERO iOS STYLE: orb izq + texto der (siempre visible) ═══
    h(
      'div',
      { className: 'asistente-hero' },
      h(
        'div',
        { className: 'asistente-hero-orb' },
        h('div', { className: 'asistente-hero-orb-symbol' }, '✦')
      ),
      h(
        'div',
        { className: 'asistente-hero-txt' },
        h('h1', { className: 'asistente-greeting' }, saludo + '.'),
        h('div', { className: 'asistente-phrase', key: heroIdx }, phrases[heroIdx % phrases.length])
      )
    ),

    // ═══ ABOUT: puente entre el saludo y la casilla (desaparece al conversar) ═══
    // Se inserta aquí para contextualizar la invitación a escribir en el composer.
    !tieneConversacion &&
      h(
        'p',
        { className: 'asistente-about' },
        'Soy tu asistente. Conozco tus turnos, recargos y movimientos del mes — ' +
          'pregúntame en tus palabras o explorá las categorías.'
      ),

    // ═══ CHAT (visible solo si hay conversación) ═══
    tieneConversacion
      ? h(
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
                  // Botón de voz: anillo de progreso con pausa/reinicio
                  typeof speechSynthesis !== 'undefined'
                    ? h(
                        'button',
                        {
                          className: 'asistente-speak-btn' + 
                            (speakUI.idx === i && speakUI.status !== 'idle' ? ' speaking' : ''),
                          onClick: function () {
                            haptic();
                            var now = Date.now();
                            var st = speakRef.current;
                            
                            // Double tap → reiniciar desde el principio
                            if (st.msgIdx === i && now - (st._lastTap || 0) < 500) {
                              speechSynthesis.cancel();
                              st.status = 'idle'; st.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                              startSpeak(i, m.content);
                              return;
                            }
                            st._lastTap = now;
                            
                            // Si este mensaje está hablando → pausar/reanudar
                            if (st.msgIdx === i && st.status === 'speaking') {
                              speechSynthesis.pause();
                              st.status = 'paused'; st.pausedAt = now;
                              setSpeakUI({ idx: i, status: 'paused', progress: st.progress });
                              return;
                            }
                            if (st.msgIdx === i && st.status === 'paused') {
                              speechSynthesis.resume();
                              st.status = 'speaking'; st.startTime += (now - st.pausedAt);
                              setSpeakUI({ idx: i, status: 'speaking', progress: st.progress });
                              return;
                            }
                            
                            // Nuevo mensaje: cancelar anterior y empezar
                            speechSynthesis.cancel();
                            startSpeak(i, m.content);
                          },
                          // Long press → parar y resetear
                          onMouseDown: function () { speakRef.current._pressStart = Date.now(); },
                          onMouseUp: function () {
                            var held = Date.now() - (speakRef.current._pressStart || 0);
                            if (held > 600 && speakRef.current.msgIdx === i) {
                              speechSynthesis.cancel();
                              speakRef.current.status = 'idle'; speakRef.current.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                            }
                          },
                          onTouchStart: function () { speakRef.current._pressStart = Date.now(); },
                          onTouchEnd: function () {
                            var held = Date.now() - (speakRef.current._pressStart || 0);
                            if (held > 600 && speakRef.current.msgIdx === i) {
                              speechSynthesis.cancel();
                              speakRef.current.status = 'idle'; speakRef.current.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                            }
                          },
                          'aria-label': speakUI.idx === i && speakUI.status === 'speaking' ? 'Pausar voz' :
                                       speakUI.idx === i && speakUI.status === 'paused' ? 'Reanudar voz' : 'Escuchar',
                          title: 'Tocá: pausar · Doble toque: reiniciar · Sostené: parar'
                        },
                        h('svg', {
                          viewBox: '0 0 36 36',
                          width: 28, height: 28,
                          style: { transform: 'rotate(-90deg)' }
                        },
                          h('circle', {
                            cx: 18, cy: 18, r: 14,
                            fill: 'none',
                            stroke: 'var(--border)',
                            'stroke-width': 3
                          }),
                          h('circle', {
                            cx: 18, cy: 18, r: 14,
                            fill: 'none',
                            stroke: 'var(--accent)',
                            'stroke-width': 3,
                            strokeDasharray: 87.96,
                            strokeDashoffset: 87.96 - (87.96 * (speakUI.idx === i ? speakUI.progress : 0)),
                            strokeLinecap: 'round',
                            style: { transition: 'stroke-dashoffset 0.3s linear' }
                          })
                        ),
                        speakUI.idx === i && speakUI.status === 'paused'
                          ? h('span', { className: 'asistente-speak-icon' }, '▶')
                          : speakUI.idx !== i || speakUI.status === 'idle'
                            ? h('span', { className: 'asistente-speak-icon' }, '🔊')
                            : null
                      )
                    : null,
                  // Botones de acción rápida (ai-enhanced.js)
                  m.actions && m.actions.length
                    ? h(
                        'div',
                        { className: 'asistente-actions' },
                        m.actions.map(function (a, j) {
                          return h(
                            'button',
                            {
                              key: j,
                              className: 'asistente-action-btn',
                              onClick: function () { send(a.query); }
                            },
                            a.label
                          );
                        })
                      )
                    : null,
                  m.action && m.action.type === 'email_compose'
                    ? h(EmailComposeCard, {
                        data: m.action.data,
                        parent: props,
                        onResolved: function (r) { resolveAction(i, r); }
                      })
                    : null,
                  m.actionResult
                    ? h('div', { className: 'email-result-badge ' + (m.actionResult.ok ? 'ok' : 'bad') }, m.actionResult.msg)
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
        )
      : null,

    // ═══ COMPOSER ═══
    h(
      'div',
      { className: 'asistente-composer' },
      h('textarea', {
        ref: inputRef,
        className: 'asistente-input',
        'aria-label': 'Tu mensaje al asistente',
        placeholder: tieneConversacion ? 'Seguí preguntando…' : 'O escribime directamente…',
        value: input,
        onChange: function (e) { setInput(e.target.value); },
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
          onClick: function () { send(); },
          disabled: !input.trim() || busy,
          'aria-label': 'Enviar'
        },
        '↑'
      ),
      // Micrófono: voz a texto (SpeechRecognition)
      (typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined')
        ? h(
            'button',
            {
              className: 'asistente-mic' + (listening ? ' listening' : ''),
              onClick: function () {
                haptic();
                if (listening) {
                  if (recognitionRef.current) recognitionRef.current.stop();
                  setListening(false);
                  return;
                }
                var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) {
                  alert('Reconocimiento de voz no disponible en este navegador. Probá con Chrome o Edge.');
                  return;
                }
                try {
                  var rec = new SR();
                  rec.lang = 'es-CO';
                  rec.interimResults = true;
                  rec.continuous = false;
                  rec.onresult = function (e) {
                    var transcript = '';
                    for (var i = e.resultIndex; i < e.results.length; i++) {
                      transcript += e.results[i][0].transcript;
                    }
                    setInput(transcript);
                    if (e.results[0].isFinal) {
                      setListening(false);
                      var finalText = transcript.trim();
                      if (finalText) {
                        setTimeout(function () { send(finalText); }, 500);
                      }
                    }
                  };
                  rec.onerror = function (e) {
                    setListening(false);
                    if (e.error === 'not-allowed') {
                      alert('Permiso de micrófono denegado. Concedelo en Configuración del navegador.');
                    } else if (e.error !== 'no-speech') {
                      console.log('Mic error:', e.error);
                    }
                  };
                  rec.onend = function () { setListening(false); };
                  rec.start();
                  setListening(true);
                  recognitionRef.current = rec;
                } catch (err) {
                  setListening(false);
                  alert('No se pudo iniciar el micrófono: ' + (err.message || 'error desconocido'));
                }
              },
              disabled: busy,
              'aria-label': listening ? 'Grabando… tocá para detener' : 'Hablar por voz',
              title: listening ? 'Grabando… tocá para detener' : 'Hablar por voz'
            },
            h('svg', {
              viewBox: '0 0 24 24',
              width: 22, height: 22,
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': 2,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round'
            },
              // Cuerpo del micrófono (rectángulo redondeado)
              h('rect', { x: 9, y: 1, width: 6, height: 11, rx: 3 }),
              // Línea inferior (base)
              h('line', { x1: 12, y1: 17, x2: 12, y2: 22 }),
              // Arco de la base
              h('path', { d: 'M8 22h8' }),
              // Ondas de sonido (arcos laterales) — solo cuando NO está escuchando
              listening ? null : h('path', { d: 'M5 9a7 7 0 0 0 0 5M19 9a7 7 0 0 1 0 5' })
            )
          )
        : null
    ),

    // ═══ Reanudar / nueva conversación ═══
    tieneConversacion &&
      h(
        'button',
        { className: 'asistente-reset', onClick: clearChat, 'aria-label': 'Nueva conversación' },
        'Nueva conversación'
      ),

    // ═══ CATEGORÍAS PRECARGADAS (siempre visibles, al final) ═══
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
    )
  );
}
