// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/forgot-pin.js
//  Recuperación de PIN — flujo estructurado:
//   1) creds:    pide los OTROS 2 datos (correo + contraseña)
//                Valida vía Supabase signInWithPassword.
//   2) prep:     espera local de 15 s con barra + contador
//                (mismo lenguaje visual del OTP del ManageAccount)
//   3) codigo:   revela código de 6 dígitos generado localmente;
//                el usuario lo reescribe para confirmar intención
//   4) newpin:   2 pasos — escribir PIN nuevo + confirmar
//                Guarda en mt_pin_<uid> + pin_lookup (onConflict
//                user_id) + dispara onAuth con la sesión restaurada.
//  El modal asume que ya existe `mt_last_user` con el uid+email,
//  pero pide al usuario reescribir el correo para confirmar.
// ════════════════════════════════════════════════════════════════

function ForgotPinModal(props) {
  var lastUser = props.lastUser || {};
  // step: 'creds' | 'prep' | 'codigo' | 'newpin'
  var stepS = useState('creds');
  var step = stepS[0], setStep = stepS[1];

  // Creds
  var emS = useState(lastUser.email || '');
  var em = emS[0], setEm = emS[1];
  var pwS = useState('');
  var pw = pwS[0], setPw = pwS[1];
  var bS = useState(false);
  var busy = bS[0], setBusy = bS[1];
  var fbS = useState(null);
  var feedback = fbS[0], setFeedback = fbS[1];

  // OTP local
  var generatedOtpRef = useRef(null);
  var codeS = useState('');
  var code = codeS[0], setCode = codeS[1];
  var prepIntervalRef = useRef(null);
  var prS = useState(15);
  var prepSec = prS[0], setPrepSec = prS[1];

  // PIN nuevo
  var newPinS = useState('');
  var newPin = newPinS[0], setNewPin = newPinS[1];
  var newPin2S = useState('');
  var newPin2 = newPin2S[0], setNewPin2 = newPin2S[1];
  var stageS = useState(1); // 1 = ingresar, 2 = confirmar
  var stage = stageS[0], setStage = stageS[1];

  var mountedRef = useRef(true);
  useEffect(function () {
    return function () {
      mountedRef.current = false;
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    };
  }, []);

  function _clearPrep() {
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
  }

  // ─── Paso 1: validar correo + contraseña ───
  function doCreds() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    setFeedback(null);

    var emClean = String(em || '').trim().toLowerCase();
    if (!emClean || emClean.indexOf('@') < 0) {
      setFeedback('Escribí tu correo completo.');
      return;
    }
    if (!pw) {
      setFeedback('Escribí tu contraseña actual.');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('La recuperación de PIN requiere conexión.');
      return;
    }
    setBusy(true);
    SUPA.auth
      .signInWithPassword({ email: emClean, password: pw })
      .then(function (res) {
        if (!mountedRef.current) return;
        if (res && res.error) {
          setFeedback('Correo o contraseña incorrectos.');
          setBusy(false);
          return;
        }
        // OK — arrancar OTP local
        _startLocalOtp();
      })
      .catch(function (e) {
        if (!mountedRef.current) return;
        setFeedback(
          typeof traducirError === 'function'
            ? traducirError(e) || 'No se pudo verificar.'
            : 'No se pudo verificar.'
        );
        setBusy(false);
      });
  }

  // ─── Paso 2: arrancar OTP local con espera de 15 s ───
  function _startLocalOtp() {
    _clearPrep();
    var arr = (window.crypto && window.crypto.getRandomValues)
      ? window.crypto.getRandomValues(new Uint32Array(1))
      : [Math.floor(Math.random() * 1e9)];
    var c = String(100000 + (arr[0] % 900000));
    generatedOtpRef.current = c;
    setCode('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    setStep('prep');
    prepIntervalRef.current = setInterval(function () {
      if (!mountedRef.current) { _clearPrep(); return; }
      setPrepSec(function (s) {
        if (s <= 1) {
          _clearPrep();
          try { haptic && haptic(); } catch (_) {}
          setStep('codigo');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ─── Paso 3: verificar el código tipeado ───
  function doVerifyCode() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    var typed = code.replace(/\D/g, '');
    if (typed.length < 6) {
      setFeedback('Ingresá los 6 dígitos.');
      return;
    }
    if (typed !== generatedOtpRef.current) {
      setFeedback('El código no coincide. Revisá y volvé a intentar.');
      return;
    }
    generatedOtpRef.current = null;
    setCode('');
    setFeedback(null);
    setStep('newpin');
    setStage(1);
    setNewPin('');
    setNewPin2('');
  }

  // ─── Paso 4: nuevo PIN + confirmación + guardado ───
  function applyNewPin() {
    if (busy) return;
    try { haptic && haptic(); } catch (_) {}
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setFeedback('El PIN debe ser de 4 dígitos.');
      return;
    }
    if (newPin !== newPin2) {
      setFeedback('Los PIN no coinciden.');
      setStage(1);
      setNewPin2('');
      return;
    }
    // PINs reservados / fáciles
    var reservados = ['0000', '1234', '1111', '0001', '9999'];
    if (reservados.indexOf(newPin) >= 0) {
      setFeedback('Elegí un PIN menos predecible.');
      setStage(1);
      setNewPin('');
      setNewPin2('');
      return;
    }
    setBusy(true);
    setFeedback(null);

    function applyLocalAndAuth() {
      grabar('mt_pin_' + lastUser.uid, newPin);
      // Restaurar sesión con el nuevo PIN
      var ses = null;
      try { ses = leer('mt_offline_' + btoa(lastUser.email), null); } catch (_) {}
      if (!ses) {
        ses = {
          uid: lastUser.uid,
          email: lastUser.email,
          cloud: true,
          guest: false,
          isAdmin: lastUser.email === 'admin@miturno.com'
        };
      }
      ses.pin = newPin;
      if (props.onPinReset) props.onPinReset(ses);
    }

    if (CLOUD_MODE && SUPA && lastUser.email) {
      // El recovery por su naturaleza arranca online (validamos password
      // contra Supabase en el paso 1), así que aquí casi siempre habrá
      // red. Igual usamos isOnline() como cinturón y, si falla por red,
      // encolamos para reintentar al volver — pero NO bloqueamos la UX.
      var online = typeof isOnline === 'function' ? isOnline() : true;
      if (!online) {
        applyLocalAndAuth();
        if (typeof queueAction === 'function') {
          queueAction(lastUser.uid, 'updatePinLookup', {
            pin: newPin, user_email: lastUser.email
          });
        }
        return;
      }
      SUPA.from('pin_lookup')
        .upsert(
          {
            pin: newPin,
            user_email: lastUser.email,
            user_id: lastUser.uid,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        .then(function (res) {
          if (!mountedRef.current) return;
          if (res && res.error) {
            var c = String(res.error.code || '');
            var m = String(res.error.message || '').toLowerCase();
            if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0) {
              setFeedback('Ese PIN ya está en uso por otra cuenta. Elegí otro.');
              setStage(1);
              setNewPin('');
              setNewPin2('');
              setBusy(false);
              return;
            }
            // Error transitorio (red, timeout) → encolar y seguir
            if (typeof queueAction === 'function') {
              queueAction(lastUser.uid, 'updatePinLookup', {
                pin: newPin, user_email: lastUser.email
              });
            }
            applyLocalAndAuth();
            return;
          }
          applyLocalAndAuth();
        })
        .catch(function () {
          if (!mountedRef.current) return;
          // Excepción de red → aplicamos local y encolamos
          if (typeof queueAction === 'function') {
            queueAction(lastUser.uid, 'updatePinLookup', {
              pin: newPin, user_email: lastUser.email
            });
          }
          applyLocalAndAuth();
        });
    } else {
      applyLocalAndAuth();
    }
  }

  function close() {
    _clearPrep();
    generatedOtpRef.current = null;
    if (props.onClose) props.onClose();
  }

  // ═══ RENDER ═══

  // Paso 1: credenciales
  if (step === 'creds') {
    return h(
      'div',
      {
        className: 'ovl',
        onClick: function (e) { if (e.target === e.currentTarget) close(); }
      },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('span', { className: 'vf-icon' }, '🔑'),
          h('div', { className: 'vf-title' }, 'Recuperar mi PIN'),
          h(
            'div',
            { className: 'vf-desc' },
            'Para crear un PIN nuevo confirmá tu correo y contraseña.'
          )
        ),
        h(
          'div',
          { style: { marginBottom: 10 } },
          h('div', { className: 'inp-lbl' }, 'Correo'),
          h('input', {
            type: 'email',
            inputMode: 'email',
            className: 'inp',
            placeholder: 'tu@correo.com',
            value: em,
            autoFocus: true,
            onChange: function (e) { setEm(e.target.value); }
          })
        ),
        h(
          'div',
          { style: { marginBottom: 12 } },
          h('div', { className: 'inp-lbl' }, 'Contraseña'),
          h('input', {
            type: 'password',
            className: 'inp',
            placeholder: 'Tu contraseña actual',
            value: pw,
            onChange: function (e) { setPw(e.target.value); },
            onKeyDown: function (e) { if (e.key === 'Enter') doCreds(); }
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 8
                }
              },
              feedback
            )
          : null,
        h(
          'button',
          {
            className: 'btn btn-accent btn-block',
            onClick: doCreds,
            disabled: busy,
            style: { marginBottom: 8 }
          },
          busy ? h('span', { className: 'sp-in' }) : 'Continuar'
        ),
        h('button', { className: 'btn btn-ghost btn-block', onClick: close }, 'Cancelar')
      )
    );
  }

  // Paso 2: preparando (15 s)
  if (step === 'prep') {
    var totalSec = 15;
    var pct = Math.max(0, Math.min(100, ((totalSec - prepSec) / totalSec) * 100));
    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step otp-prep' },
          h(
            'div',
            { className: 'otp-prep-shield' },
            h('div', { className: 'otp-prep-shield-glow' }),
            h('div', { className: 'otp-prep-shield-icon' }, '✦')
          ),
          h('div', { className: 'vf-title' }, 'Preparando tu código'),
          h(
            'div',
            { className: 'vf-desc' },
            'Por seguridad, tomamos unos segundos antes de mostrártelo.'
          ),
          h(
            'div',
            { className: 'otp-prep-bar-wrap' },
            h(
              'div',
              { className: 'otp-prep-bar' },
              h('div', { className: 'otp-prep-bar-fill', style: { width: pct + '%' } })
            ),
            h('div', { className: 'otp-prep-sec' }, prepSec + 's')
          )
        ),
        h(
          'button',
          { className: 'btn btn-ghost btn-block', onClick: close, style: { marginTop: 8 } },
          'Cancelar'
        )
      )
    );
  }

  // Paso 3: código revelado + input
  if (step === 'codigo') {
    var revealed = generatedOtpRef.current || '';
    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('div', { className: 'vf-title' }, 'Tu código de confirmación'),
          h('div', { className: 'vf-desc' }, 'Escribilo abajo para continuar.')
        ),
        h(
          'div',
          { className: 'otp-reveal' },
          revealed.split('').map(function (d, i) {
            return h('span', { key: i, className: 'otp-reveal-digit' }, d);
          })
        ),
        h(
          'div',
          { className: 'code-grid', style: { marginTop: 14, marginBottom: 4 } },
          Array.from({ length: 6 }).map(function (_, i) {
            return h('input', {
              key: i,
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '1',
              className: 'code-cell',
              value: code[i] || '',
              autoFocus: i === 0,
              onChange: function (e) {
                var v = e.target.value.replace(/\D/g, '');
                if (v.length > 1) v = v.slice(-1);
                var arr = code.split('');
                arr[i] = v;
                setCode(arr.join('').slice(0, 6));
                if (v && i < 5) {
                  var sib = e.target.parentElement.children[i + 1];
                  if (sib) sib.focus();
                }
              },
              onKeyDown: function (e) {
                if (e.key === 'Backspace' && !code[i] && i > 0) {
                  var sib = e.target.parentElement.children[i - 1];
                  if (sib) sib.focus();
                }
                if (e.key === 'Enter') doVerifyCode();
              }
            });
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 8
                }
              },
              feedback
            )
          : null,
        h(
          'button',
          {
            className: 'btn btn-accent btn-block',
            onClick: doVerifyCode,
            disabled: busy || code.replace(/\D/g, '').length < 6,
            style: { marginTop: 10, marginBottom: 8 }
          },
          'Confirmar'
        ),
        h('button', { className: 'btn btn-ghost btn-block', onClick: close }, 'Cancelar')
      )
    );
  }

  // Paso 4: nuevo PIN
  if (step === 'newpin') {
    var labelTop = stage === 1 ? 'Creá tu nuevo PIN' : 'Confirmá tu PIN';
    var labelSub =
      stage === 1
        ? 'Elegí 4 dígitos fáciles de recordar para vos pero difíciles de adivinar.'
        : 'Volvé a escribir el mismo PIN para confirmar.';
    var current = stage === 1 ? newPin : newPin2;
    var setCurrent = stage === 1 ? setNewPin : setNewPin2;

    function pressDigit(d) {
      if (current.length >= 4) return;
      try { haptic && haptic(); } catch (_) {}
      setFeedback(null);
      var nxt = current + d;
      setCurrent(nxt);
      if (nxt.length === 4) {
        if (stage === 1) {
          setTimeout(function () { setStage(2); }, 150);
        } else {
          setTimeout(function () { applyNewPin(); }, 110);
        }
      }
    }
    function pressBack() {
      if (!current.length) {
        if (stage === 2) {
          setStage(1);
          return;
        }
        return;
      }
      try { haptic && haptic(); } catch (_) {}
      setCurrent(current.slice(0, -1));
    }

    return h(
      'div',
      { className: 'ovl' },
      h(
        'div',
        { className: 'modal-card fp-newpin-card' },
        h(
          'div',
          { className: 'vf-step' },
          h('div', { className: 'vf-title' }, labelTop),
          h('div', { className: 'vf-desc' }, labelSub)
        ),
        h(
          'div',
          { className: 'fastpin-cells fp-newpin-cells' },
          [0, 1, 2, 3].map(function (i) {
            var filled = current.length > i;
            return h(
              'div',
              {
                key: i,
                className: 'fastpin-cell' + (filled ? ' filled' : '')
              },
              filled ? h('span', { className: 'fastpin-dot' }) : null
            );
          })
        ),
        feedback
          ? h(
              'div',
              {
                style: {
                  fontSize: 11.5,
                  color: 'var(--danger)',
                  background: 'var(--danger-dim)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  margin: '12px 0 4px',
                  textAlign: 'center'
                }
              },
              feedback
            )
          : null,
        h(
          'div',
          { className: 'fastpin-keypad fp-newpin-keypad' },
          ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (n) {
            return h(
              'button',
              {
                key: n,
                className: 'fastpin-key',
                onClick: function () { pressDigit(n); },
                type: 'button'
              },
              n
            );
          }),
          h('div', { className: 'fastpin-key fastpin-key-empty' }),
          h(
            'button',
            {
              className: 'fastpin-key',
              onClick: function () { pressDigit('0'); },
              type: 'button'
            },
            '0'
          ),
          h(
            'button',
            {
              className: 'fastpin-key fastpin-key-del',
              onClick: pressBack,
              type: 'button',
              'aria-label': 'Borrar'
            },
            h('span', { 'aria-hidden': 'true' }, '⌫')
          )
        ),
        h(
          'button',
          { className: 'btn btn-ghost btn-block', onClick: close, style: { marginTop: 12 } },
          busy ? h('span', { className: 'sp-in' }) : 'Cancelar'
        )
      )
    );
  }

  return null;
}
