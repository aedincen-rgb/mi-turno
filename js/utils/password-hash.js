// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/password-hash.js
//  PBKDF2 + salt random para passwords cacheadas localmente.
//
//  Antes (deuda v37): mt_pass_<base64(email)> = "miPasswordPlain"
//   → cualquiera con acceso al device leía la password directo.
//
//  Ahora (v49): mt_pass_<base64(email)> = JSON.stringify({
//                  v: 1,                              // versión del schema
//                  s: '<salt 16B base64>',
//                  h: '<hash 32B base64>'
//                })
//   → SubtleCrypto PBKDF2-SHA256 con 100k iteraciones
//   → resistente a rainbow tables y a fuerza bruta razonable
//
//  Migración suave: legacyVerifyPassword acepta el formato viejo
//  (string plano) para no romper logins existentes; el callsite
//  re-guarda en formato nuevo en cuanto un login viejo sea exitoso.
// ════════════════════════════════════════════════════════════════

(function () {
  var ITERATIONS = 100000;
  var HASH_BITS = 256;
  var SCHEMA_VERSION = 1;

  function _subtle() {
    return window.crypto && window.crypto.subtle ? window.crypto.subtle : null;
  }
  function _u8ToB64(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function _b64ToU8(b64) {
    var s = atob(b64);
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }

  // Deriva HASH_BITS bits con PBKDF2-SHA256 desde plaintext + salt.
  function _derive(plaintext, salt) {
    var subtle = _subtle();
    if (!subtle) return Promise.reject(new Error('Web Crypto no disponible'));
    var keyData = new TextEncoder().encode(String(plaintext || ''));
    return subtle
      .importKey('raw', keyData, 'PBKDF2', false, ['deriveBits'])
      .then(function (keyMat) {
        return subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
          },
          keyMat,
          HASH_BITS
        );
      })
      .then(function (bits) {
        return new Uint8Array(bits);
      });
  }

  // Hashea un password nuevo. Devuelve string serializable para localStorage.
  // Genera salt random de 16 bytes con crypto.getRandomValues.
  function hashPassword(plaintext) {
    var salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    return _derive(plaintext, salt).then(function (hashU8) {
      return JSON.stringify({
        v: SCHEMA_VERSION,
        s: _u8ToB64(salt),
        h: _u8ToB64(hashU8)
      });
    });
  }

  // Verifica un password contra el blob guardado. Acepta:
  //   · JSON {v, s, h}  → formato nuevo (v49+)
  //   · string plano    → formato legacy (pre-v49), comparación directa
  //
  // El segundo retorno es `legacy: true` cuando se verificó por la rama
  // legacy — el callsite puede usar eso para re-guardar como hash.
  function verifyPassword(plaintext, stored) {
    if (!stored) return Promise.resolve({ ok: false, legacy: false });
    // Formato legacy
    if (typeof stored !== 'string' || stored.charAt(0) !== '{') {
      var ok = String(stored) === String(plaintext);
      return Promise.resolve({ ok: ok, legacy: ok });
    }
    var parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (_) {
      return Promise.resolve({ ok: false, legacy: false });
    }
    if (!parsed || parsed.v !== SCHEMA_VERSION || !parsed.s || !parsed.h) {
      return Promise.resolve({ ok: false, legacy: false });
    }
    var salt = _b64ToU8(parsed.s);
    return _derive(plaintext, salt).then(function (hashU8) {
      // Comparación constante (no crítico para hashes pero buen hábito)
      var stored2 = _b64ToU8(parsed.h);
      if (hashU8.length !== stored2.length) return { ok: false, legacy: false };
      var diff = 0;
      for (var i = 0; i < hashU8.length; i++) diff |= hashU8[i] ^ stored2[i];
      return { ok: diff === 0, legacy: false };
    });
  }

  window.hashPassword = hashPassword;
  window.verifyPassword = verifyPassword;
})();
