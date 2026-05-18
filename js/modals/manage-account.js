// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/manage-account.js
//  Modal gestionar cuenta
// ════════════════════════════════════════════════════════════════
function ManageAccountModal(props){
  var session=props.session;
  var isPinOnly=session.pinOnly===true;
  var uid=session.uid;

  var ts=useState(0);        var tab=ts[0], setTab=ts[1];
  var pinS=useState('');     var pinVal=pinS[0], setPinVal=pinS[1];
  var emS=useState(session.email||''); var emailVal=emS[0], setEmailVal=emS[1];
  var pwS=useState('');      var passVal=pwS[0], setPassVal=pwS[1];
  var bS=useState(false);    var busy=bS[0], setBusy=bS[1];
  var fbS=useState(null);    var feedback=fbS[0], setFeedback=fbS[1];

  // Estado del flujo de verificación: null | 'confirm' | 'wait' | 'verify'
  var vfS=useState(null);    var vfStep=vfS[0], setVfStep=vfS[1];
  var pendingFnRef=useRef(null);
  var confirmPinS=useState('');  var confirmPin=confirmPinS[0], setConfirmPin=confirmPinS[1];
  var confirmPassS=useState(''); var confirmPass=confirmPassS[0], setConfirmPass=confirmPassS[1];
  var confirmMailS=useState(''); var confirmMail=confirmMailS[0], setConfirmMail=confirmMailS[1];
  var codeInputS=useState('');var codeInput=codeInputS[0], setCodeInput=codeInputS[1];
  var nowS=useState(Date.now()); var nowMs=nowS[0], setNowMs=nowS[1];

  var codeRef=useRef('');
  var startTsRef=useRef(0);
  var tickRef=useRef(null);

  var storedPin = session.pin || leer('mt_pin_'+uid, null) || leer('mt_pin_app_'+uid, null);
  var hasPassword = !isPinOnly && CLOUD_MODE && SUPA && !!session.email;

  // Cleanup
  useEffect(function(){ return function(){
    if(tickRef.current) clearInterval(tickRef.current);
  }; }, []);

  function pinCloudErr(err){
    if(!err) return 'No se pudo guardar el PIN en la nube.';
    var c=String(err.code||'');
    var m=String(err.message||'').toLowerCase();
    if(c==='23505'||m.indexOf('duplicate')>=0||m.indexOf('unique')>=0)
      return 'Ese PIN ya está en uso en otra cuenta. Elige otro código.';
    return traducirError(err)||err.message||'Error al guardar el PIN.';
  }

  function resetVf(){
    if(tickRef.current){ clearInterval(tickRef.current); tickRef.current=null; }
    setVfStep(null); setConfirmPin(''); setConfirmPass(''); setConfirmMail('');
    setCodeInput(''); codeRef.current=''; startTsRef.current=0;
    setFeedback(null); setBusy(false);
    pendingFnRef.current=null;
  }

  function elapsedSec(){
    if(!startTsRef.current) return 0;
    return Math.floor((nowMs - startTsRef.current)/1000);
  }

  function startWait(){
    startTsRef.current=Date.now();
    setNowMs(Date.now());
    if(tickRef.current) clearInterval(tickRef.current);
    tickRef.current=setInterval(function(){ setNowMs(Date.now()); }, 500);
  }

  function genCode(){ return String(Math.floor(100000+Math.random()*900000)); }

  // Auto-trigger: a los 15s genera código y pasa a verify
  useEffect(function(){
    if(vfStep==='wait' && elapsedSec()>=15 && !codeRef.current){
      codeRef.current = genCode();
      setVfStep('verify');
    }
    if(vfStep==='verify' && elapsedSec()>=300){
      codeRef.current='';
      if(tickRef.current){ clearInterval(tickRef.current); tickRef.current=null; }
    }
  },[nowMs, vfStep]);

  function initiateVerification(executeFn){
    haptic();
    pendingFnRef.current=executeFn;
    setConfirmPin(''); setConfirmPass(''); setConfirmMail('');
    setFeedback(null); setCodeInput(''); codeRef.current='';
    setVfStep('confirm');
  }

  function doConfirm(){
    if(busy) return;
    haptic();
    setBusy(true); setFeedback(null);

    // PIN: solo se valida si el usuario lo escribió Y tiene uno guardado
    if(storedPin && confirmPin && confirmPin!==storedPin){
      setFeedback('PIN incorrecto. Si no lo recuerdas, déjalo vacío.');
      setBusy(false); return;
    }

    if(hasPassword){
      var accEm=(session.email||'').trim().toLowerCase();
      var typed=(confirmMail||'').trim().toLowerCase();
      if(!confirmMail||confirmMail.indexOf('@')<0){
        setFeedback('Escribe tu correo completo para confirmar identidad.');
        setBusy(false); return;
      }
      if(typed!==accEm){
        setFeedback('El correo no coincide con el de esta sesión.');
        setBusy(false); return;
      }
      if(!confirmPass){
        setFeedback('Ingresa tu contraseña actual.');
        setBusy(false); return;
      }
      SUPA.auth.signInWithPassword({email:session.email, password:confirmPass})
        .then(function(res){
          if(res && res.error){
            setFeedback('Contraseña incorrecta.');
            setBusy(false); return;
          }
          setBusy(false); setVfStep('wait'); startWait();
        }).catch(function(e){
          setFeedback(traducirError(e));
          setBusy(false);
        });
    } else {
      // Modo local: solo PIN
      if(!storedPin){
        setFeedback('No hay credenciales para confirmar. Reinicia la sesión.');
        setBusy(false); return;
      }
      if(!confirmPin || confirmPin!==storedPin){
        setFeedback('PIN incorrecto.');
        setBusy(false); return;
      }
      setBusy(false); setVfStep('wait'); startWait();
    }
  }

  function doVerify(){
    if(busy) return;
    haptic();
    if(codeInput.length!==6){ setFeedback('Ingresa los 6 dígitos del código.'); return; }
    if(elapsedSec()>=300){ setFeedback('Código expirado. Solicita uno nuevo.'); return; }
    if(codeInput !== codeRef.current){
      setFeedback('Código incorrecto. Revisa los dígitos.');
      return;
    }

    var fn = pendingFnRef.current;

    function finishOk(){
      if(tickRef.current){ clearInterval(tickRef.current); tickRef.current=null; }
      codeRef.current=''; setCodeInput(''); startTsRef.current=0;
      pendingFnRef.current=null;
      setFeedback('✓ Cambio aplicado correctamente');
      setVfStep(null); setBusy(false);
      setTimeout(function(){ setFeedback(null); }, 3500);
    }

    function finishErr(msg){
      if(tickRef.current){ clearInterval(tickRef.current); tickRef.current=null; }
      codeRef.current=''; setCodeInput(''); startTsRef.current=0;
      pendingFnRef.current=null;
      setFeedback(msg);
      setVfStep(null); setBusy(false);
      setTimeout(function(){ setFeedback(null); }, 5200);
    }

    setBusy(true);
    if(!fn){ finishOk(); return; }
    try{
      var out=fn();
      if(out && typeof out.then==='function'){
        out.then(function(){ finishOk(); }).catch(function(e){
          finishErr('Error: '+(e&&e.message?e.message:'inténtalo de nuevo'));
        });
        return;
      }
      finishOk();
    }catch(e){
      finishErr('Error: '+(e&&e.message?e.message:'inténtalo de nuevo'));
    }
  }

  function regenerarCode(){
    haptic();
    codeRef.current=''; setCodeInput(''); setFeedback(null);
    startTsRef.current=Date.now();
    setVfStep('wait');
    startWait();
  }

  // ── Indicador de progreso ──
  function StepBar(props2){
    var steps = hasPassword || storedPin ? ['confirm','wait','verify'] : ['wait','verify'];
    var labels = hasPassword || storedPin ? ['Identidad','Validando','Código'] : ['Validando','Código'];
    var cur = steps.indexOf(props2.current);
    if(cur<0) cur=0;
    return h('div',{className:'vf-progress-wrap'},
      h('div',{className:'vf-progress'},
        steps.map(function(s,i){
          var cls = i<cur?'done':(i===cur?'active':'');
          return h('div',{key:s, style:{display:'contents'}},
            i>0?h('div',{className:'vf-line'+(i<=cur?' done':'')}):null,
            h('div',{className:'vf-pip '+cls}, i<cur?'✓':String(i+1)));
        })),
      h('div',{className:'vf-progress-lbls'},
        labels.map(function(lb,i){
          var on = i===cur?' on':(i<cur?' done':'');
          return h('span',{key:steps[i], className:'vf-progress-lbl'+on}, lb);
        })));
  }

  // ── Acciones reales (tras verificación) ──
  function savePIN(){
    if(!pinVal||pinVal.length!==4){ setFeedback('PIN debe ser 4 dígitos'); return; }
    if(!/^\d+$/.test(pinVal)){ setFeedback('Solo dígitos'); return; }
    var val=pinVal;
    initiateVerification(function(){
      function applyLocal(){
        grabar('mt_pin_'+uid, val);
        var cur=leer(SKEY,{}); if(cur){ cur.pin=val; grabar(SKEY,cur); }
        setPinVal('');
      }
      if(!isPinOnly && CLOUD_MODE && SUPA && session.email){
        return SUPA.from('pin_lookup').upsert({
          pin:val, user_email:session.email, user_id:uid,
          updated_at:new Date().toISOString()
        }).then(function(res){
          if(res && res.error){
            var c=String(res.error.code||'');
            if(c==='23505') throw new Error('Ese PIN ya está en uso.');
            throw new Error(pinCloudErr(res.error));
          }
          applyLocal();
        });
      }
      applyLocal();
      return Promise.resolve();
    });
  }

  function saveEmail(){
    if(!emailVal||!emailVal.includes('@')){ setFeedback('Email inválido'); return; }
    if(!CLOUD_MODE||!SUPA){ setFeedback('Requiere conexión a nube'); return; }
    var val=emailVal;
    initiateVerification(function(){
      return SUPA.auth.updateUser({email:val}).then(function(res){
        if(res && res.error) throw new Error(traducirError(res.error)||'No se pudo actualizar.');
        setEmailVal('');
      });
    });
  }

  function savePassword(){
    if(!passVal||passVal.length<6){ setFeedback('Mínimo 6 caracteres'); return; }
    if(!CLOUD_MODE||!SUPA){ setFeedback('Requiere conexión a nube'); return; }
    var val=passVal;
    initiateVerification(function(){
      return SUPA.auth.updateUser({password:val}).then(function(res){
        if(res && res.error) throw new Error(traducirError(res.error)||'No se pudo actualizar.');
        setPassVal('');
      });
    });
  }

  // ═══ RENDER: PANTALLA "CONFIRMAR IDENTIDAD" ═══
  if(vfStep==='confirm'){
    return h('div',{className:'modal-card'},
      h(StepBar,{current:'confirm'}),
      h('div',{className:'vf-step'},
        h('span',{className:'vf-icon'},'🔐'),
        h('div',{className:'vf-title'},'Confirmar identidad'),
        h('div',{className:'vf-desc'},
          hasPassword
            ? 'Reescribe tu correo y contraseña actuales. '+(storedPin?'El PIN es opcional si no lo recuerdas.':'')+' Después aparecerá un código automático en pantalla.'
            : 'Ingresa tu PIN actual para continuar. Después aparecerá un código automático en pantalla.')),

      // Campo PIN (solo si hay uno guardado)
      storedPin?h('div',{style:{marginBottom:10}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:5,letterSpacing:'0.1em',textTransform:'uppercase'}},
          'PIN actual'+(hasPassword?' (opcional si no lo recuerdas)':'')),
        h('input',{type:'tel',inputMode:'numeric',maxLength:'4',className:'inp',
          placeholder:'••••', value:confirmPin,
          onChange:function(e){setConfirmPin(e.target.value.replace(/\D/g,''));},
          style:{textAlign:'center',fontSize:22,letterSpacing:'8px'}})):null,

      // Correo (solo cuenta con contraseña)
      hasPassword?h('div',{style:{marginBottom:10,marginTop:storedPin?10:0}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:5,letterSpacing:'0.1em',textTransform:'uppercase'}},'Correo de la cuenta'),
        h('input',{type:'email',inputMode:'email',className:'inp',placeholder:session.email||'correo@ejemplo.com',
          value:confirmMail, onChange:function(e){setConfirmMail(e.target.value);},
          autoComplete:'off', spellCheck:false, style:{marginBottom:6}}),
        h('div',{style:{fontSize:10.5,color:'var(--muted)',lineHeight:1.45}},
          'Debe coincidir letra por letra con ',h('strong',null,session.email||'tu correo'))):null,

      // Contraseña (solo cuenta con contraseña)
      hasPassword?h('div',{style:{marginBottom:10}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:5,letterSpacing:'0.1em',textTransform:'uppercase'}},'Contraseña actual'),
        h('input',{type:'password',className:'inp',placeholder:'••••••',
          value:confirmPass, onChange:function(e){setConfirmPass(e.target.value);},
          onKeyDown:function(e){if(e.key==='Enter')doConfirm();}})):null,

      feedback?h('div',{style:{fontSize:11.5,color:'var(--danger)',background:'var(--danger-dim)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:8,marginTop:4}},feedback):null,

      h('button',{className:'btn btn-accent btn-block',onClick:doConfirm,disabled:busy,style:{marginBottom:8,marginTop:4}},
        busy?h('span',{className:'sp-in'}):'Continuar →'),
      h('button',{className:'btn btn-ghost btn-block',onClick:resetVf},'Cancelar'));
  }

  // ═══ RENDER: PANTALLA "ESPERANDO 15s" ═══
  if(vfStep==='wait'){
    var elapsed = elapsedSec();
    var segParaCodigo = Math.max(0, 15 - elapsed);
    return h('div',{className:'modal-card'},
      h(StepBar,{current:'wait'}),
      h('div',{className:'vf-step'},
        h('span',{className:'vf-icon'},'⏳'),
        h('div',{className:'vf-title'},'Validando'),
        h('div',{className:'vf-desc'},'Tu código aparecerá en unos segundos')),
      h('div',{style:{textAlign:'center',padding:'30px 0 20px'}},
        h('div',{style:{
          fontSize:74,fontWeight:900,
          color:'var(--accent)',
          fontVariantNumeric:'tabular-nums',
          lineHeight:1,
          marginBottom:8,
          fontFamily:'ui-monospace,monospace'
        }},String(segParaCodigo)),
        h('div',{style:{fontSize:12,color:'var(--muted)',fontWeight:600}},
          segParaCodigo>0?'segundos':'¡listo!')),
      h('div',{style:{background:'var(--accent-dim)',padding:'12px 14px',borderRadius:'var(--radius-sm)',fontSize:11.5,color:'var(--accent)',lineHeight:1.55,marginTop:8,textAlign:'center',border:'1px solid color-mix(in srgb, var(--accent) 22%, transparent)'}},
        '🤖 Confirmando que eres un humano…'),
      h('button',{className:'btn btn-ghost btn-block',onClick:resetVf,style:{marginTop:14}},'Cancelar'));
  }

  // ═══ RENDER: PANTALLA "VERIFICAR CÓDIGO" ═══
  if(vfStep==='verify'){
    var segRest = Math.max(0, 300 - elapsedSec());
    var minStr = String(Math.floor(segRest/60)).padStart(2,'0');
    var secStr = String(segRest%60).padStart(2,'0');
    var expirado = segRest<=0;

    return h('div',{className:'modal-card'},
      h(StepBar,{current:'verify'}),
      h('div',{className:'vf-step'},
        h('span',{className:'vf-icon'},expirado?'⌛':'🔐'),
        h('div',{className:'vf-title'},expirado?'Código expirado':'Tu código'),
        h('div',{className:'vf-desc'},
          expirado?'El código expiró. Genera uno nuevo.':'Ingresa el código que aparece abajo')),

      expirado?null:h('div',{style:{textAlign:'center',padding:'12px 0 20px'}},
        h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}},
          'Código (válido '+minStr+':'+secStr+')'),
        h('div',{style:{
          fontSize:44,fontWeight:900,
          color:'var(--text)',
          fontVariantNumeric:'tabular-nums',
          letterSpacing:'8px',
          padding:'14px 20px',
          background:'var(--surface2)',
          borderRadius:'var(--radius)',
          border:'2px solid var(--accent)',
          fontFamily:'ui-monospace,monospace',
          marginBottom:6,
          display:'inline-block'
        }}, codeRef.current)),

      expirado?null:h('div',{className:'code-grid'},
        Array.from({length:6}).map(function(_,i){
          return h('input',{
            key:i, type:'tel', inputMode:'numeric', maxLength:'1',
            className:'code-cell', value:codeInput[i]||'',
            autoFocus:i===0,
            onChange:function(e){
              var v=e.target.value.replace(/\D/g,''); if(v.length>1) v=v.slice(-1);
              var arr=codeInput.split(''); arr[i]=v;
              var combined=arr.join('').slice(0,6);
              setCodeInput(combined);
              if(v && i<5){ var sib=e.target.parentElement.children[i+1]; if(sib)sib.focus(); }
            },
            onKeyDown:function(e){
              if(e.key==='Backspace' && !codeInput[i] && i>0){
                var sib=e.target.parentElement.children[i-1]; if(sib)sib.focus();
              }
              if(e.key==='Enter') doVerify();
            }
          });
        })),

      feedback?h('div',{style:{fontSize:11.5,color:feedback[0]==='✓'?'var(--success)':'var(--danger)',background:feedback[0]==='✓'?'var(--success-dim)':'var(--danger-dim)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:8,marginTop:8}},feedback):null,

      expirado
        ? h('button',{className:'btn btn-accent btn-block',onClick:regenerarCode,style:{marginBottom:8,marginTop:8}},'🔄 Generar nuevo código')
        : h('button',{className:'btn btn-accent btn-block',onClick:doVerify,disabled:busy,style:{marginBottom:8,marginTop:8}},
            busy?h('span',{className:'sp-in'}):'Verificar código'),

      h('button',{className:'btn btn-ghost btn-block',onClick:resetVf},'Cancelar'));
  }

  // ═══ RENDER: PANTALLA PRINCIPAL DE GESTIÓN ═══
  return h('div',{className:'modal-card'},
    h('div',{style:{fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:14}},'Gestionar cuenta'),
    isPinOnly?h('div',{style:{background:'var(--accent-dim)',color:'var(--accent)',padding:'10px 12px',borderRadius:'var(--radius-sm)',fontSize:11.5,marginBottom:12,lineHeight:1.55,border:'1px solid color-mix(in srgb, var(--accent) 22%, transparent)'}},
      '📌 Modo local. Añade email y contraseña para sincronizar en nube.'):null,

    h('div',{style:{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:8}},
      h('button',{className:'btn',onClick:function(){setTab(0);setFeedback(null);},
        style:{flex:1,padding:'8px 10px',fontSize:11.5,borderRadius:'var(--radius-sm)',
          background:tab===0?'var(--text)':'transparent',color:tab===0?'var(--surface)':'var(--muted)',
          border:tab===0?'none':'1px solid var(--border)'}},'🔐 PIN'),
      h('button',{className:'btn',onClick:function(){setTab(1);setFeedback(null);},disabled:isPinOnly,
        style:{flex:1,padding:'8px 10px',fontSize:11.5,borderRadius:'var(--radius-sm)',
          background:tab===1?'var(--text)':'transparent',color:tab===1?'var(--surface)':'var(--muted)',
          border:tab===1?'none':'1px solid var(--border)',opacity:isPinOnly?0.4:1}},'✉ Email'),
      h('button',{className:'btn',onClick:function(){setTab(2);setFeedback(null);},disabled:isPinOnly,
        style:{flex:1,padding:'8px 10px',fontSize:11.5,borderRadius:'var(--radius-sm)',
          background:tab===2?'var(--text)':'transparent',color:tab===2?'var(--surface)':'var(--muted)',
          border:tab===2?'none':'1px solid var(--border)',opacity:isPinOnly?0.4:1}},'🔑 Contraseña')),

    tab===0?h('div',null,
      h('div',{style:{fontSize:12,color:'var(--muted)',marginBottom:12,lineHeight:1.5,background:'var(--surface2)',padding:'10px 12px',borderRadius:'var(--radius-sm)'}},
        '🔒 Confirma identidad; luego un código automático en pantalla valida que eres humano.'),
      h('input',{type:'tel',inputMode:'numeric',maxLength:'4',placeholder:'Nuevo PIN ',
        className:'inp',value:pinVal,onChange:function(e){setPinVal(e.target.value.replace(/\D/g,''));},
        style:{marginBottom:feedback?8:12,textAlign:'center',fontSize:20,letterSpacing:'8px'}}),
      feedback?h('div',{style:{fontSize:11.5,color:feedback[0]==='✓'?'var(--success)':'var(--danger)',background:feedback[0]==='✓'?'var(--success-dim)':'var(--danger-dim)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:12}},feedback):null,
      h('button',{className:'btn btn-accent btn-block',onClick:savePIN,disabled:busy},'Cambiar PIN')):

    tab===1?h('div',null,
      h('div',{style:{fontSize:12,color:'var(--muted)',marginBottom:12,lineHeight:1.5,background:'var(--surface2)',padding:'10px 12px',borderRadius:'var(--radius-sm)'}},
        '🔒 Confirma identidad y el código automático; luego se actualiza el correo.'),
      h('input',{type:'email',placeholder:'Nuevo correo electrónico',inputMode:'email',
        className:'inp',value:emailVal,onChange:function(e){setEmailVal(e.target.value);},
        style:{marginBottom:feedback?8:12}}),
      feedback?h('div',{style:{fontSize:11.5,color:feedback[0]==='✓'?'var(--success)':'var(--danger)',background:feedback[0]==='✓'?'var(--success-dim)':'var(--danger-dim)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:12}},feedback):null,
      h('button',{className:'btn btn-accent btn-block',onClick:saveEmail,disabled:busy||!CLOUD_MODE||isPinOnly},'Cambiar Email')):

    tab===2?h('div',null,
      h('div',{style:{fontSize:12,color:'var(--muted)',marginBottom:12,lineHeight:1.5,background:'var(--surface2)',padding:'10px 12px',borderRadius:'var(--radius-sm)'}},
        '🔒 Confirma identidad y el código automático; luego se actualiza la contraseña.'),
      h('input',{type:'password',placeholder:'Nueva contraseña (mín. 6 caracteres)',autoComplete:'new-password',
        className:'inp',value:passVal,onChange:function(e){setPassVal(e.target.value);},
        style:{marginBottom:feedback?8:12}}),
      feedback?h('div',{style:{fontSize:11.5,color:feedback[0]==='✓'?'var(--success)':'var(--danger)',background:feedback[0]==='✓'?'var(--success-dim)':'var(--danger-dim)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:12}},feedback):null,
      h('button',{className:'btn btn-accent btn-block',onClick:savePassword,disabled:busy||!CLOUD_MODE||isPinOnly},'Cambiar Contraseña')):
    null,

    h('button',{className:'btn btn-ghost btn-block',onClick:function(){haptic();resetVf();props.onClose();},style:{marginTop:12}},'Cerrar'));
}
