// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/assistant.js
//  Tab Asistente IA
// ════════════════════════════════════════════════════════════════
function AsistenteTab(props){
  var ms=useState([]);var msgs=ms[0], setMsgs=ms[1];
  var is=useState(''); var input=is[0], setInput=is[1];
  var bs=useState(false); var busy=bs[0], setBusy=bs[1];
  var winRef=useRef(null);

  useEffect(function(){
    if(winRef.current){
      requestAnimationFrame(function(){
        if(winRef.current) winRef.current.scrollTop=winRef.current.scrollHeight;
      });
    }
  },[msgs, busy]);

  var send=useCallback(function(text){
    var q=(text||input).trim();
    if(!q||busy) return;
    haptic();
    setInput('');
    setMsgs(function(p){return p.concat([{role:'user',content:q}]);});
    setBusy(true);
    setTimeout(function(){
      var resp=aiAnswer(q, {turnos:props.turnos, calc:props.calc, salario:props.salario, vh:props.vh});
      setMsgs(function(p){return p.concat([{role:'ai',content:resp}]);});
      setBusy(false);
    }, 350+Math.random()*250);
  },[input, busy, props.turnos, props.calc, props.salario, props.vh]);

  var pills=[
    '¿Cuánto gané este mes?',
    'Mi mejor día',
    '¿Cuántas horas llevo?',
    'Resumen general',
    '¿Cómo voy de ritmo?',
    'Festivos trabajados',
    'Horas extras',
    '¿Cómo se calculan los recargos?'
  ];

  return h('div',{className:'fadeUp'},
    h('div',{className:'card'},
      h('div',{className:'ai-header'},
        h('div',{className:'ai-avatar'},'✦'),
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--text)',letterSpacing:'-0.3px'}},'Asistente de Turno'),
          h('div',{style:{fontSize:11.5,color:'var(--muted)',marginTop:2}},'Análisis local · sin internet'))),
      h('div',{style:{fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}},'Preguntas frecuentes'),
      h('div',{className:'quick-pills'},
        pills.map(function(p,i){
          return h('button',{key:i, className:'quick-pill', onClick:function(){send(p);}}, p);
        })),
      h('div',{ref:winRef, className:'chat-window'},
        msgs.length===0
          ?h('div',{className:'ai-empty'},
              h('div',{className:'ai-empty-icon'},'✦'),
              h('div',null,'Pregúntame lo que quieras sobre tu mes.',h('br'),
                h('span',{style:{fontSize:11.5,opacity:0.65}},'Conozco todos tus turnos y recargos.')))
          :msgs.map(function(m,i){
              return h('div',{key:i, className:'chat-msg '+m.role},
                h('div',{className:'chat-icon'}, m.role==='ai'?'✦':'·'),
                h('div',{className:'chat-bubble', dangerouslySetInnerHTML:{__html:m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}));
            }).concat(busy?[h('div',{key:'thk',className:'chat-msg ai'},
              h('div',{className:'chat-icon'},'✦'),
              h('div',{className:'chat-bubble', style:{color:'var(--muted)'}},'Pensando...'))]:[])),
      h('div',{className:'chat-input-row'},
        h('textarea',{
          className:'chat-input',
          placeholder:'Pregunta algo sobre tu mes...',
          value:input,
          onChange:function(e){setInput(e.target.value);},
          onKeyDown:function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}},
          rows:1
        }),
        h('button',{className:'chat-send-btn', onClick:function(){send();}, disabled:busy||!input.trim()}, '→'))));
}
