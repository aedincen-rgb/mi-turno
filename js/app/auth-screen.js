/* ════════════════════════════════════════════════════════════════
   MI TURNO · app/auth-screen.js
   Pantalla login/registro con WaveDots
   ════════════════════════════════════════════════════════════════ */

function AnimatedWaveDots(props) {
  var tk = useState(0); var tick = tk[0], setTick = tk[1];
  useEffect(function() {
    var raf; var t0 = Date.now();
    function loop() { setTick(((Date.now() - t0) / 1000) % 1000); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);
    return function() { cancelAnimationFrame(raf); };
  }, []);

  var arr = []; var n = props.n || 4; var amp = 4; var speed = 2.4; var phase = 0.55;
  for (var i = 0; i < n; i++) {
    var t = tick;
    var y = Math.sin((t * speed) - (i * phase)) * amp;
    var glow = (Math.sin((t * speed) - (i * phase)) + 1) / 2;
    var r = Math.round(125 - (glow * 34));
    var g = Math.round(168 - (glow * 34));
    var b = Math.round(255 - (glow * 26));
    var size = 8 + (glow * 2);
    var opacity = 0.45 + (glow * 0.55);
    arr.push(h('span', { key: i, style: {
      display: 'inline-block', width: size + 'px', height: size + 'px', borderRadius: '50%',
      background: 'rgb(' + r + ',' + g + ',' + b + ')', margin: '0 4px', transform: 'translateY(' + y + 'px)',
      opacity: opacity, transition: 'background 0.1s linear',
      boxShadow: glow > 0.7 ? '0 0 8px rgba(91,134,229,0.55)' : 'none'
    } }));
  }
  return h('div', { 'aria-hidden': 'true', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 } }, arr);
}

