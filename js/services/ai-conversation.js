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
  // Motor de continuidad (v334): reiniciar turno y anti-repetición.
  if (typeof _aiNextState !== 'undefined' && _aiNextState) {
    _aiNextState.turn = 0;
    _aiNextState.recent = [];
  }
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
      '🌙 Tip rápido: si trabajás de noche (' +
        (getInicioNocturno(c.ahora || new Date()) === 19 ? '7pm' : '9pm') +
        '-6am), cada hora vale 35% más. Un turno nocturno de 8h te paga como 10.8h diurnas.'
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

// ─── MOTOR DE CONTINUIDAD (v334) ──────────────────────────────
// Estrategia explore/exploit sobre los chips, para que el chat no muera ni
// sature. Cada turno (equilibrado) ofrece 1 chip que PROFUNDIZA el tema actual
// + 1 que ABRE un tema que el usuario NO vio aún (cobertura, vía aiConvHasSeen)
// → reacción en cadena que recorre TODO el inventario. Anti-repetición (ring de
// 4) + dosificación (1 solo chip cada ~4 turnos para dejar respirar). Los chips
// de ABRIR son exploratorios: NO se registran como oferta afirmable (protege el
// fix v328: un "dale" suelto no debe disparar un tema que nadie pidió).
// Catálogo de temas para "abrir". `rel(c)` = relevancia al estado (negativo =
// no aplica). `feat` = clave de cobertura (aiConvHasSeen/MarkSeen).
var _AI_NEXT_CATALOG = [
  {
    feat: 'nx_configurar',
    label: '⚙️ Configurar salario',
    query: 'quiero configurar mi salario',
    rel: function (c) {
      return !c.vh ? 9 : -1;
    }
  },
  {
    feat: 'nx_verificar',
    label: '⚖️ ¿Me pagan bien?',
    query: 'me están pagando bien',
    rel: function (c) {
      return c.vh && (c.festMins > 0 || c.nocturnasMins > 0) ? 6 : c.vh ? 2 : -1;
    }
  },
  {
    feat: 'nx_explicar',
    label: '🧮 ¿Cómo lo calculaste?',
    query: '¿cómo lo calculaste?',
    rel: function (c) {
      return c.totalCOP > 0 ? 4 : -1;
    }
  },
  {
    feat: 'nx_proyeccion',
    label: '🔮 Proyección al cierre',
    query: 'cuánto voy a ganar este mes',
    rel: function (c) {
      return c.totalCOP > 0 ? 3 : -1;
    }
  },
  {
    feat: 'nx_comparar',
    label: '📊 VS mes pasado',
    query: '¿vs mes pasado?',
    rel: function (c) {
      return c.totalCOPMesPasado > 0 ? 3 : 1;
    }
  },
  {
    feat: 'nx_liquidacion',
    label: '💰 Mi liquidación',
    query: 'calculá mi liquidación',
    rel: function (c) {
      return c.vh ? 2 : -1;
    }
  },
  {
    feat: 'nx_simular',
    label: '🔮 Simular un festivo',
    query: 'simular 8h festivas',
    rel: function (c) {
      return c.vh ? 2 : -1;
    }
  },
  {
    feat: 'nx_optimizar',
    label: '📈 ¿Qué turno me rinde?',
    query: 'qué turno me conviene',
    rel: function (c) {
      return c.vh ? 2 : 1;
    }
  },
  {
    feat: 'nx_ahorro',
    label: '🎯 Repartir mi sueldo',
    query: 'cómo reparto mi sueldo',
    rel: function (c) {
      return c.vh ? 1 : -1;
    }
  },
  {
    feat: 'nx_fiscal',
    label: '📋 ¿Declaro renta?',
    query: 'tengo que declarar renta',
    rel: function () {
      return 1;
    }
  },
  {
    feat: 'nx_festivos',
    label: '📅 Próximos festivos',
    query: 'próximos festivos',
    rel: function () {
      return 1;
    }
  },
  {
    feat: 'nx_recargos',
    label: '📖 Tabla de recargos',
    query: 'cuál es la tabla de recargos',
    rel: function () {
      return 1;
    }
  }
];

var _aiNextState = { turn: 0, recent: [] };

function _aiNextRecentHas(q) {
  return !!q && _aiNextState.recent.indexOf(q.toLowerCase()) >= 0;
}
function _aiNextRemember(q) {
  if (!q) return;
  _aiNextState.recent.push(q.toLowerCase());
  while (_aiNextState.recent.length > 4) _aiNextState.recent.shift();
}

// Devuelve { actions, openOnly } o null. `baseActions` = los chips de
// profundización ya calculados (engage/followUps); de ahí sale el "profundizar".
function aiNextChips(intent, c, baseActions) {
  c = c || {};
  // El saludo trae sus propios chips de onboarding (v322): no lo tocamos.
  if (intent === 'saludo') return null;
  _aiNextState.turn++;
  var breathe = _aiNextState.turn % 4 === 0; // equilibrado: respiro cada 4 turnos

  // PROFUNDIZAR: primer chip base que no se haya ofrecido hace poco.
  var deepen = null;
  if (baseActions && baseActions.length) {
    for (var i = 0; i < baseActions.length; i++) {
      if (baseActions[i] && baseActions[i].query && !_aiNextRecentHas(baseActions[i].query)) {
        deepen = baseActions[i];
        break;
      }
    }
  }

  // ABRIR: tema con mayor relevancia; lo NO visto puntúa muy por encima de lo
  // visto (cobertura), pero lo visto sigue disponible para que nunca muera.
  var pool = [];
  for (var j = 0; j < _AI_NEXT_CATALOG.length; j++) {
    var t = _AI_NEXT_CATALOG[j];
    var rel = t.rel(c);
    if (rel < 0) continue;
    if (_aiNextRecentHas(t.query)) continue;
    if (deepen && deepen.query && deepen.query.toLowerCase() === t.query.toLowerCase()) continue;
    var seen = typeof aiConvHasSeen === 'function' && aiConvHasSeen(t.feat);
    pool.push({
      feat: t.feat,
      chip: { label: t.label, query: t.query },
      score: rel + (seen ? 0 : 100)
    });
  }
  pool.sort(function (a, b) {
    return b.score - a.score;
  });
  var openEntry = pool.length ? pool[0] : null;
  var open = openEntry ? openEntry.chip : null;

  var out = [];
  if (breathe) {
    // turno de respiro: 1 solo chip; preferí ABRIR para no estancar la cobertura.
    if (open) out.push(open);
    else if (deepen) out.push(deepen);
  } else {
    if (deepen) out.push(deepen);
    if (open) out.push(open);
  }
  if (!out.length) return null;

  if (open && out.indexOf(open) >= 0 && openEntry && typeof aiConvMarkSeen === 'function') {
    aiConvMarkSeen(openEntry.feat); // tachar cobertura
  }
  for (var k = 0; k < out.length; k++) _aiNextRemember(out[k].query);

  // Si el primer chip es de ABRIR, es exploratorio → no registrar como oferta.
  var openOnly = !!(open && out[0] === open);
  return { actions: out, openOnly: openOnly };
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiNextChips = aiNextChips;
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
