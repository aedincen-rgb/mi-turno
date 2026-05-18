// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/network.js
//  Timeout y traducción de errores
// ════════════════════════════════════════════════════════════════
function withTimeout(promise, ms, label) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var t = setTimeout(function () {
      if (done) return;
      done = true;
      reject(new Error((label || 'Operación') + ' superó el tiempo de espera'));
    }, ms);
    Promise.resolve(promise).then(
      function (v) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      },
      function (e) {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function traducirError(err) {
  if (!err) return 'Error desconocido';
  var msg = (err.message || err.error_description || err.toString() || '').toString();
  var low = msg.toLowerCase();
  if (
    low.indexOf('load failed') >= 0 ||
    low.indexOf('failed to fetch') >= 0 ||
    low.indexOf('networkerror') >= 0 ||
    low.indexOf('tiempo de espera') >= 0
  )
    return 'No se pudo conectar al servidor. Revisa tu internet.';
  if (low.indexOf('invalid login') >= 0 || low.indexOf('invalid credentials') >= 0)
    return 'Correo o contraseña incorrectos.';
  if (low.indexOf('email not confirmed') >= 0) return 'Debes confirmar tu correo antes de entrar.';
  if (low.indexOf('user already') >= 0 || low.indexOf('already registered') >= 0)
    return 'Ya existe una cuenta con ese correo.';
  if (low.indexOf('password should be') >= 0 || low.indexOf('weak password') >= 0)
    return 'La contraseña es muy débil (mínimo 6).';
  if (low.indexOf('rate limit') >= 0) return 'Demasiados intentos. Espera un momento.';
  return msg;
}