function AuthScreen(props){
  var md=useState('login'); var modo=md[0], setModo=md[1];
  var em=useState(''); var email=em[0], setEmail=em[1];
  var pw=useState(''); var pass=pw[0], setPass=pw[1];
  var ld=useState(false); var load=ld[0], setLoad=ld[1];
  var er=useState(null); var err=er[0], setErr=er[1];
  var cm=useState(CLOUD_MODE); var cloudOk=cm[0], setCloudOk=cm[1];
  var ce=useState(CLOUD_ERROR); var cloudErr=ce[0], setCloudErr=ce[1];
  var pa=useState(''); var pinAsignado=pa[0], setPinAsignado=pa[1];
  var st=useState(''); var statusMsg=st[0], setStatusMsg=st[1];

  useEffect(function(){
    var alive=true;
    var delay = IS_IOS_SAFARI ? 2000 : 0;
    setTimeout(function(){
      if(!alive) return;
      if(window.__cloudReady){
        window.__cloudReady.then(function(ok){
          if(!alive) return;
          setCloudOk(!!ok); setCloudErr(CLOUD_ERROR);
        });
      }
    }, delay);
    return function(){alive=false;};
  },[]);

  function submit(){
    if(load) return;
    var rawIn=email.trim();
    if(!rawIn||!pass){setErr('Completa todos los campos.');return;}
    if(pass.length<6){setErr('La contraseña necesita al menos 6 caracteres.');return;}

    if(modo==='register'){
      var eReg=rawIn.toLowerCase();
      if(!eReg.includes('@')){setErr('Ingresa un correo válido.');return;}
      setLoad(true);setErr(null);setStatusMsg('');

      function intentarLocalReg(){
        try{
          var u=localReg(eReg,pass);
          var ses={uid:u.id,email:eReg,guest:false,cloud:false};
          grabar(SKEY,ses); props.onAuth(ses);
          return true;
        }catch(le){ setErr(le.message||'No se pudo registrar sin conexión.'); setLoad(false); return false; }
      }

      if(CLOUD_MODE && SUPA){
        setStatusMsg('☁ Creando tu cuenta...');
        var opReg=SUPA.auth.signUp({email:eReg, password:pass});
        withTimeout(opReg, (IS_IOS_SAFARI?15000:8000), 'Auth').then(function(res){
          if(res&&res.error) throw res.error;

          function asignarPINConFeedback(uid, email, callback){
            setStatusMsg('🔐 Asignando tu PIN único...');
            var resuelto=false;
            var maxWait=setTimeout(function(){
              if(resuelto) return;
              resuelto=true;
              console.warn('[MT] Timeout asignando PIN, continuando...');
              setStatusMsg('');
              callback(null);
            }, 12000);

            generarPINUnico(uid).then(function(pin){
              if(resuelto) return;
              setStatusMsg('☁ Guardando en la nube...');
              return guardarPINEnNube(uid,email,pin).then(function(){
                if(resuelto) return;
                resuelto=true; clearTimeout(maxWait);
                grabar('mt_pin_'+uid, pin);
                setStatusMsg('✓ ¡Listo!');
                setTimeout(function(){ callback(pin); }, 350);
              });
            }).catch(function(e){
              if(resuelto) return;
              resuelto=true; clearTimeout(maxWait);
              console.warn('[MT] PIN auto falló:',e);
              setStatusMsg('');
              callback(null);
            });
          }

          if(res&&res.data&&res.data.user && !res.data.session){
            var newUid=res.data.user.id;
            asignarPINConFeedback(newUid, eReg, function(pin){
              if(pin) setPinAsignado(pin);
              setLoad(false); setErr(null); setStatusMsg('');
              setModo('confirm_email');
            });
            return;
          }
          if(res&&res.data&&res.data.user&&res.data.session){
            var newUid2=res.data.user.id;
            asignarPINConFeedback(newUid2, eReg, function(pin){
              if(pin){
                setPinAsignado(pin);
                setLoad(false); setStatusMsg('');
                setModo('pin_asignado');
              } else {
                setLoad(false); setErr(null); setStatusMsg('');
                setModo('login');
              }
            });
            return;
          }
          setLoad(false); setStatusMsg('');
        }).catch(function(e){
          var msg=traducirError(e);
          var sinRed = /No se pudo conectar|tiempo de espera|Failed to fetch|NetworkError/i.test(msg)
                       || (typeof navigator!=='undefined' && navigator.onLine===false);
          if(sinRed){ setStatusMsg(''); if(intentarLocalReg()) return; return; }
          setErr(msg); setLoad(false); setStatusMsg('');
        });
        return;
      }
      intentarLocalReg();
      return;
    }

    // ── LOGIN ──
    setLoad(true);setErr(null);setStatusMsg('');
    var e2=rawIn.toLowerCase();

    function intentarLocalLogin(){
      try{
        if(!rawIn.includes('@')){
          setErr('Sin conexión: usa tu correo completo.');
          setLoad(false);
          return false;
        }
        var em=rawIn.toLowerCase().trim();
        var u=localLogin(em,pass);
        var isAdm=(em==='admin@miturno.com');
        var ses={uid:u.id,email:em,guest:false,cloud:false,isAdmin:isAdm};
        setLoad(false);
        grabar(SKEY,ses); props.onAuth(ses);
        return true;
      }catch(le){ setErr(le.message||'No se pudo acceder sin conexión.'); setLoad(false); return false; }
    }

    if(CLOUD_MODE && SUPA){
      if(/^\d{4}$/.test(rawIn)){
        withTimeout(
          SUPA.from('pin_lookup').select('user_email,user_id').eq('pin',rawIn).maybeSingle(),
          (IS_IOS_SAFARI?15000:8000),'PIN lookup'
        ).then(function(res){
          if(res&&res.error) throw res.error;
          if(!res.data||!res.data.user_email){
            throw new Error('PIN no registrado. Entra con correo+contraseña primero.');
          }
          return withTimeout(
            SUPA.auth.signInWithPassword({email:res.data.user_email, password:pass}),
            (IS_IOS_SAFARI?15000:8000),'Inicio de sesión'
          );
        }).then(function(res){
          if(res&&res.error) throw res.error;
          if(rawIn==='9999'){
            var adminSes=leer(SKEY,{});
            adminSes.isAdmin=true;
            grabar(SKEY,adminSes);
          }
          if(props.onAuth) props.onAuth({uid:res.data.user.id, email:res.data.user.email, cloud:true, isAdmin: (rawIn === '9999')});
          setLoad(false);
        }).catch(function(e){
          var msg=traducirError(e);
          var sinRed = /No se pudo conectar|tiempo de espera|Failed to fetch|NetworkError/i.test(msg)
                       || (typeof navigator!=='undefined' && navigator.onLine===false);
          if(sinRed){ if(intentarLocalLogin()) return; return; }
          setErr(msg||'PIN o contraseña incorrectos.'); setLoad(false);
        });
        return;
      }
      if(rawIn.includes('@')){
        withTimeout(SUPA.auth.signInWithPassword({email:e2, password:pass}), (IS_IOS_SAFARI?15000:8000), 'Auth').then(function(res){
          if(res&&res.error) throw res.error;
          if(e2==='admin@miturno.com'){
            var adminSes=leer(SKEY,{});
            adminSes.isAdmin=true;
            grabar(SKEY,adminSes);
          }
          if(props.onAuth) props.onAuth({uid:res.data.user.id, email:e2, cloud:true});
          setLoad(false);
        }).catch(function(e){
          var msg=traducirError(e);
          var sinRed = /No se pudo conectar|tiempo de espera|Failed to fetch|NetworkError/i.test(msg)
                       || (typeof navigator!=='undefined' && navigator.onLine===false);
          if(sinRed){ if(intentarLocalLogin()) return; return; }
          setErr(msg); setLoad(false);
        });
        return;
      }
      setErr('Ingresa tu correo completo o PIN de 4 dígitos.');
      setLoad(false);
      return;
    }

    intentarLocalLogin();
  }

  // ── Pantalla: PIN asignado automáticamente ──
  if(modo==='pin_asignado'){
    return h('div',{className:'auth-wrap'},
      h('div',{className:'auth-hero'},
        h('div',{className:'auth-logo-box'},'🎉'),
        h('div',{className:'auth-app-name'},'¡Cuenta creada!'),
        h('div',{className:'auth-tagline'},'Tu acceso rápido ha sido asignado')),
      h('div',{className:'auth-card'},
        h('div',{style:{textAlign:'center',padding:'8px 0 20px'}},
          h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}},'Tu PIN empresarial es'),
          h('div',{style:{fontSize:58,fontWeight:900,color:'var(--accent)',fontVariantNumeric:'tabular-nums',letterSpacing:'10px',lineHeight:1,marginBottom:18,fontFamily:'ui-monospace,monospace'}},pinAsignado),
          h('div',{style:{fontSize:13,color:'var(--muted)',lineHeight:1.65,marginBottom:8}},
            'Con este PIN + tu contraseña puedes entrar rápidamente. Guárdalo o cámbialo en ',h('strong',null,'Ajustes → Gestionar cuenta'),'.')),
        h('button',{className:'auth-btn',onClick:function(){haptic();setModo('login');setPinAsignado('');}},
          '✓ Entendido, continuar')));
  }

  // ── Pantalla de confirmación de email ──
  if(modo==='confirm_email'){
    return h('div',{className:'auth-wrap'},
      h('div',{className:'auth-hero'},
        h('div',{className:'auth-logo-box'},'✉'),
        h('div',{className:'auth-app-name'},'Revisa tu correo'),
        h('div',{className:'auth-tagline'},pinAsignado?'Tu PIN: '+pinAsignado+' (úsalo tras confirmar)':'Te enviamos un enlace')),
      h('div',{className:'auth-card'},
        pinAsignado?h('div',{style:{textAlign:'center',marginBottom:18}},
          h('div',{style:{fontSize:11,fontWeight:700,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}},'Tu PIN asignado'),
          h('div',{style:{fontSize:46,fontWeight:900,color:'var(--accent)',fontVariantNumeric:'tabular-nums',letterSpacing:'8px',fontFamily:'ui-monospace,monospace',marginBottom:8}},pinAsignado),
          h('div',{style:{fontSize:12,color:'var(--muted)',lineHeight:1.5}},'Guárdalo. Podrás usarlo tras confirmar tu correo.')):null,
        h('div',{style:{fontSize:13.5,color:'var(--text)',lineHeight:1.65,marginBottom:18}},
          'Confirma tu cuenta en la bandeja de ',h('strong',null,email),'. Haz clic en el enlace y luego vuelve a iniciar sesión.'),
        h('button',{className:'auth-btn',onClick:function(){setModo('login');setEmail('');setPass('');setErr(null);}},
          'Ya confirmé → Iniciar sesión'),
        h('button',{className:'auth-link',onClick:function(){setModo('login');}},
          '← Volver')));
  }

  // ════════════════════════════════════════════════════════════════
  //  PANTALLA PRINCIPAL DE LOGIN / REGISTRO (con icono personalizado)
  // ════════════════════════════════════════════════════════════════
  return h('div', { className: 'auth-wrap' },
    h('div', { className: 'auth-hero' },
      // Icono personalizado (reemplaza el reloj azul por la imagen PNG)
      h('img', {
        src: 'icon-192.png',
        alt: 'Mi Turno',
        style: {
          width: '70px',
          height: '70px',
          objectFit: 'cover',
          borderRadius: '20px',
          marginBottom: '16px',
          backgroundColor: '#0f172a',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
        }
      }),
      h('div', { className: 'auth-app-name' }, 'Mi Turno'),
      h('div', { className: 'auth-tagline' },
        modo === 'login'
          ? 'Colombia · Entra con correo o PIN + contraseña'
          : 'Colombia · Nómina inteligente'
      )
    ),
    h('div', { className: 'auth-card' },
      h('div', { className: 'auth-ttl' }, modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'),

      (!cloudOk && cloudErr) ? h('div', {
        style: {
          background: 'var(--danger-dim)', color: 'var(--danger)', padding: '10px 12px',
          borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 12, lineHeight: 1.45,
          border: '1px solid color-mix(in srgb, var(--danger) 22%, transparent)'
        }
      },
        h('div', { style: { fontWeight: 700, marginBottom: 2 } }, '⚠ Nube no disponible'),
        h('div', { style: { opacity: 0.9, fontSize: 11.5 } }, 'Puedes usar modo local.')
      ) : null,

      // Campo email / PIN
      (!email && modo === 'login') ? h('div', { style: { display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--accent)', marginBottom: 6, textAlign: 'center' } }, 'Ingresa correo • PIN') : null,
      h('div', { style: { position: 'relative', marginBottom: 10 } },
        h('input', {
          type: modo === 'login' ? 'text' : 'email',
          inputMode: modo === 'login' ? 'text' : 'email',
          autoComplete: modo === 'login' ? 'username' : 'email',
          className: 'inp',
          placeholder: (!email && modo === 'login') ? '' : (modo === 'login' ? 'Correo o PIN' : 'Correo electrónico'),
          value: email,
          onChange: function (e) { setEmail(e.target.value); },
          disabled: load,
          style: { width: '100%' }
        }),
        (!email && modo === 'login') ? h(AnimatedWaveDots, { n: 4 }) : null
      ),

      // Campo contraseña
      !pass ? h('div', { style: { display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--accent)', marginBottom: 6, textAlign: 'center' } }, 'Contraseña') : null,
      h('div', { style: { position: 'relative', marginBottom: err ? 12 : 14 } },
        h('input', {
          type: 'password',
          autoComplete: modo === 'login' ? 'current-password' : 'new-password',
          className: 'inp',
          placeholder: !pass ? '' : 'Contraseña',
          value: pass,
          onChange: function (e) { setPass(e.target.value); },
          disabled: load,
          onKeyDown: function (e) { if (e.key === 'Enter') submit(); },
          style: { width: '100%' }
        }),
        !pass ? h(AnimatedWaveDots, { n: 6 }) : null
      ),

      err ? h('div', { className: 'auth-err' }, err) : null,

      (load && statusMsg) ? h('div', {
        style: {
          padding: '14px 16px',
          marginBottom: 12,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-dim)',
          border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
          color: 'var(--accent)',
          fontSize: 13.5,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '-0.1px',
          lineHeight: 1.5
        }
      }, statusMsg) : null,

      h('button', { className: 'auth-btn', onClick: submit, disabled: load },
        load
          ? (modo === 'register' && statusMsg
              ? 'Procesando…'
              : h('span', { className: 'sp-in' }))
          : (modo === 'login' ? 'Entrar' : 'Registrarse')
      ),

      h('button', {
        className: 'auth-link',
        onClick: function () { setModo(function (m) { return m === 'login' ? 'register' : 'login'; }); setErr(null); setStatusMsg(''); },
        disabled: load
      },
        modo === 'login' ? '¿Sin cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'
      ),

      modo === 'login' ? h('button', {
        className: 'auth-guest',
        style: { width: '100%', marginTop: 14 },
        onClick: function () {
          haptic();
          var gid = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
          props.onAuth({ uid: gid, email: 'invitado@local', guest: true, cloud: false, pinOnly: false });
        },
        disabled: load
      }, '👤 Continuar como invitado (sin cuenta)') : null
    ),
    h('div', { className: 'auth-foot' },
      cloudOk ? '☁ Datos sincronizados en la nube' : '🔒 Datos en este dispositivo'
    )
  );
}
