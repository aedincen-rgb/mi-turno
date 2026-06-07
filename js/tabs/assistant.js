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

  // Auto-leer respuestas de la IA
  var ar = useState(false);
  var autoRead = ar[0], setAutoRead = ar[1];

  // Cleanup al desmontar el componente (evita memory leaks)
  useEffect(function () {
    return function () {
      if (audioAnimRef.current) clearInterval(audioAnimRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (typeof speechSynthesis !== 'undefined') {
        try { speechSynthesis.cancel(); } catch (_) {}
      }
    };
  }, []);

  // Modo manos libres: conversación continua escuchar→responder→leer→repetir
  var hf = useState(false);
  var handsFree = hf[0], setHandsFree = hf[1];

  // Nivel de audio (para visualización mientras graba)
  var al = useState(0);
  var audioLevel = al[0], setAudioLevel = al[1];
  var audioAnimRef = useRef(null);

  var tieneConversacion = msgs.length > 0;

  // ── Comandos de voz (usa voice-agent.js si está disponible) ──
  function detectVoiceCommand(text) {
    // Usar el motor de voz avanzado si está cargado
    if (typeof voiceDetect === 'function') {
      var cmd = voiceDetect(text);
      if (cmd) {
        var ctx = {
          setHandsFree: setHandsFree,
          setAutoRead: setAutoRead,
          onNavigate: props.onNavigate,
          onStartTurno: props.onStartTurno,
          onStopTurno: props.onStopTurno,
          turnos: props.turnos,
          calc: props.calc,
          salario: props.salario
        };
        var result = voiceExecute(cmd, ctx);
        if (result && result.type === 'ask') {
          return { action: 'ask', query: result.query };
        }
        if (result && result.type === 'local') {
          if (result.msg) {
            setInput(result.msg);
            setTimeout(function () { setInput(''); }, 4000);
          }
          return { action: 'local' };
        }
        if (result && result.type === 'error') {
          setInput(result.msg || 'Error al ejecutar comando');
          setTimeout(function () { setInput(''); }, 4000);
          return { action: 'local' };
        }
        if (result && result.type === 'success') {
          setInput(result.msg || 'Listo');
          setTimeout(function () { setInput(''); }, 3000);
          return { action: 'local' };
        }
        if (result && result.type === 'navigate') {
          return { action: 'nav', tab: result.tab, sub: result.sub };
        }
        return null;
      }
    }
    // Fallback: comandos básicos si el módulo no está disponible
    var t = (text || '').toLowerCase().trim();
    if (t.indexOf('ir a inicio') >= 0) return { action: 'nav', tab: 'home' };
    if (t.indexOf('ir a análisis') >= 0 || t.indexOf('ir a analisis') >= 0) return { action: 'nav', tab: 'dashboard' };
    if (t.indexOf('ir a asistente') >= 0) return { action: 'nav', tab: 'ai' };
    if (t.indexOf('ir a historial') >= 0) return { action: 'nav', tab: 'history' };
    if (t.indexOf('ir a ajustes') >= 0) return { action: 'nav', tab: 'config' };
    if (t.indexOf('iniciar turno') >= 0) return { action: 'nav', tab: 'home', sub: 'start' };
    if (t.indexOf('finalizar turno') >= 0) return { action: 'nav', tab: 'home', sub: 'stop' };
    return null;
  }

  // ── Iniciar escucha (reutilizable, con protección anti-bucle) ──
  var _micBusy = useRef(false);
  function startListening() {
    // Protección: no iniciar si ya está escuchando, ocupado, o en plena operación
    if (listening || busy || _micBusy.current) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    _micBusy.current = true;
    try {
      // Limpiar cualquier sesión anterior
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
      }
      var rec = new SR();
      rec.lang = 'es-CO';
      rec.interimResults = true;
      rec.continuous = false;

      // Simular nivel de audio mientras graba
      if (audioAnimRef.current) clearInterval(audioAnimRef.current);
      audioAnimRef.current = setInterval(function () {
        setAudioLevel(Math.random() * 0.6 + 0.2);
      }, 150);

      rec.onresult = function (e) {
        var transcript = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
        setAudioLevel(0.8);
        if (e.results[0].isFinal) {
          // Limpiar estado de escucha (también libera _micBusy)
          _cleanupRecording();
          var finalText = transcript.trim();
          if (finalText) {
            var cmd = detectVoiceCommand(finalText);
            if (cmd) {
              if (cmd.action === 'nav') {
                if (props.onNavigate) props.onNavigate(cmd.tab, cmd.sub || null);
                if (handsFree) {
                  setTimeout(function () { startListening(); }, 1800);
                }
                return;
              }
              if (cmd.action === 'local') {
                setInput('');
                if (cmd.msg) {
                  setInput(cmd.msg);
                  setTimeout(function () { setInput(''); }, 4000);
                }
                if (handsFree) {
                  setTimeout(function () { startListening(); }, 1600);
                }
                return;
              }
            }
            // Enviar a la IA normalmente
            setTimeout(function () { send(finalText); }, 400);
          }
        }
      };

      rec.onerror = function (e) {
        _cleanupRecording();
        _micBusy.current = false;
        if (e.error === 'not-allowed') {
          setHandsFree(false);
          setAutoRead(false);
          return;
        }
        // Reintento suave en manos libres (solo si no fue cancelado manual)
        if (handsFree && e.error !== 'aborted') {
          setTimeout(function () { startListening(); }, 2000);
        }
      };

      rec.onend = function () {
        _cleanupRecording();
        // Solo re-escuchar si handsFree está activo Y no se detuvo manualmente
        // Y no estamos en medio de enviar un mensaje (busy)
        if (handsFree && !busy && _micBusy.current === false) {
          // _micBusy ya fue liberado por onresult o onerror
          // Solo reintentar si no hay un proceso en curso
          setTimeout(function () { startListening(); }, 600);
        }
      };

      rec.start();
      setListening(true);
      recognitionRef.current = rec;
    } catch (err) {
      _cleanupRecording();
      _micBusy.current = false;
      setListening(false);
      setHandsFree(false);
    }
  }

  function _cleanupRecording() {
    if (audioAnimRef.current) { clearInterval(audioAnimRef.current); audioAnimRef.current = null; }
    setAudioLevel(0);
    setListening(false);
    _micBusy.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
  }

  function stopListening() {
    _micBusy.current = true; // bloquear reinicio inmediato por onend
    setHandsFree(false);
    _cleanupRecording();
    // _cleanupRecording ya pone _micBusy en false, pero mantenemos el bloqueo
    // un poco más para que cualquier onend pendiente no reinicie
    setTimeout(function () { _micBusy.current = false; }, 500);
  }

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
        // Solo re-escuchar si manos libres sigue activo y no estamos ocupados
        if (handsFree && !busy && !listening && !_micBusy.current) {
          setTimeout(function () { startListening(); }, 800);
        }
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
          // Auto-leer respuesta si está activado
          if (autoRead && typeof speechSynthesis !== 'undefined') {
            setTimeout(function () {
              var idx = msgs.length; // el nuevo mensaje es el último
              startSpeak(idx, newMsg.content);
            }, 600);
          }
        },
        350 + Math.random() * 250
      );
    },
    [input, busy, props, clearChat]
  );

  // Saludo según la hora del día (mismo helper que usa el historial)
  var saludo = _saludoHora(new Date());

  // Categorías: lista expandible (una abierta a la vez)
  var categorias = [
    {
      id: 'ingresos',
      icono: '$',
      titulo: 'Ingresos',
      desc: 'Cuánto llevas, tu mejor día y proyecciones',
      preguntas: [
        '¿Cuánto gané este mes?',
        '¿Cuánto gané ayer?',
        '¿Cuánto gané hoy?',
        'Mi mejor día',
        '¿Cuál fue mi peor día?',
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
        '¿Cuántas horas trabajé ayer?',
        '¿Cómo voy de ritmo?',
        'Días trabajados este mes',
        '¿Cuánto descanso he tenido?',
        '¿Cuánto gano por hora?'
      ]
    },
    {
      id: 'analisis',
      icono: '✦',
      titulo: 'Análisis',
      desc: 'Festivos, horas extras, recargos y distribuciones',
      preguntas: [
        'Festivos trabajados',
        'Horas extras',
        'Horas nocturnas',
        'Resumen general',
        'Distribución por recargo',
        '¿Cuántos días seguidos llevo?'
      ]
    },
    {
      id: 'comparar',
      icono: '⚖',
      titulo: 'Comparativas',
      desc: 'Compara periodos y mira tendencias',
      preguntas: [
        '¿VS mes pasado?',
        '¿VS semana pasada?',
        '¿Mejor que el mes pasado?',
        '¿Cómo voy vs mi meta?',
        '¿Promedio diario este mes?'
      ]
    },
    {
      id: 'simular',
      icono: '🔮',
      titulo: 'Simulaciones',
      desc: 'Proyectá escenarios hipotéticos',
      preguntas: [
        '¿Cuánto si trabajo 4h más?',
        '¿Cuánto si hago 1 turno extra?',
        '¿Cuánto necesito para llegar a 2 millones?',
        '¿Cuánto ganaría si solo hago nocturnas?',
        'Escenario optimista y pesimista'
      ]
    },
    {
      id: 'ayuda',
      icono: '?',
      titulo: 'Cómo funciona',
      desc: 'Entiende cómo calculo todo, leyes y más',
      preguntas: [
        '¿Cómo se calculan los recargos?',
        '¿Qué es el recargo nocturno?',
        '¿Cómo cuentan los festivos?',
        '¿Qué incluye el sueldo base?',
        '¿Cuánto es el auxilio de transporte?',
        '¿Cómo exporto mis datos?'
      ]
    },
    {
      id: 'usarapp',
      icono: '📱',
      titulo: 'Usar la app',
      desc: 'Guías paso a paso para cada función',
      preguntas: [
        '¿Estoy conectado a Supabase?',
        '¿Cómo funciona sin internet?',
        '¿Cómo modifico los días de la quincena?',
        '¿Cómo cambio mi foto de perfil?',
        '¿Cómo instalo la app en mi celular?',
        '¿Cómo comparto por WhatsApp?',
        '¿Cómo respaldo mis datos?'
      ]
    },
    {
      id: 'logros',
      icono: '🏅',
      titulo: 'Comandos rápidos',
      desc: 'Insignias, metas, simulaciones y tendencias',
      preguntas: [
        { label: 'Ver mis insignias', query: '/logros' },
        { label: '¿Cuánto falta para 2 millones?', query: '/meta 2000000' },
        { label: 'Simular 4 horas extra nocturnas', query: '/simular 4h nocturnas' },
        { label: 'Comparar últimos 3 meses', query: '/tendencia' },
        { label: 'Resumen de esta semana', query: '/semana' },
        { label: 'Lo que gané hoy', query: '/dia' },
        { label: 'Resumen exprés del mes', query: '/stats' }
      ]
    }
  ];

  var phrases = _aiHeroPhrases(props);
  // Prepend briefing si está disponible
  if (typeof aiBriefing === 'function') {
    var briefing = aiBriefing(props.calc ? Object.assign({}, props.calc, { ahora: new Date(), salario: props.salario, vh: props.vh, turnos: props.turnos }) : null);
    if (briefing) {
      phrases = [briefing].concat(phrases);
    }
  }

  return h(
    'section',
    { className: 'asistente-wrap' + (tieneConversacion ? ' has-chat' : ''), 'aria-label': 'Asistente AI' },

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

    // ═══ QUICK CHIPS (acciones rápidas, siempre visibles) ═══
    h(
      'div',
      { className: 'asistente-chips' },
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('¿Cuánto gané ayer?'); } },
        h('span', { className: 'asistente-chip-ico' }, '📅'),
        'Ayer'
      ),
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('¿Cuánto gané este mes?'); } },
        h('span', { className: 'asistente-chip-ico' }, '💰'),
        'Este mes'
      ),
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('Proyección al cierre'); } },
        h('span', { className: 'asistente-chip-ico' }, '🔮'),
        'Proyección'
      ),
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('¿VS mes pasado?'); } },
        h('span', { className: 'asistente-chip-ico' }, '⚖'),
        'VS mes pasado'
      ),
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('¿Cuánto si trabajo 4h más?'); } },
        h('span', { className: 'asistente-chip-ico' }, '🧮'),
        'Simular'
      ),
      h(
        'button',
        { className: 'asistente-chip', onClick: function () { send('/tendencia'); } },
        h('span', { className: 'asistente-chip-ico' }, '📈'),
        'Tendencia'
      )
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

    // ═══ SCROLL-TO-BOTTOM ═══
    tieneConversacion &&
      h(
        'button',
        {
          className: 'asistente-scroll-btn',
          onClick: function () {
            if (endRef.current) {
              endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
            }
          },
          'aria-label': 'Ir al último mensaje',
          title: 'Ir al final'
        },
        '↓'
      ),

    // ═══ COMPOSER ═══
    h(
      'div',
      { className: 'asistente-composer' },
      h('textarea', {
        ref: inputRef,
        className: 'asistente-input' + (listening ? ' listening' : ''),
        'aria-label': 'Tu mensaje al asistente',
        placeholder: 'Escribe…',
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
                  stopListening();
                  return;
                }
                startListening();
              },
              disabled: busy && !listening,
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

    // ═══ AUTO-READ TOGGLE ═══
    typeof speechSynthesis !== 'undefined' &&
      h(
        'button',
        {
          className: 'asistente-autoread' + (autoRead ? ' active' : ''),
          onClick: function () {
            haptic();
            setAutoRead(!autoRead);
            if (!autoRead && handsFree) setHandsFree(false);
          },
          'aria-label': autoRead ? 'Desactivar lectura automática' : 'Activar lectura automática de respuestas',
          title: autoRead ? 'Lectura automática activada' : 'Activar lectura automática'
        },
        h('span', { className: 'asistente-autoread-dot' }),
        autoRead ? 'Lectura automática activada' : 'Leer respuestas en voz alta'
      ),

    // ═══ MODO MANOS LIBRES ═══
    typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined'
      ? h(
          'button',
          {
            className: 'asistente-handsfree' + (handsFree ? ' active' : ''),
            onClick: function () {
              haptic();
              if (!handsFree) {
                setAutoRead(true);
                setHandsFree(true);
                setTimeout(function () { startListening(); }, 500);
              } else {
                stopListening();
              }
            },
            'aria-label': handsFree ? 'Desactivar modo manos libres' : 'Activar modo manos libres',
            title: handsFree ? 'Modo conversación continua activado' : 'Activar conversación por voz'
          },
          h('span', { className: 'asistente-handsfree-dot' }),
          handsFree ? '🗣 Modo manos libres activo' : '🎙 Activar manos libres'
        )
      : null,

    // ═══ VISUALIZADOR DE AUDIO (sutil: solo un puntito en el input) ═══
    handsFree && !listening
      ? h('div', { className: 'asistente-handsfree-dot-active', 'aria-hidden': 'true' })
      : null,

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
                var label, query;
                if (typeof q === 'object' && q.label && q.query) {
                  label = q.label;
                  query = q.query;
                } else {
                  label = q;
                  query = q;
                }
                return h(
                  'button',
                  {
                    key: i,
                    className: 'asistente-cat-q',
                    'aria-label': 'Preguntar: ' + label,
                    onClick: function () {
                      send(query);
                    }
                  },
                  h('span', { className: 'asistente-cat-q-txt' }, label),
                  h('span', { className: 'asistente-cat-q-arr' }, '→')
                );
              })
            )
        );
      })
    )
  );
}
