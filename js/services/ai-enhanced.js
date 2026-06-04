// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-enhanced.js (v124)
//  IA potenciada: memoria conversacional, sugerencias proactivas,
//  respuestas enriquecidas con acciones rápidas, personalidad COL.
//  100% offline · complementa ai.js + ai-nlp.js + ai-help.js
// ════════════════════════════════════════════════════════════════

// ─── MEMORIA CONVERSACIONAL ────────────────────────────────────
// Almacena las últimas N interacciones para dar contexto.
var _aiMemory = {
  history: [],       // [{role, topic, intent, timestamp}]
  userState: {},     // cache del último contexto del usuario
  maxTurns: 10,      // máximo de turnos recordados
  proactiveCount: 0  // contador de sugerencias proactivas
};

// Registrar una interacción
function aiRemember(role, text, intent, topic, userContext) {
  _aiMemory.history.push({
    role: role,
    text: text.substring(0, 120),
    intent: intent || 'unknown',
    topic: topic || 'general',
    ts: Date.now()
  });
  if (_aiMemory.history.length > _aiMemory.maxTurns) {
    _aiMemory.history.shift();
  }
  // Cachear estado del usuario para sugerencias proactivas
  if (userContext) {
    _aiMemory.userState = userContext;
    _aiMemory.proactiveCount++;
  }
}

// Obtener última interacción
function aiLastInteraction() {
  var h = _aiMemory.history;
  return h.length > 0 ? h[h.length - 1] : null;
}

// ¿El usuario preguntó algo relacionado con este tema antes?
function aiHasContext(topic) {
  for (var i = _aiMemory.history.length - 1; i >= 0; i--) {
    if (_aiMemory.history[i].topic === topic) return true;
  }
  return false;
}

// Limpiar memoria (al resetear chat)
function aiClearMemory() {
  _aiMemory.history = [];
  _aiMemory.userState = {};
  _aiMemory.proactiveCount = 0;
}

// ─── SUGERENCIAS PROACTIVAS ────────────────────────────────────
// Basadas en el estado del usuario, sugiere cosas antes de que pregunte.

function aiProactiveSuggest(userContext) {
  var c = userContext || _aiMemory.userState;
  if (!c || !c.totalMins) return null;

  var suggestions = [];

  // Fatiga / racha larga
  if (c.rachaActual >= 6 && c.rachaActual < 12) {
    suggestions.push({
      text: 'Llevás ' + c.rachaActual + ' días seguidos. ¿Querés que calculemos cuándo te conviene descansar?',
      action: '¿Cuándo descanso?',
      intent: 'bienestar'
    });
  }

  // Buen rendimiento
  if (c.pctSalario >= 80 && c.diasTrab > 5) {
    suggestions.push({
      text: '¡Vas al ' + c.pctSalario.toFixed(0) + '% de tu meta! ¿Querés ver la proyección al cierre del mes?',
      action: 'Proyección',
      intent: 'proyeccion'
    });
  }

  // Muchas horas extra
  if (c.extraMins > c.totalMins * 0.2) {
    suggestions.push({
      text: 'Tenés bastantes horas extra este mes. ¿Querés ver cuánto suman?',
      action: 'Ver horas extra',
      intent: 'horas_trabajadas'
    });
  }

  // Mucho nocturno
  if (c.nocturnasMins > c.totalMins * 0.4) {
    suggestions.push({
      text: 'Casi la mitad de tus horas son nocturnas. ¿Revisamos cuánto te pagan de más por eso?',
      action: 'Ver recargos',
      intent: 'distribucion'
    });
  }

  // Sin turnos hoy (es temprano)
  if (c.turnosHoy === 0 && c.ahora && new Date(c.ahora).getHours() < 10) {
    suggestions.push({
      text: 'Buen día. ¿Arrancamos un turno?',
      action: 'Iniciar turno',
      intent: 'iniciar_turno'
    });
  }

  // Elegir la más relevante (evitar spamear)
  if (suggestions.length > 0 && _aiMemory.proactiveCount % 3 === 0) {
    return suggestions[Math.floor(Math.random() * Math.min(suggestions.length, 2))];
  }

  return null;
}

