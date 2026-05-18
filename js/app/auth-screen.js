// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/auth-screen.js
//  Pantalla login/registro con WaveDots
// ════════════════════════════════════════════════════════════════

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

          // ═══ Helper: asignar PIN con feedback visible y timeout 12s ═══
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
          // AVANCE INMEDIATO: Notificamos al Root
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
          // AVANCE INMEDIATO: Notificamos al Root
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
      h('img', {
        src: 'icon-192.png',
        alt: 'Mi Turno',
        className: 'auth-logo-img',
        style: {
          width: '72px',
          height: '72px',
          objectFit: 'cover',
          borderRadius: '24px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          backgroundColor: '#0f172a'
        }
      }),
      h('div',{className:'auth-app-name'},'Mi Turno'),
      h('div',{className:'auth-tagline'},
        modo==='login'
          ?'Colombia · Entra con correo o PIN + contraseña'
          :'Colombia · Nómina inteligente')),
    // ... el resto del código sigue igual (auth-card, etc.)
