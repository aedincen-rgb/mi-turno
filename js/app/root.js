// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/root.js
//  Componente raíz · manejo de sesión y sincronización entre dispositivos
// ════════════════════════════════════════════════════════════════
function Root() {
  var ss = useState(function () {
    var raw = leer(SKEY, null);
    return validarSesion(raw);
  });
  var session = ss[0],
    setSession = ss[1];

  // Ref siempre actualizada: evita closures obsoletos en los listeners
  // de Supabase y de la vigilancia de sesión.
  var sessionRef = useRef(session);
  sessionRef.current = session;

  // Marca un cierre de sesión iniciado por el propio usuario en este
  // dispositivo, para no confundirlo con un cierre remoto (otro equipo).
  var cierreManualRef = useRef(false);

  function patchSession(p) {
    setSession(function (s) {
      return s ? Object.assign({}, s, p) : s;
    });
  }

  // Limpia los datos locales asociados a una sesión (cola de sync, IA,
  // y la sesión guardada). No borra credenciales offline: el usuario
  // debe poder volver a entrar con su correo/PIN aunque esté sin red.
  function limpiarSesionLocal(s) {
    try {
      if (s && typeof clearSyncQueue === 'function') clearSyncQueue(s.uid);
      if (s && typeof _aiClearHistory === 'function') _aiClearHistory(s.uid);
    } catch (e) {}
    grabar(SKEY, null);
  }

  // Cierre forzado al detectar que la sesión se cerró en otro dispositivo.
  // La sesión ya está revocada en el servidor: aquí solo limpiamos local.
  function forzarCierreRemoto() {
    var actual = sessionRef.current;
    if (!actual) return;
    cierreManualRef.current = false;
    limpiarSesionLocal(actual);
    grabar('mt_aviso', { tipo: 'remote_signout', ts: Date.now() });
    setSession(null);
    if (CLOUD_MODE && SUPA && SUPA.auth) {
      SUPA.auth.signOut({ scope: 'local' }).catch(function () {});
    }
  }

  // Cierre de sesión iniciado por el usuario desde este dispositivo.
  function signOut() {
    haptic();
    var actual = sessionRef.current;
    var wasCloud = actual && actual.cloud && !actual.pinOnly && !actual.guest;
    cierreManualRef.current = true;
    try {
      limpiarSesionLocal(actual);
      setSession(null);
      // scope 'global': revoca la sesión en TODOS los dispositivos.
      if (wasCloud && CLOUD_MODE && SUPA && SUPA.auth) {
        SUPA.auth.signOut({ scope: 'global' }).catch(function () {});
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
    cierreManualRef.current = false;
    grabar(SKEY, validated);
    setSession(validated);
  }

  // ── Intro animation (se muestra para TODOS los usuarios) ──────
  var si = useState(true);
  var showIntro = si[0],
    setShowIntro = si[1];
  var se = useState(false);
  var introExit = se[0],
    setIntroExit = se[1];
  var ip = useState(false);
  var introPlayed = ip[0],
    setIntroPlayed = ip[1];

  useEffect(function () {
    var alive = true;
    var t1 = setTimeout(function () {
      if (!alive) return;
      setIntroExit(true);
      setTimeout(function () {
        if (!alive) return;
        setShowIntro(false);
        setIntroPlayed(true);
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

  // ── Sesión en la nube: aplicar y escuchar cambios de Supabase ──
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
              applying = false;
            } else {
              // Primer login: el PIN no se pudo guardar durante el registro
              // (sin sesión activa). Ahora que hay sesión, se genera y guarda.
              generarPINUnico(u.id)
                .then(function (pin) {
                  return guardarPINEnNube(u.id, u.email, pin).then(function (result) {
                    if (result.success) {
                      var updated = Object.assign({}, ses, { pin: pin });
                      grabar('mt_pin_' + u.id, pin);
                      grabar(SKEY, updated);
                      setSession(updated);
                    }
                    applying = false;
                  });
                })
                .catch(function () { applying = false; });
            }
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
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (supaSession) aplicar(supaSession);
      } else if (event === 'SIGNED_OUT') {
        var manual = cierreManualRef.current;
        cierreManualRef.current = false;
        var actual = sessionRef.current;
        limpiarSesionLocal(actual);
        // Si el cierre no lo pidió el usuario aquí, vino de otro
        // dispositivo (o caducó): dejamos un aviso para la pantalla
        // de acceso, así el usuario "lo nota".
        if (!manual && actual) {
          grabar('mt_aviso', { tipo: 'remote_signout', ts: Date.now() });
        }
        setSession(null);
        applying = false;
      }
    });

    return function () {
      try {
        if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
      } catch (e) {}
    };
  }, []);

  // ── Vigilancia de cierre de sesión entre dispositivos ──────────
  // Solo para usuarios reales de la nube (no invitados ni modo PIN local).
  var esSesionCloud = !!(
    session &&
    session.cloud &&
    !session.guest &&
    !session.pinOnly &&
    CLOUD_MODE &&
    SUPA
  );
  useEffect(
    function () {
      if (typeof startSessionSync !== 'function') return;
      if (!esSesionCloud) {
        if (typeof stopSessionSync === 'function') stopSessionSync();
        return;
      }
      startSessionSync(function () {
        forzarCierreRemoto();
      });
      return function () {
        if (typeof stopSessionSync === 'function') stopSessionSync();
      };
    },
    [esSesionCloud]
  );

  if (showIntro) return h(SplashScreen, { exit: introExit });

  if (!session) {
    return h(AuthScreen, { onAuth: handleAuth });
  }
  return h(App, {
    key: session.uid,
    session: session,
    onSignOut: signOut,
    onSessionPatch: patchSession,
    introPlayed: introPlayed
  });
}
