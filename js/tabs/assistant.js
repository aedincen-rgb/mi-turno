// ═══════════════════════════════════════════════════════════════
// tabs/assistant.js · Asistente IA (rediseño)
// ───────────────────────────────────────────────────────────────
// Sustituye la versión anterior. Mantiene la firma (recibe
// turnos, calc, salario, vh) y usa las mismas funciones globales:
// useState, useEffect, useCallback, useRef, h, haptic, aiAnswer.
// ═══════════════════════════════════════════════════════════════

function AsistenteTab(props){
  var ms = useState([]);    var msgs = ms[0], setMsgs = ms[1];
  var is = useState('');    var input = is[0], setInput = is[1];
  var bs = useState(false); var busy = bs[0], setBusy = bs[1];
  var cs = useState(null);  var openCat = cs[0], setOpenCat = cs[1];
  var winRef = useRef(null);
  var inputRef = useRef(null);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(function(){
    if(winRef.current){
      requestAnimationFrame(function(){
        if(winRef.current) winRef.current.scrollTop = winRef.current.scrollHeight;
      });
    }
  }, [msgs, busy]);

  // Auto-grow del textarea
  useEffect(function(){
    if(inputRef.current){
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  var send = useCallback(function(text){
    var q = (text || input).trim();
    if(!q || busy) return;
    haptic();
    setInput('');
    setOpenCat(null);
    setMsgs(function(p){ return p.concat([{role:'user', content:q}]); });
    setBusy(true);
    setTimeout(function(){
      var resp = aiAnswer(q, {
        turnos: props.turnos,
        calc: props.calc,
        salario: props.salario,
        vh: props.vh
      });
      setMsgs(function(p){ return p.concat([{role:'ai', content:resp}]); });
      setBusy(false);
    }, 350 + Math.random()*250);
  }, [input, busy, props.turnos, props.calc, props.salario, props.vh]);

  // Saludo según hora del día
  var hora = new Date().getHours();
  var saludo = hora < 12 ? 'Buenos días'
             : hora < 19 ? 'Buenas tardes'
             : 'Buenas noches';

  // 4 categorías expandibles (en lugar de 8 pills planas)
  var categorias = [
    {
      id:'ingresos',
      icono:'$',
      titulo:'Ingresos',
      desc:'Cuánto llevas, tu mejor día y proyecciones',
      preguntas:[
        '¿Cuánto gané este mes?',
        'Mi mejor día',
        '¿Cuál es mi promedio diario?',
        'Proyección de fin de mes'
      ]
    },
    {
      id:'tiempo',
      icono:'◷',
      titulo:'Tiempo',
      desc:'Horas trabajadas, ritmo y descansos',
      preguntas:[
        '¿Cuántas horas llevo?',
        '¿Cómo voy de ritmo?',
        'Días trabajados este mes',
        '¿Cuánto descanso he tenido?'
      ]
    },
    {
      id:'analisis',
      icono:'✦',
      titulo:'Análisis',
      desc:'Festivos, horas extras y recargos',
      preguntas:[
        'Festivos trabajados',
        'Horas extras',
        'Resumen general',
        'Distribución por recargo'
      ]
    },
    {
      id:'ayuda',
      icono:'?',
      titulo:'Cómo funciona',
      desc:'Entiende cómo calculo todo',
      preguntas:[
        '¿Cómo se calculan los recargos?',
        '¿Qué es el recargo nocturno?',
        '¿Cómo cuentan los festivos?',
        '¿Qué incluye el sueldo base?'
      ]
    }
  ];

  var tieneConversacion = msgs.length > 0;

  return h('div', {className:'fadeUp asistente-wrap'},

    // ═══ HERO: saludo cálido (solo si no hay conversación) ═══
    !tieneConversacion && h('div', {className:'asistente-hero'},
      h('div', {className:'asistente-orb'},
        h('div', {className:'asistente-orb-glow'}),
        h('div', {className:'asistente-orb-symbol'}, '✦')
      ),
      h('h1', {className:'asistente-greeting'}, saludo + '.'),
      h('p',  {className:'asistente-intro'},
        'Soy tu asistente. Conozco tus turnos, recargos y movimientos del mes.',
        h('br'),
        h('span', {className:'asistente-intro-soft'},
          'Pregúntame en tus palabras, o explora las categorías.')
      )
    ),

    // ═══ CATEGORÍAS EXPANDIBLES (en lugar de pills) ═══
    !tieneConversacion && h('div', {className:'asistente-cats'},
      categorias.map(function(cat){
        var abierta = openCat === cat.id;
        return h('div', {
          key: cat.id,
          className: 'asistente-cat' + (abierta ? ' open' : '')
        },
          h('button', {
            className:'asistente-cat-head',
            onClick: function(){ haptic(); setOpenCat(abierta ? null : cat.id); }
          },
            h('div', {className:'asistente-cat-ico'}, cat.icono),
            h('div', {className:'asistente-cat-txt'},
              h('div', {className:'asistente-cat-ttl'}, cat.titulo),
              h('div', {className:'asistente-cat-dsc'}, cat.desc)
            ),
            h('div', {className:'asistente-cat-chev'}, abierta ? '−' : '+')
          ),
          abierta && h('div', {className:'asistente-cat-body'},
            cat.preguntas.map(function(q, i){
              return h('button', {
                key: i,
                className:'asistente-cat-q',
                onClick: function(){ send(q); }
              },
                h('span', {className:'asistente-cat-q-txt'}, q),
                h('span', {className:'asistente-cat-q-arr'}, '→')
              );
            })
          )
        );
      })
    ),

    // ═══ CONVERSACIÓN (cuando ya hay mensajes) ═══
    tieneConversacion && h('div', {ref:winRef, className:'asistente-chat'},
      msgs.map(function(m, i){
        if(m.role === 'ai'){
          return h('div', {key:i, className:'asistente-msg ai'},
            h('div', {className:'asistente-msg-orb'}, '✦'),
            h('div', {
              className:'asistente-bubble ai',
              dangerouslySetInnerHTML: {__html: m.content}
            })
          );
        }
        return h('div', {key:i, className:'asistente-msg user'},
          h('div', {className:'asistente-bubble user'}, m.content)
        );
      }),
      busy && h('div', {className:'asistente-msg ai'},
        h('div', {className:'asistente-msg-orb'}, '✦'),
        h('div', {className:'asistente-bubble ai typing'},
          h('span', {className:'asistente-dot'}),
          h('span', {className:'asistente-dot'}),
          h('span', {className:'asistente-dot'})
        )
      )
    ),

    // ═══ COMPOSER (Claude desktop style) ═══
    h('div', {className:'asistente-composer'},
      h('textarea', {
        ref: inputRef,
        className:'asistente-input',
        placeholder: tieneConversacion ? 'Sigue preguntando…' : 'O escríbeme directamente…',
        value: input,
        onChange: function(e){ setInput(e.target.value); },
        onKeyDown: function(e){
          if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            send();
          }
        },
        rows: 1
      }),
      h('button', {
        className: 'asistente-send' + (input.trim() && !busy ? ' active' : ''),
        onClick: function(){ send(); },
        disabled: !input.trim() || busy,
        'aria-label':'Enviar'
      }, '↑')
    ),

    // ═══ Reset suave (link, no botón gritón) ═══
    tieneConversacion && h('button', {
      className:'asistente-reset',
      onClick: function(){ haptic(); setMsgs([]); setOpenCat(null); }
    }, 'Nueva conversación')

  );
}
