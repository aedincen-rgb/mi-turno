// ════════════════════════════════════════════════════════════════
// MI TURNO · ai-gemini.js
// Cliente del proxy Gemini — fallback cuando el NLP local no reconoce
// ════════════════════════════════════════════════════════════════

(function () {
  var EDGE_URL = 'https://yrpqvmqmchsxpotytxiy.supabase.co/functions/v1/ai-chat';

  // Construye un string corto de contexto del usuario para enriquecer el prompt
  function _buildGeminiContext(state) {
    var parts = [];
    if (state && state.salario) {
      parts.push('Salario base: $' + state.salario);
    }
    if (state && state.calc) {
      var c = state.calc;
      if (c.totalMes !== undefined && c.totalMes !== null) {
        parts.push('Total acumulado mes: $' + Math.round(c.totalMes));
      }
      if (c.horas !== undefined && c.horas !== null) {
        parts.push('Horas trabajadas: ' + c.horas + 'h');
      }
    }
    if (state && state.activo) {
      parts.push('Turno activo ahora mismo');
    }
    if (state && state.session) {
      var sess = state.session;
      var nombre = null;
      if (sess.uid) {
        nombre = leer(dk(sess.uid, 'pname'), null);
      }
      if (!nombre && sess.email) {
        nombre = sess.email.split('@')[0];
      }
      if (nombre) {
        parts.push('Usuario: ' + nombre);
      }
    }
    return parts.length > 0 ? parts.join(' | ') : null;
  }

  // Llama al proxy de Gemini. Devuelve string con la respuesta, o null si falla.
  // El caller decide el fallback cuando recibe null.
  function aiGeminiAsk(message, state) {
    var ctx = _buildGeminiContext(state);
    var body = { message: message };
    if (ctx) body.context = ctx;

    var fetchPromise = fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: window.SUPABASE_CONFIG.anonKey
      },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (e) {
            throw new Error(e.error || 'HTTP ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (data) {
        if (data && data.reply) {
          return data.reply;
        }
        return null;
      })
      .catch(function (err) {
        // Error de red, timeout u otro — devuelve null para que el caller use fallback local
        console.warn('[ai-gemini] fallo silencioso:', err.message);
        return null;
      });

    // withTimeout ya existe en el proyecto (utils/network.js)
    return withTimeout(fetchPromise, 8000, 'ai-chat').catch(function () {
      return null;
    });
  }

  window.aiGeminiAsk = aiGeminiAsk;
})();
