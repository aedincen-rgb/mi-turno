// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/gender-lang.js
//  Lenguaje adaptativo por género — v172
//  Centraliza todas las expresiones coloquiales colombianas
//  para que la app hable distinto según hombre / mujer / neutro.
//  100% offline · ES5 · sin dependencias externas.
//
//  Uso: _gl('greetings') → array de saludos según género
//       _glPick('greetings') → un saludo aleatorio
//       _glTerm('champion') → 'campeón' | 'campeona' | 'campeón/a'
// ════════════════════════════════════════════════════════════════

// ─── VOCABULARIO ──────────────────────────────────────────────
// Cada entrada tiene: male (masculino), female (femenino), neutral.
// Las claves son categorías semánticas, no traducciones literales.
var _GL_VOCAB = {
  // ── Saludos coloquiales (para inicio de frase) ──
  greetings: {
    male: ['parce', 'vecino', 'compadre', 'socio', 'mi llave', 'hermano', 'mano', 'compa'],
    female: ['amiga', 'vecina', 'comadre', 'socia', 'hermosa', 'bella', 'linda', 'nena'],
    neutral: ['colega', 'campeón', 'crack', 'figura']
  },

  // ── Entusiasmo / motivación ──
  enthusiasm: {
    male: [
      '¡Así se hace!', 'Con toda, parce.', 'Vamos por más.',
      'Esa es la actitud.', 'Sin miedo al éxito.', 'Dándole con toda.',
      'A fuego, mi llave.', 'Sos un duro.'
    ],
    female: [
      '¡Así se hace!', 'Con toda, amiga.', 'Vamos por más.',
      'Esa es la actitud.', 'Sin miedo al éxito.', 'Dándole con toda.',
      'A fuego, reina.', 'Sos una dura.'
    ],
    neutral: [
      '¡Así se hace!', 'Con toda.', 'Vamos por más.',
      'Esa es la actitud.', 'Sin miedo al éxito.', 'Dándole con toda.'
    ]
  },

  // ── Consuelo / calma ──
  consolation: {
    male: [
      'Tranqui, todo bien.', 'Así es la vuelta.',
      'No pasa nada, socio.', 'Tranquilo, vos podés.',
      'Dale sin mente.'
    ],
    female: [
      'Tranqui, todo bien.', 'Así es la vuelta.',
      'No pasa nada, amiga.', 'Tranquila, vos podés.',
      'Dale sin mente.'
    ],
    neutral: [
      'Tranqui, todo bien.', 'Así es la vuelta.',
      'No pasa nada.', 'Todo bien, no te afanés.'
    ]
  },

  // ── Follow-up / despedida parcial ──
  followUp: {
    male: [
      '¿Algo más en que te colabore?',
      '¿Qué más necesitás, parce?',
      '¿Qué otra cosa te ayudo, hermano?',
      '¿Seguimos, socio?'
    ],
    female: [
      '¿Algo más en que te colabore?',
      '¿Qué más necesitás, amiga?',
      '¿Qué otra cosa te ayudo, bella?',
      '¿Seguimos, reina?'
    ],
    neutral: [
      '¿Algo más en que te colabore?',
      '¿Qué más necesitás?',
      '¿Seguimos?'
    ]
  },

  // ── Términos aislados (sustantivos/adjetivos) ──
  champion: { male: 'campeón', female: 'campeona', neutral: 'campeón/a' },
  genius:   { male: 'genio',   female: 'genia',    neutral: 'genio/a' },
  tough:    { male: 'duro',    female: 'dura',     neutral: 'duro/a' },
  cool:     { male: 'bacán',   female: 'bacana',   neutral: 'bacán' },
  pretty:   { male: 'bacano',  female: 'bella',    neutral: 'genial' },
  boss:     { male: 'jefe',    female: 'jefa',     neutral: 'capo/a' },
  king:     { male: 'rey',     female: 'reina',    neutral: 'rey/reina' },
  friend:   { male: 'parce',   female: 'amiga',    neutral: 'colega' },

  // ── Despedida ──
  goodbye: {
    male: [
      '¡Nos vemos! Cuidate y descansá cuando puedas. ✦',
      'Chao, parce. Acá estoy cuando me necesités. 💪',
      '¡Hasta luego! Que te rinda el día. 🌟',
      'Nos vemos, hermano. A seguir dándole. ✌️'
    ],
    female: [
      '¡Nos vemos! Cuidate y descansá cuando puedas. ✦',
      'Chao, amiga. Acá estoy cuando me necesités. ✨',
      '¡Hasta luego! Que te rinda el día. 🌟',
      'Nos vemos, bella. A seguir brillando. ✌️'
    ],
    neutral: [
      '¡Nos vemos! Cuidate y descansá cuando puedas. ✦',
      'Chao. Acá estoy cuando me necesités. 💪',
      '¡Hasta luego! Que te rinda el día. 🌟'
    ]
  },

  // ── Agradecimiento ──
  thanks: {
    male: [
      '¡Con gusto, parce! Para eso estoy. 🙌',
      'De nada, hermano. Lo que necesités. ✨',
      'A la orden, socio. ¿Algo más?'
    ],
    female: [
      '¡Con gusto, amiga! Para eso estoy. 🙌',
      'De nada, bella. Lo que necesités. 💫',
      'A la orden, reina. ¿Algo más?'
    ],
    neutral: [
      '¡Con gusto! Para eso estoy. 🙌',
      'De nada. Lo que necesités. ✨',
      'A la orden. ¿Algo más en que te ayude?'
    ]
  },

  // ── Frustración / empatía ──
  frustration: {
    male:   ['Qué duro, parce. '],
    female: ['Qué intenso, amiga. '],
    neutral: ['Qué intenso. ']
  },

  // ── Motivacionales (adjetivos sueltos para decorar respuestas) ──
  motivacional: {
    male:   ['duro', 'bacán', 'bacano', 'genio', 'crack', 'máquina', 'capo', 'titán'],
    female: ['dura', 'bella', 'crack', 'reina', 'máquina', 'genia', 'capa', 'figura'],
    neutral: ['genio/a', 'crack', 'máquina', 'figura', 'capo/a', 'titán']
  },

  // ── Ánimo colombiano (para expandir respuestas) ──
  animo: {
    male: [
      '¡Así se habla, parce!', '¡Con toda, mi llave!',
      '¡Eso, duro!', '¡Qué bacano!', '¡A romperla!',
      '¡Esa es, hermano!'
    ],
    female: [
      '¡Así se habla, amiga!', '¡Con toda, reina!',
      '¡Eso, dura!', '¡Qué bella!', '¡A romperla!',
      '¡Esa es, hermosa!'
    ],
    neutral: [
      '¡Así se habla!', '¡Con toda!',
      '¡Eso!', '¡Qué bien!', '¡A romperla!',
      '¡Esa es!'
    ]
  }
};

