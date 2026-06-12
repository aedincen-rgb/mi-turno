// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-conversation.js
//  Sistema de conversación progresiva — la IA aprende a llevar
//  al usuario paso a paso, sin abrumar, generando empatía.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── NIVELES DE PROFUNDIDAD ───────────────────────────────────
var _aiConvLevel = { value: 0, lastIntent: null, seenFeatures: {} };

/**
 * Determina el nivel de profundidad de la conversación.
 * 0 = primer contacto (solo básico)
 * 1 = explorando (tips y sugerencias)
 * 2 = profundizando (análisis detallados)
 * 3 = avanzado (todo disponible)
 */
function aiConvLevel() {
  return _aiConvLevel.value;
}

function aiConvAdvance(intent) {
  if (_aiConvLevel.value < 3) _aiConvLevel.value++;
  _aiConvLevel.lastIntent = intent;
}

function aiConvMarkSeen(feature) {
  _aiConvLevel.seenFeatures[feature] = true;
}

function aiConvHasSeen(feature) {
  return !!_aiConvLevel.seenFeatures[feature];
}

function aiConvReset() {
  _aiConvLevel.value = 0;
  _aiConvLevel.lastIntent = null;
  _aiConvLevel.seenFeatures = {};
}

function aiConvGetState() {
  return {
    level: _aiConvLevel.value,
    seenFeatures: _aiConvLevel.seenFeatures,
    lastIntent: _aiConvLevel.lastIntent
  };
}

function aiConvRestore(level, seenFeatures) {
  _aiConvLevel.value = typeof level === 'number' && level >= 0 && level <= 3 ? level : 0;
  if (seenFeatures && typeof seenFeatures === 'object') {
    var keys = Object.keys(seenFeatures);
    for (var i = 0; i < keys.length; i++) {
      _aiConvLevel.seenFeatures[keys[i]] = seenFeatures[keys[i]];
    }
  }
}

// ─── ENVOLTORIO PROGRESIVO ────────────────────────────────────

/**
 * Envuelve la respuesta según el nivel de conversación.
 * Nivel 0: solo lo básico + una sugerencia sutil
 * Nivel 1: respuesta + un tip + una pregunta abierta
 * Nivel 2: respuesta completa + 2 opciones de profundización
 * Nivel 3: todo disponible
 */
function aiConvWrap(text, intent, c) {
  var level = aiConvLevel();
  var nm =
    typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: { uid: null } }) : '';
  var nombre = nm || '';

  // Primer contacto: solo agregar gancho si la respuesta es corta (< 200 chars).
  // Respuestas largas ya tienen su propio cierre.
  if (level === 0) {
    if (text.length >= 200) return text;
    var ganchos = [
      '\n\n¿Querés profundizar en algo?',
      '\n\nDecime si necesitás más detalle.',
      '\n\n¿Algo más?'
    ];
    return text + ganchos[Math.floor(Math.random() * ganchos.length)];
  }

  // Nivel 1: añadir un tip práctico
  if (level === 1) {
    var tips = _aiConvTips(c);
    if (tips) {
      text += '\n\n' + tips;
    }
    // Si no ha visto simulaciones, sugerir
    if (!aiConvHasSeen('simulacion') && c.vh > 0) {
      text +=
        '\n\n🔮 ' +
        (nombre ? nombre + ', ' : '') +
        '¿probaste decir "simular 4h nocturnas"? Te muestra escenarios hipotéticos.';
      aiConvMarkSeen('simulacion');
    }
    return text;
  }

  // Nivel 2: respuesta completa con opciones
  if (level === 2) {
    // Sugerir profundizar
    var opciones = [];
    if (!aiConvHasSeen('historico') && c.diasTrab > 0) {
      opciones.push('📈 ¿Querés ver tu análisis histórico de todos los meses?');
      aiConvMarkSeen('historico');
    }
    if (!aiConvHasSeen('informe') && c.diasTrab > 3) {
      opciones.push('📊 ¿Te gustaría un informe financiero completo con /informe?');
      aiConvMarkSeen('informe');
    }
    if (opciones.length > 0) {
      text += '\n\n' + opciones.join('\n');
    }
    return text;
  }

  // Nivel 3+: todo disponible, respuesta completa sin restricciones
  return text;
}

