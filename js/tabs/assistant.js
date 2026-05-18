// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Tab Asistente IA · 50+ capacidades · memoria · pills dinámicas
// ════════════════════════════════════════════════════════════════

var _AI_HISTORY_KEY='mt_ai_history';

function _aiLoadHistory(){
  try{var s=localStorage.getItem(_AI_HISTORY_KEY);return s?JSON.parse(s):[];}catch(_){return [];}
}
function _aiSaveHistory(msgs){
  try{
    // Solo guardamos las últimas 30 entradas
    var trim=msgs.slice(-30);
    localStorage.setItem(_AI_HISTORY_KEY, JSON.stringify(trim));
  }catch(_){/* quota */}
}

// Quick pills DINÁMICAS según el estado del usuario
function _aiBuildPills(props){
  var pills=[];
  var hasShifts=(props.calc.totalMins||0)>0;
  var ahora=new Date();
  var diaActual=ahora.getDate();
  var diasMes=new Date(ahora.getFullYear(),ahora.getMonth()+1,0).getDate();
  var diasRestantes=diasMes-diaActual;
  var pctSalario=props.salario>0?((props.calc.totalCOP||0)/props.salario)*100:0;
  var extraMins=(props.calc.bd?.extraDiurna?.mins||0)+(props.calc.bd?.extraNoct?.mins||0)+(props.calc.bd?.extraFestDiur?.mins||0)+(props.calc.bd?.extraFestNoct?.mins||0);
  var festMins=(props.calc.bd?.diurnaFest?.mins||0)+(props.calc.bd?.noctFest?.mins||0)+(props.calc.bd?.extraFestDiur?.mins||0)+(props.calc.bd?.extraFestNoct?.mins||0);
  var noctMins=(props.calc.bd?.noctOrd?.mins||0)+(props.calc.bd?.extraNoct?.mins||0)+(props.calc.bd?.noctFest?.mins||0)+(props.calc.bd?.extraFestNoct?.mins||0);

  // Sin turnos → onboarding
  if(!hasShifts){
    return [
      '¿Cómo funciona la app?',
      'Próximos festivos',
      '¿Qué es jornada nocturna?',
      '¿Cómo se calculan los recargos?',
      '/capacidades'
    ];
  }

  // Siempre relevantes
  pills.push('Resumen del mes');

  // Pills contextuales según estado
  if(diaActual>=25 || diasRestantes<=5){
    pills.push('Proyección al cierre');
  }
  if(pctSalario<100 && pctSalario>30){
    pills.push('¿Cuándo llego a la meta?');
  }
  if(pctSalario>=100){
    pills.push('¿Cuánto extra llevo sobre la meta?');
  }
  if(extraMins>0){
    pills.push('Mis horas extras');
  }
  if(festMins>0){
    pills.push('Festivos trabajados');
  }
  if(noctMins>0){
    pills.push('Horas nocturnas');
  }
  pills.push('Mi mejor día');
  pills.push('Compara con mes pasado');
  pills.push('Día de la semana más rentable');
  pills.push('¿Cuánto si trabajo 4h más?');
  pills.push('Próximos festivos');
  pills.push('Mi racha actual');

  // Limitar a 9 para que no se vea sobrecargado
  return pills.slice(0,9);
}

