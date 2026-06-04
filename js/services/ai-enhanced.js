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

// ─── EXPANSOR DE RESPUESTAS ───────────────────────────────────
// Añade contexto, tips y ánimo sin modificar la respuesta base.
// Solo agrega contenido — nunca quita.

function _aiExpandir(original, intent, userContext) {
  var c = userContext || {};
  var addon = '';

  // Contexto adicional según el intent
  if (intent === 'total_ganado' || intent === 'stats') {
    if (c.pctSalario >= 80) {
      addon += '\n\n🎯 ¡Estás cerca de tu meta! Al ritmo actual te faltan aproximadamente ' + Math.max(1, Math.ceil((100 - c.pctSalario) / (c.pctSalario / Math.max(1, c.diasTrab)))) + ' días para alcanzarla.';
    } else if (c.pctSalario < 30 && c.diasTrab > 0) {
      addon += '\n\n💡 Tip: Si metés turnos nocturnos o en festivo, tus ingresos suben más rápido. Un turno nocturno te paga 35% extra — en 8 horas son como 11 horas diurnas.';
    }
    if (c.nocturnasMins < c.totalMins * 0.1 && c.totalMins > 600) {
      addon += '\n\n🌙 Dato curioso: si hacés turnos de noche, cada hora te rinde 35% más. Es como trabajar menos por la misma plata.';
    }
  }

  if (intent === 'proyeccion') {
    if (c.proy && c.salario && c.proy > c.salario * 1.2) {
      addon += '\n\n🔥 Vas a superar tu salario base por mucho. ¡Este mes viene con bonos!';
    }
    addon += '\n\n💡 Recordá: la proyección se basa en tu ritmo actual. Si metés más horas extra o trabajás en festivos, ese número sube. Si descansás, baja. Es un estimado, no una promesa.';
  }

  if (intent === 'bienestar') {
    if (c.rachaActual >= 5) {
      addon += '\n\n🧘 La ley colombiana exige al menos un día de descanso por cada 6 trabajados. Es tu derecho. Usalo sin culpa.';
    }
    addon += '\n\n💤 Dormir bien después de un turno nocturno es clave. Oscuridad total, sin pantallas, 7-8 horas. Tu cuerpo te lo agradece y tu productividad también.';
  }

  if (intent === 'comparativa_mes') {
    addon += '\n\n📈 Cada mes que pasa tenés más datos. Con el tiempo vas a ver patrones — qué días te rinden más, qué semanas son más flojas. Esa info es poder para negociar tus horarios.';
  }

  if (intent === 'ayuda_navegacion' || intent === 'ayuda_app') {
    addon += '\n\n💎 Dato extra: también podés preguntarme cosas como "¿cuánto gané hoy?", "¿cómo voy vs el mes pasado?", o "enviame el reporte por correo". Soy más conversacional de lo que parezco.';
  }

  // Ánimo aleatorio (20% de probabilidad)
  if (Math.random() < 0.2) {
    addon += '\n\n' + aiRandomPick(_aiColombianismo.encouragements);
  }

  return original + addon;
}

// ─── API PÚBLICA ──────────────────────────────────────────────
// Wrapper que integra todo: memoria + enriquecimiento + personalidad.

function aiEnhancedRespond(originalResponse, intent, topic, question, userContext) {
  // 1. Registrar en memoria
  aiRemember('user', question, intent, topic, userContext);
  aiRemember('ai', originalResponse.substring(0, 120), intent, topic, userContext);

  // 2. Expandir respuesta con más contexto y tips
  var expanded = _aiExpandir(originalResponse, intent, userContext);

  // 3. Enriquecer con acciones rápidas
  var enriched = aiEnrichResponse(expanded, intent, userContext);

  // 4. Colombianizar
  var mood = typeof aiAnalyzeMood === 'function' ? aiAnalyzeMood(question, userContext) : { mood: 'neutral' };
  enriched.text = aiColombianizar(enriched.text, mood.mood);

  return enriched;
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-enhanced.js cargado — IA potenciada v124');