// ─── RESPUESTAS ENRIQUECIDAS ───────────────────────────────────
// Añade botones de acción rápida a las respuestas.
// Devuelve { text, actions } donde actions es array de {label, query}.

function aiEnrichResponse(originalText, intent, userContext) {
  var actions = [];

  // Seguimiento contextual según el intent
  var followUps = {
    'total_ganado': [
      { label: '📊 VS mes pasado', query: '¿vs mes pasado?' },
      { label: '🔮 Proyección', query: 'Proyección al cierre' },
      { label: '📧 Enviar reporte', query: 'Enviame el reporte por correo' }
    ],
    'hoy': [
      { label: '📅 ¿Y ayer?', query: '¿y ayer?' },
      { label: '🏆 Mejor día', query: 'Mi mejor día' }
    ],
    'proyeccion': [
      { label: '🔮 Simular extra', query: '¿Cuánto si trabajo 4h más?' },
      { label: '📊 Distribución', query: 'Distribución por recargo' }
    ],
    'bienestar': [
      { label: '📅 Próximo descanso', query: '¿Cuándo fue mi último descanso?' },
      { label: '📊 Mi ritmo', query: '¿Cómo voy de ritmo?' }
    ],
    'comparativa_mes': [
      { label: '📅 VS semana pasada', query: '¿vs semana pasada?' },
      { label: '🔮 Proyección', query: 'Proyección al cierre' }
    ],
    'email': [
      { label: '📧 Enviar ahora', query: 'Enviame el reporte' },
      { label: '📝 Redactar correo', query: 'Redactá un correo formal' }
    ]
  };

  if (followUps[intent]) {
    actions = followUps[intent].slice(0, 3);
  }

  // Sugerencia proactiva ocasional
  var proactive = aiProactiveSuggest(userContext);
  if (proactive && actions.length === 0) {
    actions.push({ label: '💡 ' + proactive.action, query: proactive.action });
  }

  return {
    text: originalText,
    actions: actions.length > 0 ? actions : null
  };
}

// ─── PERSONALIDAD COLOMBIANA ──────────────────────────────────
// Enriquece las respuestas con expresiones más naturales y cálidas.

var _aiColombianismo = {
  greetings: ['parce', 'vecino', 'compadre', 'socio', 'mi llave', 'hermano'],
  encouragements: [
    '¡Así se hace!', 'Con toda, parce.', 'Vamos por más.', 'Esa es la actitud.',
    'Sin miedo al éxito.', 'Dándole con toda.', 'A fuego, mi llave.'
  ],
  empathy: [
    'Tranqui, todo bien.', 'Así es la vuelta.', 'No pasa nada, socio.',
    'Fresco, que vamos bien.', 'Relajado, aquí estoy.'
  ],
  closings: [
    '¿Algo más en que te colabore?', '¿Qué más necesitás, parce?',
    'Decime si querés que profundice en algo.', 'Aquí sigo por si necesitás otra cosa.'
  ]
};

function aiRandomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function aiColombianizar(text, mood) {
  // Añadir toque colombiano al final de respuestas largas
  if (text.length > 200 && Math.random() > 0.5) {
    text += '\n\n' + aiRandomPick(_aiColombianismo.closings);
  }
  return text;
}

// ─── API PÚBLICA ──────────────────────────────────────────────
// Wrapper que integra todo: memoria + enriquecimiento + personalidad.

function aiEnhancedRespond(originalResponse, intent, topic, question, userContext) {
  // 1. Registrar en memoria
  aiRemember('user', question, intent, topic, userContext);
  aiRemember('ai', originalResponse.substring(0, 120), intent, topic, userContext);

  // 2. Enriquecer con acciones rápidas
  var enriched = aiEnrichResponse(originalResponse, intent, userContext);

  // 3. Colombianizar
  var mood = typeof aiAnalyzeMood === 'function' ? aiAnalyzeMood(question, userContext) : { mood: 'neutral' };
  enriched.text = aiColombianizar(enriched.text, mood.mood);

  return enriched;
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-enhanced.js cargado — IA potenciada v124');