// ─── API PÚBLICA ──────────────────────────────────────────────

/**
 * Obtiene el género del usuario desde localStorage.
 * @returns {'male'|'female'|null}
 */
function _glGetGender() {
  try {
    // Intentar obtener el uid de la sesión actual
    var sess = leer('mt_sess', null);
    var uid = (sess && sess.uid) ? sess.uid : null;
    if (!uid) return null;
    return leer('mt_gender_' + uid, null);
  } catch (_) {
    return null;
  }
}

/**
 * Devuelve el array de opciones para una categoría, según el género.
 * @param {string} category - clave en _GL_VOCAB
 * @returns {string[]}
 */
function _gl(category) {
  var gender = _glGetGender();
  var entry = _GL_VOCAB[category];
  if (!entry) return [];
  if (gender === 'male' && entry.male) return entry.male;
  if (gender === 'female' && entry.female) return entry.female;
  return entry.neutral || entry.male || [];
}

/**
 * Devuelve un elemento aleatorio de la categoría.
 * @param {string} category
 * @returns {string}
 */
function _glPick(category) {
  var opts = _gl(category);
  if (!opts.length) return '';
  return opts[Math.floor(Math.random() * opts.length)];
}

/**
 * Devuelve un término aislado según género.
 * @param {string} term - clave en _GL_VOCAB (ej: 'champion', 'genius')
 * @returns {string}
 */
function _glTerm(term) {
  var gender = _glGetGender();
  var entry = _GL_VOCAB[term];
  if (!entry) return '';
  if (gender === 'male' && entry.male) return entry.male;
  if (gender === 'female' && entry.female) return entry.female;
  return entry.neutral || entry.male || '';
}

/**
 * Reemplaza TTS emoji→palabra según género.
 * Ej: 🏆 → "campeón" o "campeona"
 * @param {string} text
 * @returns {string}
 */
function _glTTS(text) {
  var champ = _glTerm('champion');
  return (text || '')
    .replace(/🏆/g, ' ¡' + champ + '! ')
    .replace(/💪/g, ' ¡' + _glTerm('tough') + '! ');
}

// ─── EXPORT ──────────────────────────────────────────────────
window._GL_VOCAB = _GL_VOCAB;
window._glGetGender = _glGetGender;
window._gl = _gl;
window._glPick = _glPick;
window._glTerm = _glTerm;
window._glTTS = _glTTS;

console.log('[MT] gender-lang.js cargado — lenguaje adaptativo por género ✓');