function AsistenteTab(props){
  var ms=useState(_aiLoadHistory);var msgs=ms[0], setMsgs=ms[1];
  var is=useState(''); var input=is[0], setInput=is[1];
  var bs=useState(false); var busy=bs[0], setBusy=bs[1];
  var winRef=useRef(null);

  useEffect(function(){
    if(winRef.current){
      requestAnimationFrame(function(){
        if(winRef.current) winRef.current.scrollTop=winRef.current.scrollHeight;
      });
    }
    _aiSaveHistory(msgs);
  },[msgs, busy]);

  var clearChat=useCallback(function(){
    haptic();
    setMsgs([]);
    try{localStorage.removeItem(_AI_HISTORY_KEY);}catch(_){/* ignore */}
  },[]);

  var send=useCallback(function(text){
    var q=(text||input).trim();
    if(!q||busy) return;
    haptic();
    setInput('');

    // Slash command: /limpiar — ejecuta directamente sin ir al motor
    if(q==='/limpiar'||q==='/clear'||q==='/reset'){
      clearChat();
      return;
    }

    setMsgs(function(p){return p.concat([{role:'user',content:q,ts:Date.now()}]);});
    setBusy(true);
    setTimeout(function(){
      var resp=aiAnswer(q, {
        turnos:props.turnos,
        turnosAll:props.turnosAll||props.turnos,
        calc:props.calc,
        salario:props.salario,
        vh:props.vh
      });
      setMsgs(function(p){return p.concat([{role:'ai',content:resp,ts:Date.now()}]);});
      setBusy(false);
    }, 280+Math.random()*220);
  },[input, busy, props.turnos, props.turnosAll, props.calc, props.salario, props.vh, clearChat]);

  // Pills dinámicas memoizadas
  var pills=React.useMemo(function(){return _aiBuildPills(props);},[props.calc, props.salario]);

  return h('div',{className:'fadeUp'},
    h('div',{className:'card'},
      h('div',{className:'ai-header'},
        h('div',{className:'ai-avatar'},'✦'),
        h('div',{style:{flex:1,minWidth:0}},
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--text)',letterSpacing:'-0.3px'}},'Asistente de Turno'),
          h('div',{style:{fontSize:11.5,color:'var(--muted)',marginTop:2}},'Análisis local · 50+ funciones · sin internet')),
        msgs.length>0?h('button',{
          className:'ai-clear-btn',
          onClick:clearChat,
          title:'Limpiar conversación',
          style:{
            width:30,height:30,borderRadius:'50%',
            background:'var(--glass-mid)',
            border:'1px solid var(--glass-border-sm)',
            color:'var(--muted)',fontSize:13,
            display:'flex',alignItems:'center',justifyContent:'center',
            flexShrink:0,backdropFilter:'var(--blur-sm)',
            WebkitBackdropFilter:'var(--blur-sm)'
          }
        },'⟲'):null),
      h('div',{style:{fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}},'Sugerencias inteligentes'),
      h('div',{className:'quick-pills'},
        pills.map(function(p,i){
          return h('button',{key:i, className:'quick-pill', onClick:function(){send(p);}}, p);
        })),
      h('div',{ref:winRef, className:'chat-window'},
        msgs.length===0
          ?h('div',{className:'ai-empty'},
              h('div',{className:'ai-empty-icon'},'✦'),
              h('div',null,'Pregúntame lo que quieras sobre tu mes.',h('br'),
                h('span',{style:{fontSize:11.5,opacity:0.7}},'Sé responder más de 50 cosas distintas.'),h('br'),
                h('span',{style:{fontSize:11,opacity:0.55,marginTop:6,display:'inline-block'}},'Escribe ',h('code',{style:{padding:'1px 5px',borderRadius:6,background:'var(--accent-dim)',color:'var(--accent)',fontSize:10.5}},'/capacidades'),' para ver todo.')))
          :msgs.map(function(m,i){
              return h('div',{key:i, className:'chat-msg '+m.role},
                h('div',{className:'chat-icon'}, m.role==='ai'?'✦':'·'),
                h('div',{className:'chat-bubble', dangerouslySetInnerHTML:{__html:m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code style="padding:1px 6px;border-radius:6px;background:var(--accent-dim);color:var(--accent);font-size:0.92em">$1</code>')}}));
            }).concat(busy?[h('div',{key:'thk',className:'chat-msg ai'},
              h('div',{className:'chat-icon'},'✦'),
              h('div',{className:'chat-bubble chat-thinking', style:{color:'var(--muted)'}},
                h('span',{className:'thk-dot'},'·'),
                h('span',{className:'thk-dot'},'·'),
                h('span',{className:'thk-dot'},'·')))]:[])),
      h('div',{className:'chat-input-row'},
        h('textarea',{
          className:'chat-input',
          placeholder:'Pregunta algo o escribe /ayuda...',
          value:input,
          onChange:function(e){setInput(e.target.value);},
          onKeyDown:function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}},
          rows:1
        }),
        h('button',{className:'chat-send-btn', onClick:function(){send();}, disabled:busy||!input.trim()}, '→'))));
}
