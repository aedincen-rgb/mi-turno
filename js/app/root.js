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

  // ── Onboarding: solo en primer launch ──
  var ob = useState(function () {
    return !onboardingDone();
  });
  var showOnboarding = ob[0], setShowOnboarding = ob[1];

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
    // Marca este device como "conocido" para el próximo arranque,
    // así podemos ofrecer login simplificado por PIN. No se borra al
    // cerrar sesión; el usuario lo limpia con la flecha ← del
    // FastPinScreen o al ingresar como otro usuario.
    try {
      if (validated && validated.uid && validated.email && !validated.guest) {
        grabar('mt_last_user', { uid: validated.uid, email: validated.email });
      }
    } catch (_) {}
    // Salir del "skip fast" cuando se loguea correctamente
    setSkipFast(false);
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
      // Marca device conocido también cuando Supabase restaura sesión
      try {
        if (ses && ses.uid && ses.email) {
          grabar('mt_last_user', { uid: ses.uid, email: ses.email });
        }
      } catch (_) {}

      // Cachear los tokens de Supabase: habilita que FastPin restaure la
      // sesión REAL (setSession) sin pedir contraseña, así el device queda
      // autenticado y sincroniza de verdad (sube, baja y realtime).
      try {
        if (u.email && supaSession.access_token && supaSession.refresh_token) {
          var _okey = 'mt_offline_' + btoa(String(u.email).toLowerCase());
          var _oblob = leer(_okey, null) || {
            uid: u.id,
            email: String(u.email).toLowerCase(),
            cloud: true,
            guest: false,
            isAdmin: esAdminAuto
          };
          _oblob.access_token = supaSession.access_token;
          _oblob.refresh_token = supaSession.refresh_token;
          _oblob.token_expires_at = supaSession.expires_at || null;
          grabar(_okey, _oblob);
        }
      } catch (_) {}

      // Sesión autenticada confirmada → vaciar la cola pendiente y forzar
      // una convergencia de datos (cierra el hueco si se entró por PIN o
      // si realtime estuvo caído mientras hubo cambios en otro device).
      // Diferido con setTimeout: NUNCA llamar métodos de supabase (getSession
      // dentro de processQueue) de forma síncrona dentro del callback de
      // onAuthStateChange — puede bloquear el lock de auth.
      setTimeout(function () {
        try {
          if (typeof processQueue === 'function') processQueue(u.id);
        } catch (_) {}
        try {
          if (typeof window.__mtResync === 'function') window.__mtResync();
        } catch (_) {}
      }, 450);

      if (u.email) {
        // Lookup por user_id (estable) en vez de user_email (mutable):
        // si el usuario cambia su correo, el lookup por email queda
        // desincronizado un rato. El user_id nunca cambia.
        withTimeout(
          SUPA.from('pin_lookup').select('pin').eq('user_id', u.id).maybeSingle(),
          6000,
          'PIN lookup en aplicar'
        )
          .then(function (res) {
            // CRÍTICO (v53): si la query devolvió error (RLS, timeout sin
            // throw, etc.) NO tocar el PIN local. Antes el código asumía
            // 'primer login' y generaba un PIN aleatorio nuevo, pisando
            // el real del usuario → FastPinScreen mostraba 'PIN incorrecto'.
            if (res && res.error) {
              console.warn(
                '[MT] PIN lookup devolvió error — preservando PIN local:',
                res.error.message || res.error
              );
              applying = false;
              return;
            }
            if (res.data && res.data.pin) {
              var updated = Object.assign({}, ses);
              updated.pin = res.data.pin;
              if (res.data.pin === '9999') updated.isAdmin = true;
              grabar('mt_pin_' + u.id, res.data.pin);
              grabar(SKEY, updated);
              setSession(updated);
              applying = false;
              return;
            }
            // res.data === null y sin error → genuinamente no hay PIN en
            // pin_lookup. ANTES de generar uno nuevo random, revisar si
            // hay uno local de una sesión anterior — si lo hay, subirlo
            // en vez de generar otro (evita pérdida de PIN del usuario).
            var pinLocal = leer('mt_pin_' + u.id, null);
            if (pinLocal && /^\d{4}$/.test(String(pinLocal))) {
              guardarPINEnNube(u.id, u.email, pinLocal)
                .then(function () {
                  applying = false;
                })
                .catch(function () {
                  applying = false;
                });
              return;
            }
            // Primer login real: el PIN no se pudo guardar durante el
            // registro (sin sesión activa). Ahora que hay sesión, se
            // genera y guarda.
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
              .catch(function () {
                applying = false;
              });
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

  // ── Fast PIN: device "conocido" después de un login completo ─────
  // Cuando se cierra sesión preservamos credenciales offline (PIN +
  // sesión cacheada). Aquí detectamos si podemos saltar el login
  // completo y mostrar solo el ingreso del PIN.
  var skipFastS = useState(false);
  var skipFast = skipFastS[0],
    setSkipFast = skipFastS[1];
  var showForgotPinS = useState(false);
  var showForgotPin = showForgotPinS[0],
    setShowForgotPin = showForgotPinS[1];

  function _fastPinEligible() {
    if (skipFast) return null;
    try {
      var lu = leer('mt_last_user', null);
      if (!lu || !lu.uid || !lu.email) return null;
      var pin = leer('mt_pin_' + lu.uid, null);
      if (!pin || String(pin).length !== 4) return null;
      return lu;
    } catch (_) {
      return null;
    }
  }

  if (showIntro) return h(SplashScreen, { exit: introExit });

  if (!session) {
    var lastUser = _fastPinEligible();
    if (lastUser && typeof FastPinScreen === 'function') {
      return h(
        'div',
        null,
        h(FastPinScreen, {
          lastUser: lastUser,
          onAuth: handleAuth,
          onExitFastMode: function () {
            setSkipFast(true);
          },
          onForgotPin: function () {
            setShowForgotPin(true);
          }
        }),
        showForgotPin && typeof ForgotPinModal === 'function'
          ? h(ForgotPinModal, {
              lastUser: lastUser,
              onClose: function () {
                setShowForgotPin(false);
              },
              onPinReset: function (ses) {
                setShowForgotPin(false);
                handleAuth(ses);
              }
            })
          : null
      );
    }
    return h(AuthScreen, { onAuth: handleAuth });
  }

  return h(
    'div',
    { style: { display: 'contents' } },
    h(App, {
      key: session.uid,
      session: session,
      onSignOut: signOut,
      onSessionPatch: patchSession,
      introPlayed: introPlayed
    }),
    showOnboarding && typeof OnboardingModal === 'function'
      ? h(OnboardingModal, {
          onDone: function () { setShowOnboarding(false); }
        })
      : null
  );
}
