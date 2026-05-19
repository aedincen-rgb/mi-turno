// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/root.js
//  Componente raíz y manejo de sesión
// ════════════════════════════════════════════════════════════════
function Root() {
  var ss = useState(function () {
    var raw = leer(SKEY, null);
    return validarSesion(raw);
  });
  var session = ss[0],
    setSession = ss[1];
  function patchSession(p) {
    setSession(function (s) {
      return s ? Object.assign({}, s, p) : s;
    });
  }

  // ── Intro animation ──────────────────────────────────────────
  // Persiste en localStorage: solo se muestra la primera vez ever.
  // iOS evicta la página del fondo → al volver NO repetimos el intro.
  var alreadyPlayed = leer('mt_intro_played', false);
  var si = useState(!alreadyPlayed);
  var showIntro = si[0],
    setShowIntro = si[1];
  var se = useState(false);
  var introExit = se[0],
    setIntroExit = se[1];

  useEffect(function () {
    if (!showIntro) return; // ya fue reproducido antes
    var alive = true;
    var t1 = setTimeout(function () {
      if (!alive) return;
      setIntroExit(true);
      setTimeout(function () {
        if (!alive) return;
        setShowIntro(false);
        grabar('mt_intro_played', true); // persiste para no volver a mostrar
      }, 340);
    }, 1400);
    return function () {
      alive = false;
      clearTimeout(t1);
    };
  }, []);

  useEffect(function () {
    var t = setTimeout(function () {
      var s = document.getElementById('initSplash');
      if (s) {
        s.classList.add('fadeout');
        setTimeout(function () {
          if (s.parentNode) s.parentNode.removeChild(s);
        }, 600);
      }
    }, 700);
    return function () {
      clearTimeout(t);
    };
  }, []);

  useEffect(function () {
    if (!CLOUD_MODE || !SUPA) return;

    var applying = false;
    function aplicar(supaSession) {
      if (!supaSession || !supaSession.user) return;
      if (applying) return;
      applying = true;

      var u = supaSession.user;
      var esAdminAuto = u.email === 'admin@miturno.com';
      var ses = validarSesion({
        uid: u.id,
        email: u.email || 'usuario@cloud',
        guest: false,
        cloud: true,
        isAdmin: esAdminAuto
      });

      grabar(SKEY, ses);
      setSession(ses);

      if (u.email) {
        withTimeout(
          SUPA.from('pin_lookup').select('pin').eq('user_email', u.email).maybeSingle(),
          6000,
          'PIN lookup en aplicar'
        )
          .then(function (res) {
            if (res.data && res.data.pin) {
              var updated = Object.assign({}, ses);
              updated.pin = res.data.pin;
              if (res.data.pin === '9999') updated.isAdmin = true;
              grabar('mt_pin_' + u.id, res.data.pin);
              grabar(SKEY, updated);
              setSession(updated);
            }
            applying = false;
          })
          .catch(function (e) {
            console.warn('[MT] PIN lookup falló (no crítico):', e.message || e);
            applying = false;
          });
      } else {
        applying = false;
      }
    }

    SUPA.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        aplicar(res.data.session);
      }
    });

    var sub = SUPA.auth.onAuthStateChange(function (event, supaSession) {
      if (event === 'SIGNED_IN') {
        // Solo al iniciar sesión por primera vez
        if (supaSession) aplicar(supaSession);
      } else if (event === 'SIGNED_OUT') {
        grabar(SKEY, null);
        setSession(null);
        applying = false;
      }
      // TOKEN_REFRESHED / USER_UPDATED: el SDK actualiza el token internamente.
      // No llamamos setSession para evitar re-renders + re-mount del App.
    });

    return function () {
      try {
        if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
      } catch (e) {}
    };
  }, []);

  function signOut() {
    haptic();
    try {
      var wasCloud = session && session.cloud && !session.pinOnly && !session.guest;
      grabar(SKEY, null);
      setSession(null);
      if (wasCloud && CLOUD_MODE && SUPA && SUPA.auth) {
        SUPA.auth.signOut().catch(function () {});
      }
    } catch (e) {
      try {
        grabar(SKEY, null);
      } catch (e2) {}
      setSession(null);
    }
  }

  function handleAuth(s) {
    var validated = validarSesion(s);
    grabar(SKEY, validated);
    setSession(validated);
  }

  if (showIntro) return h(SplashScreen, { exit: introExit });

  if (!session) {
    return h(AuthScreen, { onAuth: handleAuth });
  }
  return h(App, {
    key: session.uid,
    session: session,
    onSignOut: signOut,
    onSessionPatch: patchSession,
    introPlayed: alreadyPlayed || !showIntro
  });
}
