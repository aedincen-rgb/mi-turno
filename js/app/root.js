// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/root.js
//  Componente raíz y manejo de sesión
// ════════════════════════════════════════════════════════════════
function Root() {
  var ss=useState(function(){var raw=leer(SKEY, null);return validarSesion(raw);});
  var session=ss[0], setSession=ss[1];
  function patchSession(p){
    setSession(function(s){ return s?Object.assign({},s,p):s; });
  }

  useEffect(function(){
    var t=setTimeout(function(){
      var s=document.getElementById('initSplash');
      if(s){
        s.classList.add('fadeout');
        setTimeout(function(){if(s.parentNode) s.parentNode.removeChild(s);}, 600);
      }
    }, 700);
    return function(){clearTimeout(t);};
  },[]);

  useEffect(function(){
    if(!CLOUD_MODE||!SUPA) return;

    var applying = false;
    function aplicar(supaSession){
      if(!supaSession||!supaSession.user) return;
      if(applying) return;
      applying = true;
      
      var u=supaSession.user;
      var esAdminAuto = u.email==='admin@miturno.com';
      var ses=validarSesion({
        uid:u.id,
        email:u.email||'usuario@cloud',
        guest:false,
        cloud:true,
        isAdmin:esAdminAuto
      });

      grabar(SKEY, ses);
      setSession(ses);

      if(u.email){
        withTimeout(
          SUPA.from('pin_lookup').select('pin').eq('user_email',u.email).maybeSingle(),
          6000, 'PIN lookup en aplicar'
        ).then(function(res){
          if(res.data&&res.data.pin){
            var updated=Object.assign({}, ses);
            updated.pin=res.data.pin;
            if(res.data.pin==='9999') updated.isAdmin=true;
            grabar('mt_pin_'+u.id, res.data.pin);
            grabar(SKEY, updated);
            setSession(updated);
          }
          applying=false;
        }).catch(function(e){
          console.warn('[MT] PIN lookup falló (no crítico):', e.message||e);
          applying=false;
        });
      } else {
        applying=false;
      }
    }

    SUPA.auth.getSession().then(function(res){
      if(res.data && res.data.session){
        aplicar(res.data.session);
      }
    });

    var sub=SUPA.auth.onAuthStateChange(function(event, supaSession){
      if(event==='SIGNED_IN' || event==='TOKEN_REFRESHED' || event==='USER_UPDATED'){
        if(supaSession) aplicar(supaSession);
      } else if(event==='SIGNED_OUT'){
        grabar(SKEY, null);
        setSession(null);
        applying=false;
      }
    });

    return function(){
      try{if(sub&&sub.data&&sub.data.subscription) sub.data.subscription.unsubscribe();}catch(e){}
    };
  },[]);

  function signOut(){
    haptic();
    try{
      var wasCloud=session&&session.cloud&&!session.pinOnly&&!session.guest;
      grabar(SKEY, null);
      setSession(null);
      if(wasCloud&&CLOUD_MODE&&SUPA&&SUPA.auth){
        SUPA.auth.signOut().catch(function(){});
      }
    }catch(e){
      try{ grabar(SKEY, null); }catch(e2){}
      setSession(null);
    }
  }

  function handleAuth(s){
    var validated=validarSesion(s);
    grabar(SKEY, validated);
    setSession(validated);
  }

  if(!session){
    return h(AuthScreen, { onAuth:handleAuth });
  }
  return h(App, {key:session.uid, session:session, onSignOut:signOut, onSessionPatch:patchSession});
}
