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
  var listening = ls[0],
    setListening = ls[1];

  // Estado de reproducción de voz (anillo de progreso)
  var speakRef = useRef({
    msgIdx: -1,
    status: 'idle',
    progress: 0,
    utterance: null,
    startTime: 0,
    pausedAt: 0
  });
  var sps = useState({ idx: -1, status: 'idle', progress: 0 });
  var speakUI = sps[0],
    setSpeakUI = sps[1];

  // Auto-leer respuestas de la IA
  var ar = useState(false);
  var autoRead = ar[0],
    setAutoRead = ar[1];

  // Sincronizar el global _geminiModeOn con el estado React al montar.
  // Necesario porque send() lee window._geminiModeOn (closure captura el ref global,
  // no el estado React, para evitar que la closure quede desactualizada en el setTimeout).
  useEffect(
    function () {
      window._geminiModeOn = geminiMode;
    },
    [geminiMode]
  );

  // Cleanup al desmontar el componente (evita memory leaks)
  useEffect(function () {
    return function () {
      if (audioAnimRef.current) clearInterval(audioAnimRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (typeof speechSynthesis !== 'undefined') {
        try {
          speechSynthesis.cancel();
        } catch (_) {}
      }
    };
  }, []);

  // Modo manos libres: conversación continua escuchar→responder→leer→repetir
  var hf = useState(false);
  var handsFree = hf[0],
    setHandsFree = hf[1];

  // Nivel de audio (para visualización mientras graba)
  var al = useState(0);
  var audioLevel = al[0],
    setAudioLevel = al[1];
  var audioAnimRef = useRef(null);

  // Refs para el botón inteligente (tap = enviar, hold = grabar)
  var pressTimerRef = useRef(null);
  var isLongPressRef = useRef(false);

  // Acción del agente pendiente de confirmación hablada (modo manos libres).
  // Guarda el objeto execute mientras el agente espera un "sí"/"no".
  var pendingActionRef = useRef(null);

  // Modo Gemini forzado: bypass completo del NLP local.
  // Persistido sin uid porque es preferencia del device, no del usuario.
  var gm = useState(function () {
    try {
      return localStorage.getItem('mt_gemini_mode') === '1';
    } catch (_) {
      return false;
    }
  });
  var geminiMode = gm[0],
    setGeminiMode = gm[1];

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
            setTimeout(function () {
              setInput('');
            }, 4000);
          }
          return { action: 'local' };
        }
        if (result && result.type === 'error') {
          setInput(result.msg || 'Error al ejecutar comando');
          setTimeout(function () {
            setInput('');
          }, 4000);
          return { action: 'local' };
        }
        if (result && result.type === 'success') {
          setInput(result.msg || 'Listo');
          setTimeout(function () {
            setInput('');
          }, 3000);
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
    if (t.indexOf('ir a análisis') >= 0 || t.indexOf('ir a analisis') >= 0)
      return { action: 'nav', tab: 'dashboard' };
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
        try {
          recognitionRef.current.abort();
        } catch (_) {}
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
                  setTimeout(function () {
                    startListening();
                  }, 1800);
                }
                return;
              }
              if (cmd.action === 'local') {
                setInput('');
                if (cmd.msg) {
                  setInput(cmd.msg);
                  setTimeout(function () {
                    setInput('');
                  }, 4000);
                }
                if (handsFree) {
                  setTimeout(function () {
                    startListening();
                  }, 1600);
                }
                return;
              }
            }
            // Enviar a la IA normalmente
            setTimeout(function () {
              send(finalText);
            }, 400);
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
          setTimeout(function () {
            startListening();
          }, 2000);
        }
      };

      rec.onend = function () {
        _cleanupRecording();
        // Solo re-escuchar si handsFree está activo Y no se detuvo manualmente
        // Y no estamos en medio de enviar un mensaje (busy)
        if (handsFree && !busy && _micBusy.current === false) {
          // _micBusy ya fue liberado por onresult o onerror
          // Solo reintentar si no hay un proceso en curso
          setTimeout(function () {
            startListening();
          }, 600);
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
    if (audioAnimRef.current) {
      clearInterval(audioAnimRef.current);
      audioAnimRef.current = null;
    }
    setAudioLevel(0);
    setListening(false);
    _micBusy.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }

  function stopListening() {
    _micBusy.current = true; // bloquear reinicio inmediato por onend
    setHandsFree(false);
    _cleanupRecording();
    // _cleanupRecording ya pone _micBusy en false, pero mantenemos el bloqueo
    // un poco más para que cualquier onend pendiente no reinicie
    setTimeout(function () {
      _micBusy.current = false;
    }, 500);
  }

  // ── Helpers de voz ──
  function cleanSpeakText(text) {
    return (text || '')
      .replace(/\*\*|__|\.\*|`/g, '')
      .replace(/🏆/g, function () {
        return (
          ' ¡' + (typeof _glTerm === 'function' ? _glTerm('terms', 'champion') : 'campeón') + '! '
        );
      })
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, '')
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
    st.msgIdx = idx;
    st.status = 'speaking';
    st.progress = 0;
    st.startTime = Date.now();
    st.pausedAt = 0;
    st.utterance = utter;
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
        st.status = 'idle';
        st.progress = 1;
        setSpeakUI({ idx: idx, status: 'idle', progress: 0 });
        // Solo re-escuchar si manos libres sigue activo y no estamos ocupados
        if (handsFree && !busy && !listening && !_micBusy.current) {
          setTimeout(function () {
            startListening();
          }, 800);
        }
      }
    };

    utter.onerror = function () {
      st.status = 'idle';
      st.progress = 0;
      setSpeakUI({ idx: -1, status: 'idle', progress: 0 });
    };

    speechSynthesis.speak(utter);
    setSpeakUI({ idx: idx, status: 'speaking', progress: 0 });
  }

  // ── Briefing hablado al activar manos libres ──
  // Da un resumen real (cuánto llevás, proyección, alertas) en vez de
  // un saludo genérico. Lo agrega al chat y lo lee; al terminar de
  // hablar, el loop de manos libres empieza a escuchar automáticamente.
  function speakBriefing() {
    var text = '';
    try {
      if (typeof buildContext === 'function') {
        var c = buildContext({
          turnos: props.turnos,
          turnosAll: props.turnosAll || props.turnos,
          calc: props.calc,
          salario: props.salario,
          vh: props.vh,
          session: props.session,
          activo: props.activo || null
        });
        var partes = [];
        var hora = _saludoHora(new Date());
        var nombre =
          typeof _aiNombrePersonal === 'function'
            ? _aiNombrePersonal({ session: props.session })
            : '';
        partes.push(hora + (nombre ? ', ' + nombre : '') + '.');
        if (typeof aiBriefing === 'function') {
          var b = aiBriefing(c);
          if (b) partes.push(b);
        }
        if (typeof aiAlerts === 'function') {
          var al = aiAlerts(c);
          if (al) partes.push(al);
        }
        partes.push(
          'Te escucho. Decime qué necesitás, o "ayuda de voz" para ver todo lo que puedo hacer.'
        );
        text = partes.join(' ');
      }
    } catch (_) {}
    if (!text) {
      text = 'Modo manos libres activado. Te escucho — decime qué necesitás.';
    }
    var briefIdx = msgs.length;
    setMsgs(function (p) {
      return p.concat([{ role: 'ai', content: text }]);
    });
    if (typeof speechSynthesis !== 'undefined') {
      setTimeout(function () {
        startSpeak(briefIdx, text);
      }, 400);
    } else {
      // Sin TTS: arrancamos a escuchar igual
      setTimeout(function () {
        startListening();
      }, 600);
    }
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
      if (typeof aiConvReset === 'function') aiConvReset();
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

  // ── Ejecuta una acción del agente IN-PLACE (sin reload) ──
  // Devuelve un texto de confirmación hablable, o null si no aplica.
  var executeAgentAction = useCallback(
    function (execute) {
      if (!execute || !execute.type) return null;
      switch (execute.type) {
        case 'START_SHIFT':
          if (typeof props.onIniTurno === 'function') {
            props.onIniTurno();
            return 'Listo, inicié tu turno. Que te rinda. Te aviso si acumulás muchas horas.';
          }
          if (props.onNavigate) props.onNavigate('home', 'start');
          return 'Inicié tu turno.';
        case 'END_SHIFT':
          if (!props.activo) {
            return 'No tenés ningún turno abierto en este momento.';
          }
          if (typeof props.onFinTurno === 'function') {
            props.onFinTurno();
            return 'Cerré tu turno. ¡Buen descanso! Decí "cuánto gané hoy" para ver el resumen.';
          }
          if (props.onNavigate) props.onNavigate('home', 'stop');
          return 'Cerré tu turno.';
        case 'SET_SALARY':
          if (typeof props.onSetSalario === 'function' && execute.payload) {
            props.onSetSalario(execute.payload);
            return (
              'Actualicé tu salario base a ' +
              (typeof fCOP === 'function' ? fCOP(execute.payload) : execute.payload) +
              '. Ya recalculo todo con ese valor.'
            );
          }
          return null;
        case 'NAVIGATE':
          var tabId = execute.payload === 'ajustes' ? 'config' : execute.payload;
          if (props.onNavigate) {
            props.onNavigate(tabId, null);
          } else {
            var btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
            if (btn) btn.click();
          }
          return null;
        default:
          return null;
      }
    },
    [props]
  );

  // ¿La acción requiere confirmación hablada antes de ejecutarse?
  // Solo las que cambian datos: iniciar/cerrar turno y salario.
  function _needsConfirm(execute) {
    if (!execute || !execute.type) return false;
    return (
      execute.type === 'START_SHIFT' ||
      execute.type === 'END_SHIFT' ||
      execute.type === 'SET_SALARY'
    );
  }

  // Frase corta que describe la acción para pedir confirmación.
  function _confirmPrompt(execute) {
    if (execute.type === 'START_SHIFT') return 'Voy a iniciar tu turno ahora. ¿Confirmás?';
    if (execute.type === 'END_SHIFT') return 'Voy a cerrar tu turno actual. ¿Confirmás?';
    if (execute.type === 'SET_SALARY')
      return (
        'Voy a poner tu salario base en ' +
        (typeof fCOP === 'function' ? fCOP(execute.payload) : execute.payload) +
        '. ¿Confirmás?'
      );
    return '¿Confirmás?';
  }

  // Clasifica una frase como afirmación, negación o ninguna.
  function _yesNo(text) {
    var t = (text || '').toLowerCase().trim();
    var yes =
      /\b(s[ií]|dale|confirmo|confirmado|hazlo|hacelo|correcto|claro|obvio|de una|ok|okay|vale|ya|adelante|por supuesto|exacto)\b/;
    var no =
      /\b(no|cancel[aá]|cancelar|negativo|mejor no|olvidalo|olvídalo|para|detente|abortar|nada)\b/;
    if (no.test(t)) return 'no';
    if (yes.test(t)) return 'yes';
    return null;
  }

  // Detecta frases de descarte/cierre ("no hace falta", "no gracias"...).
  // Las opciones rápidas negativas del motor de engagement llegan con
  // intent === null; tipear la frase también cae acá. No las mandamos al
  // clasificador NLP porque no tienen intent y la IA respondía confundida.
  function _isDismissal(text) {
    var t = (text || '')
      .toLowerCase()
      .trim()
      .replace(/[.!¡¿?]+$/, '');
    return /^(no hace falta|no,? gracias|no me interesa|ya lo s[ée]|con eso basta|no por ahora|otro d[íi]a|as[íi] est[áa] bien|no,? siguiente)$/.test(
      t
    );
  }

  function _aiDismissReply() {
    var opts = [
      'Listo 👍 Cuando quieras seguimos.',
      'De una. Acá estoy si necesitás algo más.',
      'Perfecto, lo dejamos así. Cualquier cosa me preguntás.',
      'Dale 🙌 Si surge algo, escribime.',
      'Va. Quedo atento por si necesitás otra cosa.'
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  var send = useCallback(
    function (text, quickIntent) {
      var q = (text || input).trim();
      if (!q || busy) return;
      haptic();
      setInput('');
      setOpenCat(null);

      if (q === '/limpiar' || q === '/clear' || q === '/reset') {
        clearChat();
        return;
      }

      // ── Resolución de confirmación pendiente (modo agente) ──
      // Si el agente dejó una acción esperando "sí"/"no", interpretamos
      // esta frase como la respuesta antes de tocar la IA.
      if (pendingActionRef.current) {
        var verdict = _yesNo(q);
        var pending = pendingActionRef.current;
        if (verdict === 'yes') {
          pendingActionRef.current = null;
          setMsgs(function (p) {
            return p.concat([{ role: 'user', content: q }]);
          });
          var okText = executeAgentAction(pending) || 'Hecho.';
          var okMsg = { role: 'ai', content: okText };
          setMsgs(function (p) {
            return p.concat([okMsg]);
          });
          if (autoRead && typeof speechSynthesis !== 'undefined') {
            setTimeout(function () {
              startSpeak(msgs.length + 1, okText);
            }, 400);
          }
          return;
        }
        if (verdict === 'no') {
          pendingActionRef.current = null;
          setMsgs(function (p) {
            return p.concat([{ role: 'user', content: q }]);
          });
          var cancelText = 'Listo, lo dejo así. No hice ningún cambio.';
          setMsgs(function (p) {
            return p.concat([{ role: 'ai', content: cancelText }]);
          });
          if (autoRead && typeof speechSynthesis !== 'undefined') {
            setTimeout(function () {
              startSpeak(msgs.length + 1, cancelText);
            }, 400);
          }
          return;
        }
        // Ni sí ni no: descartamos la acción pendiente y seguimos normal.
        pendingActionRef.current = null;
      }

      // ── Quick-reply de descarte / cierre suave ──
      // El botón negativo trae intent === null explícito (lo distingue de
      // los positivos que traen un intent string, y de los botones de ai.js
      // que traen intent === undefined). Tipear la frase ("no hace falta")
      // también cae acá. Cerramos amable sin pasar por NLP — era lo que
      // confundía a la IA (caía en fallback sin intent que despachar).
      // Va DESPUÉS del bloque de acción pendiente: si hay una acción
      // esperando confirmación, "no" debe cancelarla, no cerrar el chat.
      if (quickIntent === null || _isDismissal(q)) {
        setMsgs(function (p) {
          return p.concat([
            { role: 'user', content: q },
            { role: 'ai', content: _aiDismissReply() }
          ]);
        });
        return;
      }

      setMsgs(function (p) {
        return p.concat([{ role: 'user', content: q }]);
      });
      setBusy(true);
      setTimeout(
        async function () {
          var aiState = {
            turnos: props.turnos,
            turnosAll: props.turnosAll || props.turnos,
            calc: props.calc,
            salario: props.salario,
            vh: props.vh,
            session: props.session,
            activo: props.activo || null
          };
          var resp = aiAnswer(q, aiState);
          var newMsg;

          // Modo Gemini forzado: saltar el NLP local completamente.
          if (window._geminiModeOn && typeof aiGeminiAsk === 'function' && isOnline()) {
            setMsgs(function (p) {
              return p.concat([{ role: 'ai', content: '...', _geminiPending: true }]);
            });
            try {
              var geminiForced = await aiGeminiAsk(q, aiState);
              setMsgs(function (p) {
                return p.filter(function (m) {
                  return !m._geminiPending;
                });
              });
              if (geminiForced) {
                resp = geminiForced;
              }
            } catch (_ge) {
              setMsgs(function (p) {
                return p.filter(function (m) {
                  return !m._geminiPending;
                });
              });
            }
          }

          // Detectar respuesta de fallback del NLP local para escalar a Gemini.
          // El fallback genérico siempre contiene esta frase distintiva.
          var respText =
            resp && typeof resp === 'object' ? resp.text || '' : resp ? String(resp) : '';
          var isLocalFallback =
            !window._geminiModeOn && respText.indexOf('No estoy seguro de qué buscas') !== -1;

          if (isLocalFallback && typeof aiGeminiAsk === 'function' && isOnline()) {
            // Indicador sutil: reemplaza el fallback por "pensando..." mientras Gemini responde
            setMsgs(function (p) {
              return p.concat([{ role: 'ai', content: '...', _geminiPending: true }]);
            });
            try {
              var geminiReply = await aiGeminiAsk(q, aiState);
              if (geminiReply) {
                resp = geminiReply;
                // Quitar el placeholder antes de poner la respuesta real
                setMsgs(function (p) {
                  return p.filter(function (m) {
                    return !m._geminiPending;
                  });
                });
              } else {
                // Gemini falló → mantener la respuesta local original
                setMsgs(function (p) {
                  return p.filter(function (m) {
                    return !m._geminiPending;
                  });
                });
              }
            } catch (_e) {
              setMsgs(function (p) {
                return p.filter(function (m) {
                  return !m._geminiPending;
                });
              });
            }
          }

          if (resp && typeof resp === 'object' && resp.execute) {
            if (_needsConfirm(resp.execute)) {
              // Acción que modifica datos → pedimos confirmación hablada
              // antes de ejecutarla. Guardamos la acción y respondemos
              // con la pregunta. El siguiente "sí"/"no" la resuelve.
              pendingActionRef.current = resp.execute;
              newMsg = { role: 'ai', content: _confirmPrompt(resp.execute) };
            } else {
              // Acción sin riesgo (navegar): se ejecuta de una.
              executeAgentAction(resp.execute);
              newMsg = {
                role: 'ai',
                content: resp.text,
                actions: resp.actions,
                chart: resp.chart,
                triviaOptions: resp.triviaOptions || null
              };
            }
          } else if (resp && typeof resp === 'object' && resp.action) {
            newMsg = {
              role: 'ai',
              content: resp.text,
              action: resp.action,
              chart: resp.chart,
              triviaOptions: resp.triviaOptions || null
            };
          } else if (resp && typeof resp === 'object' && resp.actions) {
            newMsg = {
              role: 'ai',
              content: resp.text,
              actions: resp.actions,
              chart: resp.chart,
              triviaOptions: resp.triviaOptions || null
            };
          } else if (resp && typeof resp === 'object') {
            newMsg = {
              role: 'ai',
              content: resp.text || String(resp),
              chart: resp.chart,
              triviaOptions: resp.triviaOptions || null
            };
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
      icono: '\ud83c�',
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
    var briefing = aiBriefing(
      props.calc
        ? Object.assign({}, props.calc, {
            ahora: new Date(),
            salario: props.salario,
            vh: props.vh,
            turnos: props.turnos
          })
        : null
    );
    if (briefing) {
      phrases = [briefing].concat(phrases);
    }
  }

  return h(
    'section',
    {
      className: 'asistente-wrap' + (tieneConversacion ? ' has-chat' : ''),
      'aria-label': 'Asistente AI'
    },

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
        {
          className: 'asistente-chip',
          onClick: function () {
            send('¿Cuánto gané ayer?');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '📅'),
        'Ayer'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('¿Cuánto gané este mes?');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '💰'),
        'Este mes'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('Proyección al cierre');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '🔮'),
        'Proyección'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('¿VS mes pasado?');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '⚖'),
        'VS mes pasado'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('¿Cuánto si trabajo 4h más?');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '🧮'),
        'Simular'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('/tendencia');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '📈'),
        'Tendencia'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('Dame el desglose de mis recargos de este mes');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '🔍'),
        'Desglose recargos'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('Hazme un informe de mis últimas 4 semanas');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '📋'),
        'Informe 4 semanas'
      ),
      h(
        'button',
        {
          className: 'asistente-chip',
          onClick: function () {
            send('¿Qué significa el recargo dominical y cuánto vale el mío?');
          }
        },
        h('span', { className: 'asistente-chip-ico' }, '📖'),
        'Recargo dominical'
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
                          className:
                            'asistente-speak-btn' +
                            (speakUI.idx === i && speakUI.status !== 'idle' ? ' speaking' : ''),
                          onClick: function () {
                            haptic();
                            var now = Date.now();
                            var st = speakRef.current;

                            // Double tap → reiniciar desde el principio
                            if (st.msgIdx === i && now - (st._lastTap || 0) < 500) {
                              speechSynthesis.cancel();
                              st.status = 'idle';
                              st.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                              startSpeak(i, m.content);
                              return;
                            }
                            st._lastTap = now;

                            // Si este mensaje está hablando → pausar/reanudar
                            if (st.msgIdx === i && st.status === 'speaking') {
                              speechSynthesis.pause();
                              st.status = 'paused';
                              st.pausedAt = now;
                              setSpeakUI({ idx: i, status: 'paused', progress: st.progress });
                              return;
                            }
                            if (st.msgIdx === i && st.status === 'paused') {
                              speechSynthesis.resume();
                              st.status = 'speaking';
                              st.startTime += now - st.pausedAt;
                              setSpeakUI({ idx: i, status: 'speaking', progress: st.progress });
                              return;
                            }

                            // Nuevo mensaje: cancelar anterior y empezar
                            speechSynthesis.cancel();
                            startSpeak(i, m.content);
                          },
                          // Long press → parar y resetear
                          onMouseDown: function () {
                            speakRef.current._pressStart = Date.now();
                          },
                          onMouseUp: function () {
                            var held = Date.now() - (speakRef.current._pressStart || 0);
                            if (held > 600 && speakRef.current.msgIdx === i) {
                              speechSynthesis.cancel();
                              speakRef.current.status = 'idle';
                              speakRef.current.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                            }
                          },
                          onTouchStart: function () {
                            speakRef.current._pressStart = Date.now();
                          },
                          onTouchEnd: function () {
                            var held = Date.now() - (speakRef.current._pressStart || 0);
                            if (held > 600 && speakRef.current.msgIdx === i) {
                              speechSynthesis.cancel();
                              speakRef.current.status = 'idle';
                              speakRef.current.progress = 0;
                              setSpeakUI({ idx: i, status: 'idle', progress: 0 });
                            }
                          },
                          'aria-label':
                            speakUI.idx === i && speakUI.status === 'speaking'
                              ? 'Pausar voz'
                              : speakUI.idx === i && speakUI.status === 'paused'
                                ? 'Reanudar voz'
                                : 'Escuchar',
                          title: 'Tocá: pausar · Doble toque: reiniciar · Sostené: parar'
                        },
                        h(
                          'svg',
                          {
                            viewBox: '0 0 36 36',
                            width: 28,
                            height: 28,
                            style: { transform: 'rotate(-90deg)' }
                          },
                          h('circle', {
                            cx: 18,
                            cy: 18,
                            r: 14,
                            fill: 'none',
                            stroke: 'var(--border)',
                            'stroke-width': 3
                          }),
                          h('circle', {
                            cx: 18,
                            cy: 18,
                            r: 14,
                            fill: 'none',
                            stroke: 'var(--accent)',
                            'stroke-width': 3,
                            strokeDasharray: 87.96,
                            strokeDashoffset:
                              87.96 - 87.96 * (speakUI.idx === i ? speakUI.progress : 0),
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
                              onClick: function () {
                                // a.intent === null → descarte (cierre suave).
                                // string → intent real. undefined → acción de ai.js.
                                send(a.query, a.intent);
                              }
                            },
                            a.label
                          );
                        })
                      )
                    : null,
                  // Widget de trivia interactiva (ai-engage.js)
                  m.triviaOptions
                    ? h(
                        'div',
                        { className: 'asistente-trivia' },
                        h('div', { className: 'asistente-trivia-header' }, '🎮 Trivia laboral'),
                        h('div', { className: 'asistente-trivia-q' }, m.triviaOptions.q),
                        h(
                          'div',
                          { className: 'asistente-trivia-opts' },
                          m.triviaOptions.opts.map(function (opt, oi) {
                            var res = m.triviaResult;
                            var answered = !!res;
                            var isCorrect = oi === m.triviaOptions.correcta;
                            var wasChosen = res && res.idx === oi;
                            var cls = 'asistente-trivia-opt';
                            if (answered) {
                              if (isCorrect) cls += ' correct';
                              else if (wasChosen) cls += ' wrong';
                              else cls += ' dimmed';
                            }
                            return h(
                              'button',
                              {
                                key: oi,
                                className: cls,
                                disabled: answered,
                                onClick: function () {
                                  var correct = oi === m.triviaOptions.correcta;
                                  setMsgs(function (prev) {
                                    return prev.map(function (msg, mi) {
                                      if (mi === i) {
                                        return Object.assign({}, msg, {
                                          triviaResult: {
                                            idx: oi,
                                            correct: correct,
                                            explicacion: m.triviaOptions.explicacion
                                          }
                                        });
                                      }
                                      return msg;
                                    });
                                  });
                                  haptic();
                                }
                              },
                              opt
                            );
                          })
                        ),
                        m.triviaResult
                          ? h(
                              'div',
                              {
                                className:
                                  'asistente-trivia-result ' +
                                  (m.triviaResult.correct ? 'correct' : 'wrong')
                              },
                              m.triviaResult.correct ? '✅ ¡Correcto! ' : '❌ Casi. ',
                              m.triviaResult.explicacion
                            )
                          : null
                      )
                    : null,
                  // Gráfico visual (Rich UI)
                  m.chart
                    ? h(
                        'div',
                        { className: 'asistente-chart-container' },
                        h('div', { className: 'asistente-chart-title' }, m.chart.title),
                        h(
                          'div',
                          { className: 'asistente-chart-bars' },
                          m.chart.data.map(function (d, j) {
                            return h(
                              'div',
                              { key: j, className: 'asistente-chart-bar-row' },
                              h('div', { className: 'asistente-chart-bar-label' }, d.label),
                              h(
                                'div',
                                { className: 'asistente-chart-bar-track' },
                                h('div', {
                                  className: 'asistente-chart-bar-fill',
                                  style: {
                                    width: d.pct + '%',
                                    backgroundColor: d.color || 'var(--accent)'
                                  }
                                })
                              ),
                              h('div', { className: 'asistente-chart-bar-val' }, d.val)
                            );
                          })
                        )
                      )
                    : null,
                  // Tarjeta de correo (si aplica)
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
                        { className: 'email-result-badge ' + (m.actionResult.ok ? 'ok' : 'bad') },
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

      // Wrapper relativo para poder posicionar el toggle dentro del input
      h(
        'div',
        { className: 'asistente-input-wrap' },
        h('textarea', {
          ref: inputRef,
          className: 'asistente-input' + (listening ? ' listening' : ''),
          'aria-label': 'Tu mensaje al asistente',
          placeholder: listening ? 'Escuchando…' : 'Escribe o mantén pulsado para hablar…',
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

        // Toggle Gemini: posicionado absolute dentro del textarea
        h(
          'button',
          {
            className: 'gem-toggle' + (geminiMode ? ' active' : ''),
            title: geminiMode ? 'Gemini' : 'IA local',
            'aria-label': geminiMode ? 'Modo Gemini activo' : 'Modo IA local activo',
            'aria-pressed': geminiMode,
            onClick: function () {
              haptic();
              var next = !geminiMode;
              setGeminiMode(next);
              window._geminiModeOn = next;
              try {
                localStorage.setItem('mt_gemini_mode', next ? '1' : '0');
              } catch (_) {}
            }
          },
          '✦'
        )
      ),

      // Botón inteligente: tap = enviar (si hay texto) / tap = alternar mic (sin texto)
      //                    mantener pulsado = grabar voz
      h(
        'button',
        {
          className:
            'asistente-smart-btn' +
            (listening ? ' recording' : '') +
            (busy ? ' sending' : '') +
            (input.trim() && !listening && !busy ? ' has-text' : ''),
          'aria-label': listening
            ? 'Grabando, suelta para detener'
            : input.trim()
              ? 'Enviar mensaje'
              : 'Mantené pulsado para hablar o escribí tu mensaje',
          // — Tap: enviar si hay texto, sino alternar mic
          onClick: function () {
            if (isLongPressRef.current) return; // el pointerUp ya actuó
            if (busy) return;
            haptic();
            if (input.trim()) {
              send();
            } else if (!listening) {
              startListening();
            } else {
              stopListening();
            }
          },
          // — Mantener: grabar por voz (hold to talk)
          onPointerDown: function () {
            isLongPressRef.current = false;
            pressTimerRef.current = setTimeout(function () {
              isLongPressRef.current = true;
              haptic();
              if (!listening) startListening();
            }, 350);
          },
          onPointerUp: function () {
            clearTimeout(pressTimerRef.current);
            if (isLongPressRef.current) {
              // Soltar tras hold: detener grabación
              if (listening) stopListening();
              isLongPressRef.current = false;
            }
          },
          onPointerCancel: function () {
            clearTimeout(pressTimerRef.current);
            if (isLongPressRef.current && listening) stopListening();
            isLongPressRef.current = false;
          }
        },
        // Anillo de nivel de audio mientras graba
        listening
          ? h('div', {
              className: 'asistente-mic-pulse',
              style: { transform: 'scale(' + (1 + audioLevel * 0.5) + ')' }
            })
          : null,
        // Icono dinámico
        busy ? h('span', { className: 'sp-in' }) : listening ? '■' : input.trim() ? '↑' : '🎤'
      )
    ),

    // ═══ PANEL DE CONTROLES DE VOZ (switches iOS 26) ═══
    typeof speechSynthesis !== 'undefined' ||
      typeof SpeechRecognition !== 'undefined' ||
      typeof webkitSpeechRecognition !== 'undefined'
      ? h(
          'div',
          { className: 'asistente-controls' },

          // Fila: Leer en voz alta
          typeof speechSynthesis !== 'undefined'
            ? h(
                'div',
                { className: 'asistente-ctrl-row' },
                h(
                  'div',
                  { className: 'asistente-ctrl-info' },
                  h('span', { className: 'asistente-ctrl-icon', 'aria-hidden': 'true' }, '🔊'),
                  h(
                    'div',
                    null,
                    h('div', { className: 'asistente-ctrl-label' }, 'Leer en voz alta'),
                    h(
                      'div',
                      { className: 'asistente-ctrl-sub' },
                      autoRead ? 'Respuestas habladas' : 'Respuestas en texto'
                    )
                  )
                ),
                h(
                  'label',
                  { className: 'ios-sw' },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': autoRead,
                    'aria-label':
                      'Leer respuestas en voz alta, ' + (autoRead ? 'activado' : 'desactivado'),
                    checked: autoRead,
                    onChange: function () {
                      haptic();
                      var next = !autoRead;
                      setAutoRead(next);
                      if (!next && handsFree) setHandsFree(false);
                    }
                  }),
                  h('span', { className: 'sw-track' })
                )
              )
            : null,

          // Divisor entre filas
          typeof speechSynthesis !== 'undefined' &&
            (typeof SpeechRecognition !== 'undefined' ||
              typeof webkitSpeechRecognition !== 'undefined')
            ? h('div', { className: 'asistente-ctrl-divider', 'aria-hidden': 'true' })
            : null,

          // Fila: Modo manos libres
          typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined'
            ? h(
                'div',
                { className: 'asistente-ctrl-row' },
                h(
                  'div',
                  { className: 'asistente-ctrl-info' },
                  h('span', { className: 'asistente-ctrl-icon', 'aria-hidden': 'true' }, '🎙'),
                  h(
                    'div',
                    null,
                    h('div', { className: 'asistente-ctrl-label' }, 'Modo manos libres'),
                    h(
                      'div',
                      { className: 'asistente-ctrl-sub' + (handsFree ? ' on' : '') },
                      handsFree ? (listening ? 'Escuchando…' : 'En pausa') : 'Conversación continua'
                    )
                  )
                ),
                h(
                  'label',
                  { className: 'ios-sw asistente-hf-sw' },
                  h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    'aria-checked': handsFree,
                    'aria-label': 'Modo manos libres, ' + (handsFree ? 'activado' : 'desactivado'),
                    checked: handsFree,
                    onChange: function () {
                      haptic();
                      if (!handsFree) {
                        setAutoRead(true);
                        setHandsFree(true);
                        // Briefing hablado de bienvenida; al terminar de
                        // leerlo, el loop arranca a escuchar solo.
                        setTimeout(function () {
                          speakBriefing();
                        }, 350);
                      } else {
                        setHandsFree(false);
                        stopListening();
                      }
                    }
                  }),
                  h('span', { className: 'sw-track' })
                )
              )
            : null
        )
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
