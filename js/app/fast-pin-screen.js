// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/fast-pin-screen.js
//  Login simplificado — solo PIN — para devices "conocidos".
//  Se muestra cuando hay session=null pero el localStorage retiene
//  credenciales offline de un usuario previo:
//    · mt_last_user = { uid, email }
//    · mt_pin_<uid> = '1234'
//    · mt_offline_<base64(email)> = sesión cacheada
//  El usuario solo escribe los 4 dígitos. Si matchean, restauramos
//  la sesión offline. La flecha ← desactiva este modo para esta
//  pestaña y vuelve al AuthScreen completo. "Olvidé mi PIN" abre
//  el modal de recuperación que valida email + password.
// ════════════════════════════════════════════════════════════════

function FastPinScreen(props) {
  var lastUser = props.lastUser || {};
  var pinS = useState('');
  var pin = pinS[0],
    setPin = pinS[1];
  var errS = useState(null);
  var err = errS[0],
    setErr = errS[1];
  var shakeS = useState(false);
  var shake = shakeS[0],
    setShake = shakeS[1];
  var busyS = useState(false);
  var busy = busyS[0],
    setBusy = busyS[1];

  // Saludo personalizado: alias guardado en v30, fallback al email
  var saludoNombre = '';
  try {
    var dkFn =
      typeof dk === 'function'
        ? dk
        : function (u, k) {
            return 'mt_' + k + '_' + u;
          };
    var nm = leer(dkFn(lastUser.uid, 'pname'), '');
    if (nm) saludoNombre = String(nm).trim();
    else if (lastUser.email) {
      var primero = String(lastUser.email).split('@')[0].split('.')[0];
      if (primero && primero.length <= 16) {
        saludoNombre = primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
      }
    }
  } catch (_) {}

  var titulo = saludoNombre ? 'Hola, ' + saludoNombre : 'Escribí tu PIN';
  var sub = saludoNombre
    ? 'Para continuar, ingresá tu PIN.'
    : 'Ingresá tu PIN de 4 dígitos para entrar.';

  function tryUnlock(p) {
    var stored = leer('mt_pin_' + lastUser.uid, null);
    if (!stored) {
      setErr('No hay PIN guardado en este dispositivo. Usá el login completo.');
      setShake(true);
      setTimeout(function () {
        setShake(false);
      }, 350);
      return;
    }
    if (p === stored) {
      // Restaurar sesión offline cacheada
      var ses = null;
      try {
        ses = leer('mt_offline_' + btoa(lastUser.email), null);
      } catch (_) {}
      if (!ses) {
        // Fallback: arma una sesión mínima
        ses = {
          uid: lastUser.uid,
          email: lastUser.email,
          cloud: true,
          guest: false,
          isAdmin: lastUser.email === 'admin@miturno.com'
        };
      }
      ses.pin = p;
      try {
        haptic && haptic();
      } catch (_) {}

      // Restaurar la sesión REAL de Supabase con los tokens cacheados. Esto
      // autentica el cliente → el device sube, baja y recibe realtime (antes
      // entraba "cloud" pero deslogueado → no sincronizaba, LED ámbar pegado).
      // Si no hay tokens / red, o el refresh token está revocado/expirado,
      // entramos en modo local (sin pérdida: cargarDatos usa lo local).
      if (isOnline() && CLOUD_MODE && SUPA && ses.access_token && ses.refresh_token) {
        setBusy(true);
        withTimeout(
          SUPA.auth.setSession({
            access_token: ses.access_token,
            refresh_token: ses.refresh_token
          }),
          9000,
          'Restaurar sesión'
        )
          .then(function (res) {
            setBusy(false);
            if (res && res.error) {
              // Token muerto: lo limpiamos para no reintentar en vano.
              try {
                var k = 'mt_offline_' + btoa(lastUser.email);
                var b = leer(k, null);
                if (b) {
                  delete b.access_token;
                  delete b.refresh_token;
                  grabar(k, b);
                }
              } catch (_) {}
            }
            // Con éxito, onAuthStateChange en root.js refina la sesión y
            // dispara la convergencia; igual entramos ya para UI instantánea.
            if (props.onAuth) props.onAuth(ses);
          })
          .catch(function () {
            setBusy(false);
            if (props.onAuth) props.onAuth(ses);
          });
        return;
      }

      if (props.onAuth) props.onAuth(ses);
    } else {
      setErr('PIN incorrecto. Probá de nuevo.');
      setShake(true);
      try {
        haptic && haptic();
      } catch (_) {}
      setTimeout(function () {
        setShake(false);
        setPin('');
      }, 380);
    }
  }

  function press(d) {
    if (busy) return;
    if (pin.length >= 4) return;
    try {
      haptic && haptic();
    } catch (_) {}
    setErr(null);
    var next = pin + d;
    setPin(next);
    if (next.length === 4) {
      // Pequeño delay para que el usuario vea la 4ta celda llenarse
      setTimeout(function () {
        tryUnlock(next);
      }, 110);
    }
  }
  function backspace() {
    if (!pin.length) return;
    try {
      haptic && haptic();
    } catch (_) {}
    setErr(null);
    setPin(pin.slice(0, -1));
  }

  return h(
    'main',
    { className: 'fastpin-wrap', 'aria-label': 'Entrar con PIN' },

    // Flecha ← arriba a la izquierda: vuelve al login completo
    h(
      'button',
      {
        className: 'fastpin-back',
        onClick: function () {
          try {
            haptic && haptic();
          } catch (_) {}
          if (props.onExitFastMode) props.onExitFastMode();
        },
        'aria-label': 'Volver al inicio de sesión completo'
      },
      h('span', { 'aria-hidden': 'true' }, '←')
    ),

    // Logo en esquina inferior derecha (sutil, "nuestra marca")
    h(
      'div',
      { className: 'fastpin-logo', 'aria-hidden': 'true' },
      h('img', { src: 'img/logo-mark.svg', alt: '', draggable: false })
    ),

    // ─── Encabezado ───
    h(
      'div',
      { className: 'fastpin-hdr' },
      h('h1', { className: 'fastpin-ttl' }, titulo),
      h('div', { className: 'fastpin-sub' }, sub)
    ),

    // ─── 4 celdas centradas ───
    h(
      'div',
      {
        className: 'fastpin-cells' + (shake ? ' shake' : ''),
        role: 'status',
        'aria-live': 'polite',
        'aria-label': pin.length + ' de 4 dígitos ingresados'
      },
      [0, 1, 2, 3].map(function (i) {
        var filled = pin.length > i;
        var active = pin.length === i && !err;
        return h(
          'div',
          {
            key: i,
            'aria-hidden': 'true',
            className: 'fastpin-cell' + (filled ? ' filled' : '') + (active ? ' active' : '')
          },
          filled ? h('span', { className: 'fastpin-dot' }) : null
        );
      })
    ),

    // ─── Pill informativo / error ───
    busy
      ? h(
          'div',
          { className: 'fastpin-pill', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, '⏳'),
          'Entrando y sincronizando…'
        )
      : err
        ? h(
            'div',
            { className: 'fastpin-pill err', role: 'alert', 'aria-live': 'assertive' },
            h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, '⚠'),
            err
          )
        : h(
            'div',
            { className: 'fastpin-pill' },
            h('span', { className: 'fastpin-pill-ico', 'aria-hidden': 'true' }, 'ⓘ'),
            'No compartas tu PIN con nadie.'
          ),

    // ─── Keypad numérico (3×3 + 0 + ⌫) ───
    h(
      'div',
      { className: 'fastpin-keypad', role: 'group', 'aria-label': 'Teclado numérico' },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (n) {
        return h(
          'button',
          {
            key: n,
            className: 'fastpin-key',
            onClick: function () {
              press(n);
            },
            type: 'button',
            'aria-label': 'Dígito ' + n
          },
          n
        );
      }),
      h('div', { className: 'fastpin-key fastpin-key-empty', 'aria-hidden': 'true' }),
      h(
        'button',
        {
          key: '0',
          className: 'fastpin-key',
          onClick: function () {
            press('0');
          },
          type: 'button',
          'aria-label': 'Dígito 0'
        },
        '0'
      ),
      h(
        'button',
        {
          key: 'del',
          className: 'fastpin-key fastpin-key-del',
          onClick: backspace,
          type: 'button',
          'aria-label': 'Borrar'
        },
        h('span', { 'aria-hidden': 'true' }, '⌫')
      )
    ),

    // ─── Olvidé mi PIN ───
    h(
      'button',
      {
        className: 'fastpin-forgot',
        onClick: function () {
          try {
            haptic && haptic();
          } catch (_) {}
          if (props.onForgotPin) props.onForgotPin();
        },
        type: 'button'
      },
      'Olvidé mi PIN'
    )
  );
}