// ─── TIPS POR NIVEL ───────────────────────────────────────────

function _aiConvTips(c) {
  if (!c) return null;
  var tips = [];

  if (c.vh > 0 && !aiConvHasSeen('nocturno')) {
    tips.push(
      '🌙 Tip rápido: si trabajás de noche (9pm-6am), cada hora vale 35% más. Un turno nocturno de 8h te paga como 10.8h diurnas.'
    );
    aiConvMarkSeen('nocturno');
  }
  if (c.salario > 0 && c.salario <= SMIN * 2 && !aiConvHasSeen('auxilio')) {
    tips.push(
      '🚌 ¿Sabías que tenés derecho a auxilio de transporte? Activá la opción en Ajustes y sumalo a tus ingresos.'
    );
    aiConvMarkSeen('auxilio');
  }
  if (!aiConvHasSeen('comandos')) {
    tips.push(
      '⌨️ Probá comandos como /stats, /tendencia o /logros para info rápida sin escribir mucho.'
    );
    aiConvMarkSeen('comandos');
  }

  return tips.length > 0 ? '💡 ' + tips[Math.floor(Math.random() * tips.length)] : null;
}

// ─── RECONOCIMIENTO DE USUARIO FRECUENTE ──────────────────────

/**
 * Si el usuario ya ha conversado antes, darle la bienvenida personalizada.
 */
function aiConvWelcomeBack() {
  if (_aiConvLevel.value > 0) {
    var nm =
      typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: { uid: null } }) : '';
    var regresos = [
      '¡Qué bueno verte de nuevo' + (nm ? ', ' + nm : '') + '!',
      'Acá estoy' + (nm ? ', ' + nm : '') + '. ¿En qué te ayudo hoy?',
      'Bienvenido de vuelta' + (nm ? ', ' + nm : '') + '. Tus números te están esperando.'
    ];
    return regresos[Math.floor(Math.random() * regresos.length)];
  }
  return null;
}

// ─── SUGERENCIAS INTELIGENTES ─────────────────────────────────

/**
 * Sugiere el siguiente paso lógico basado en el intent actual.
 */
function aiConvNextStep(intent, c) {
  var steps = {
    total_ganado: [
      { label: 'Comparar con mes pasado', query: '¿VS mes pasado?' },
      { label: 'Ver simulación', query: '/simular 4h' }
    ],
    hoy: [
      { label: '¿Y ayer?', query: '¿Cuánto gané ayer?' },
      { label: 'Ver tendencia', query: '/tendencia' }
    ],
    proyeccion: [
      { label: 'Meta personalizada', query: '/meta ' + Math.round((c.salario || SMIN) * 1.5) },
      { label: 'Informe completo', query: '/informe' }
    ]
  };

  var opts = steps[intent];
  if (!opts || !opts.length) return null;
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── ORQUESTADOR ──────────────────────────────────────────────

/**
 * Envuelve la respuesta final con la estrategia de conversación.
 */
function aiConvOrchestrate(text, intent, c) {
  if (!text) return text;

  // Avanzar el nivel
  aiConvAdvance(intent);

  // Aplicar envoltorio progresivo
  var wrapped = aiConvWrap(text, intent, c);

  return wrapped;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiConvLevel = aiConvLevel;
window.aiConvAdvance = aiConvAdvance;
window.aiConvMarkSeen = aiConvMarkSeen;
window.aiConvHasSeen = aiConvHasSeen;
window.aiConvReset = aiConvReset;
window.aiConvWrap = aiConvWrap;
window.aiConvWelcomeBack = aiConvWelcomeBack;
window.aiConvNextStep = aiConvNextStep;
window.aiConvOrchestrate = aiConvOrchestrate;
window.aiConvGetState = aiConvGetState;
window.aiConvRestore = aiConvRestore;

console.log('[MT] ai-conversation.js cargado — conversación progresiva ✓');
