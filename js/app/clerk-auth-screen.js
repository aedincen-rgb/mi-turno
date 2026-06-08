// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/clerk-auth-screen.js
//  Pantalla de autenticación via Clerk.
//  Monta los componentes de UI de Clerk en nodos DOM reales y los
//  envuelve en el shell visual de Mi Turno (glass morphism, fondo
//  degradado, logo). No usa JSX — solo h() conforme a convenciones.
// ════════════════════════════════════════════════════════════════

function ClerkAuthScreen(props) {
  // modo: 'login' | 'register'
  var md = useState('login');
  var modo  = md[0],
      setModo = md[1];

  // Ref para el nodo DOM donde Clerk monta su componente.
  var mountRef = useRef(null);

  // Mostrar aviso si hay sesión cerrada desde otro device.
  var av = useState(function () {
    return leer('mt_aviso', null);
  });
  var aviso = av[0];

  useEffect(function () {
    if (aviso) borrarKey('mt_aviso');
  }, []);

  // Inicializar el indicador de conexión Clerk al montar.
  var cm = useState(window.CLERK_MODE || false);
  var clerkOk = cm[0];

  // ── Montar / desmontar el componente de Clerk ─────────────────
  // Cuando el nodo DOM existe y Clerk está disponible, montamos
  // el componente SignIn o SignUp según el modo actual.
  // Al cambiar modo desmontamos el anterior y montamos el nuevo.
  useEffect(function () {
    var node = mountRef.current;
    if (!node) return;
    if (!window.Clerk || !window.CLERK_MODE) return;

    // Limpiar el nodo antes de montar (por si había un componente previo).
    node.innerHTML = '';

    // Opciones de apariencia para que el componente de Clerk
    // respete los colores de Mi Turno en la medida de lo posible.
    var appearance = {
      variables: {
        colorPrimary:      '#5b86e5',
        colorBackground:   'transparent',
        colorText:         'var(--text)',
        colorTextSecondary:'var(--muted)',
        colorInputBackground: 'var(--card)',
        colorInputText:    'var(--text)',
        borderRadius:      '12px',
        fontFamily:        "'DM Sans', sans-serif"
      },
      elements: {
        // Ocultar el header interno de Clerk — ya tenemos nuestro propio.
        headerTitle:    { display: 'none' },
        headerSubtitle: { display: 'none' },
        logoImage:      { display: 'none' },
        card:           { boxShadow: 'none', background: 'transparent', padding: '0' },
        rootBox:        { width: '100%' }
      }
    };

    // Callback que Clerk llama tras login/registro exitoso.
    // Leemos la sesión directamente de window._mtSession (ya
    // actualizado por clerk-init.js vía addListener).
    function onSuccess() {
      var ses = window._mtSession;
      if (ses && ses.uid && props.onAuth) {
        props.onAuth(ses);
      }
    }

    try {
      if (modo === 'login') {
        window.Clerk.mountSignIn(node, {
          appearance:    appearance,
          afterSignInUrl: '',
          signUpUrl:     '',
          // Clerk llama afterSignInUrl como redirect; como estamos en SPA
          // no redirigimos — en cambio escuchamos el listener en clerk-init.js.
          // El callback directo es para mayor robustez.
          initialValues: {}
        });
      } else {
        window.Clerk.mountSignUp(node, {
          appearance:    appearance,
          afterSignUpUrl: '',
          signInUrl:     '',
          initialValues: {}
        });
      }
    } catch (e) {
      console.warn('[MT] Error montando componente de Clerk:', e);
    }

    // Escuchar el evento de sesión activa para disparar onAuth.
    // Clerk no provee un callback directo desde mount*(); usamos
    // el listener de addListener que ya está en clerk-init.js.
    // Aquí agregamos uno adicional local que se limpia al desmontar.
    var unsubscribe = null;
    if (window.Clerk && typeof window.Clerk.addListener === 'function') {
      unsubscribe = window.Clerk.addListener(function (resources) {
        if (resources.user && props.onAuth) {
          var ses = window._mtSession;
          if (ses && ses.uid) {
            props.onAuth(ses);
          }
        }
      });
    }

    return function () {
      // Desmontar el componente de Clerk al salir o cambiar modo.
      try {
        if (modo === 'login' && window.Clerk && window.Clerk.unmountSignIn) {
          window.Clerk.unmountSignIn(node);
        } else if (window.Clerk && window.Clerk.unmountSignUp) {
          window.Clerk.unmountSignUp(node);
        }
      } catch (_) {}
      // Remover el listener local.
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (_) {}
      }
    };
  }, [modo]); // Re-ejecutar solo cuando cambia el modo.

  // ── Fallback: Clerk no disponible ─────────────────────────────
  // Si el SDK no cargó o la key no está configurada, mostramos
  // el AuthScreen original de Supabase como fallback.
  if (!window.CLERK_MODE) {
    if (typeof AuthScreen === 'function') {
      return h(AuthScreen, props);
    }
    // Último recurso: mensaje de error estilizado.
    return h(
      'main',
      {
        className: 'auth-wrap',
        'aria-label': 'Error de autenticación'
      },
      h(
        'div',
        { className: 'auth-hero' },
        h(
          'div',
          { className: 'auth-logo-box' },
          h('img', {
            src:       'img/logo-mark.svg',
            alt:       'Mi Turno',
            draggable: false,
            style:     { width: '48px', height: '48px', display: 'block' }
          })
        ),
        h('div', { className: 'auth-app-name' }, 'Mi Turno'),
        h('div', { className: 'auth-tagline' }, 'Colombia · Nómina inteligente')
      ),
      h(
        'div',
        { className: 'auth-card' },
        h(
          'div',
          {
            role:        'alert',
            'aria-live': 'assertive',
            className:   'auth-err',
            style:       { marginBottom: 0 }
          },
          window.CLERK_ERROR || 'Autenticación no disponible. Revisá tu conexión.'
        )
      )
    );
  }

  // ── Pantalla principal ────────────────────────────────────────
  return h(
    'main',
    {
      className:  'auth-wrap',
      'aria-label': modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
    },

    // Hero con logo
    h(
      'div',
      { className: 'auth-hero' },
      h(
        'div',
        { className: 'auth-logo-box' },
        h('img', {
          src:       'img/logo-mark.svg',
          alt:       'Mi Turno',
          draggable: false,
          style:     { width: '48px', height: '48px', display: 'block' }
        })
      ),
      h(
        'div',
        { className: 'auth-hero-txt' },
        h('div', { className: 'auth-app-name' }, 'Mi Turno'),
        h(
          'div',
          { className: 'auth-tagline' },
          modo === 'login' ? 'Colombia' : 'Colombia · Nómina inteligente'
        )
      )
    ),

    // Card principal
    h(
      'div',
      { className: 'auth-card' },

      h(
        'div',
        { className: 'auth-ttl' },
        modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
      ),

      // Aviso de cierre remoto de sesión
      aviso && aviso.tipo === 'remote_signout'
        ? h(
            'div',
            {
              role:        'status',
              'aria-live': 'polite',
              style: {
                background:    'var(--accent-dim)',
                color:         'var(--accent)',
                padding:       '10px 12px',
                borderRadius:  'var(--radius-sm)',
                fontSize:      12,
                marginBottom:  12,
                lineHeight:    1.45,
                border:        '1px solid color-mix(in srgb, var(--accent) 28%, transparent)'
              }
            },
            h('div', { style: { fontWeight: 700, marginBottom: 2 } }, 'Sesión cerrada'),
            h(
              'div',
              { style: { opacity: 0.9, fontSize: 11.5 } },
              'Se cerró sesión desde otro dispositivo. Iniciá sesión de nuevo para continuar.'
            )
          )
        : null,

      // Nodo donde Clerk monta su componente SignIn / SignUp.
      // Debe ser un div real en el DOM — Clerk hace innerHTML directo.
      h('div', {
        ref:   mountRef,
        style: { width: '100%', minHeight: '200px' }
      }),

      // Toggle login / registro
      h(
        'button',
        {
          className: 'auth-link',
          style:     { marginTop: 8 },
          onClick: function () {
            haptic();
            setModo(function (m) {
              return m === 'login' ? 'register' : 'login';
            });
          }
        },
        modo === 'login'
          ? '¿Sin cuenta? Regístrate aquí'
          : '¿Ya tenés cuenta? Iniciá sesión'
      ),

      // Botón de invitado — sigue funcionando igual que antes.
      modo === 'login'
        ? h(
            'button',
            {
              className: 'auth-guest',
              style:     { width: '100%', marginTop: 8 },
              onClick: function () {
                haptic();
                var gid =
                  'guest_' +
                  Date.now().toString(36) +
                  '_' +
                  Math.random().toString(36).slice(2, 8);
                var guestSession = {
                  uid:     gid,
                  email:   'invitado@local',
                  guest:   true,
                  cloud:   false,
                  pinOnly: false
                };
                grabar(SKEY, guestSession);
                if (props.onAuth) props.onAuth(guestSession);
              }
            },
            'Continuar como invitado (sin cuenta)'
          )
        : null
    ),

    h(
      'div',
      { className: 'auth-foot' },
      clerkOk ? 'Datos sincronizados en la nube' : 'Datos en este dispositivo'
    )
  );
}
