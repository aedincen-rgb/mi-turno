// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/otp.js
//  OTP local y generación de PIN único
// ════════════════════════════════════════════════════════════════
var _otpRef = { code: null, expires: 0 };

function otpGenerar() {
  _otpRef.code = String(Math.floor(100000 + Math.random() * 900000));
  _otpRef.expires = Date.now() + 300000; // 5 min
  return _otpRef.code;
}

function otpVerificar(input) {
  if (!_otpRef.code) return false;
  if (Date.now() > _otpRef.expires) {
    _otpRef.code = null;
    return false;
  }
  return input === _otpRef.code;
}

function otpLimpiar() {
  _otpRef.code = null;
  _otpRef.expires = 0;
}

var _PINES_RESERVADOS = ['9999', '0000'];

async function generarPINUnico(uid) {
  var ts = Date.now();
  var rnd = Math.floor(Math.random() * 10000);
  var pin = String((ts + rnd) % 10000).padStart(4, '0');
  if (_PINES_RESERVADOS.indexOf(pin) >= 0) pin = '0001';
  if (CLOUD_MODE && SUPA) {
    var intentos = 0;
    while (intentos < 10) {
      try {
        var r = await SUPA.from('pin_lookup').select('pin').eq('pin', pin).maybeSingle();
        if (r.error && r.error.code !== 'PGRST116') break;
        if (!r.data) break;
        pin = String(Math.floor(Math.random() * 9998) + 1).padStart(4, '0');
        if (_PINES_RESERVADOS.indexOf(pin) >= 0) pin = '0001';
        intentos++;
      } catch (e) {
        break;
      }
    }
  }
  return pin;
}

async function guardarPINEnNube(uid, email, pin) {
  if (!SUPA || !CLOUD_MODE) return { success: false };
  try {
    var r = await SUPA.from('pin_lookup').upsert(
      { user_id: uid, user_email: email, pin: pin, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    return { success: !r.error, error: r.error };
  } catch (e) {
    return { success: false, error: e };
  }
}
