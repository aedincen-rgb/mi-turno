// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-enhanced.js (v124)
//  IA potenciada: memoria conversacional, sugerencias proactivas,
//  respuestas enriquecidas con acciones rápidas, personalidad COL.
//  100% offline · complementa ai.js + ai-nlp.js + ai-help.js
// ════════════════════════════════════════════════════════════════

// ─── MEMORIA CONVERSACIONAL ────────────────────────────────────
// Almacena las últimas N interacciones para dar contexto.
var _aiMemory = {
  history: [],
  userState: {},
  maxTurns: 10,
  proactiveCount: 0,
  lastSuggestion: null  // lo que la IA acaba de preguntar al usuario
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

// ¿El usuario está respondiendo a la última sugerencia de la IA?
// Si es así, devuelve el intent que debería ejecutarse.
function aiCheckFollowUp(text) {
  var sug = _aiMemory.lastSuggestion;
  if (!sug) return null;
  var t = (text || '').toLowerCase().trim();
  // Respuestas afirmativas a sugerencias
  var affirm = ['si','sí','dale','bueno','ok','vale','de una','hagale','hágale','mostrame','mostrame','dime','decime','quiero','claro','obvio','porfa','porfi','sisas','va','vamos'];
  for (var i = 0; i < affirm.length; i++) {
    if (t === affirm[i] || t.indexOf(affirm[i]) === 0) {
      var intent = sug.intent;
      _aiMemory.lastSuggestion = null; // consumido
      return intent;
    }
  }
  // Si la respuesta no es afirmativa, limpiar la sugerencia
  if (t.length > 3) _aiMemory.lastSuggestion = null;
  return null;
}

// Limpiar memoria (al resetear chat)
function aiClearMemory() {
  _aiMemory.history = [];
  _aiMemory.userState = {};
  _aiMemory.proactiveCount = 0;
  _aiMemory.lastSuggestion = null;
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
      { label: '📅 ¿Y ayer?', query: '¿Cuánto gané ayer?' },
      { label: '🏆 Mejor día', query: 'Mi mejor día' },
      { label: '⏱ Horas hoy', query: '¿Cuántas horas trabajé hoy?' }
    ],
    'ayer': [
      { label: '📅 ¿Y hoy?', query: '¿Cuánto gané hoy?' },
      { label: '📊 VS mes pasado', query: '¿vs mes pasado?' },
      { label: '🏆 Mejor día', query: 'Mi mejor día' }
    ],
    'proyeccion': [
      { label: '🔮 Simular extra', query: '¿Cuánto si trabajo 4h más?' },
      { label: '📊 Distribución', query: 'Distribución por recargo' },
      { label: '💰 ¿Cuánto falta?', query: '¿Cuánto me falta para llegar al salario base?' }
    ],
    'bienestar': [
      { label: '📅 Próximo descanso', query: '¿Cuándo fue mi último descanso?' },
      { label: '📊 Mi ritmo', query: '¿Cómo voy de ritmo?' },
      { label: '🧘 Consejo', query: '¿Cómo puedo descansar mejor?' }
    ],
    'comparativa_mes': [
      { label: '📅 VS semana pasada', query: '¿vs semana pasada?' },
      { label: '🔮 Proyección', query: 'Proyección al cierre' },
      { label: '📊 Distribución', query: 'Distribución por recargo' }
    ],
    'comparativa_semana': [
      { label: '📅 VS mes pasado', query: '¿vs mes pasado?' },
      { label: '🔮 Proyección', query: 'Proyección al cierre' }
    ],
    'horas_trabajadas': [
      { label: '⏱ Horas extra', query: '¿Cuántas horas extra llevo?' },
      { label: '🌙 Horas nocturnas', query: '¿Cuántas horas nocturnas?' },
      { label: '📊 Distribución', query: 'Distribución por recargo' }
    ],
    'promedio': [
      { label: '💵 Por hora', query: '¿Cuánto gano por hora?' },
      { label: '📊 VS mes pasado', query: '¿vs mes pasado?' }
    ],
    'mejor_dia': [
      { label: '📉 Peor día', query: '¿Cuál fue mi peor día?' },
      { label: '📊 Promedio', query: '¿Cuál es mi promedio diario?' }
    ],
    'racha': [
      { label: '🧘 Descanso', query: '¿Cuánto descanso he tenido?' },
      { label: '📊 Mi ritmo', query: '¿Cómo voy de ritmo?' }
    ],
    'distribucion': [
      { label: '💰 Total ganado', query: '¿Cuánto gané este mes?' },
      { label: '🔮 Proyección', query: 'Proyección al cierre' }
    ],
    'simulacion': [
      { label: '🌙 Solo nocturnas', query: '¿Cuánto ganaría si solo hago nocturnas?' },
      { label: '📅 Un turno más', query: '¿Cuánto si hago 1 turno extra?' },
      { label: '🎯 Meta', query: '¿Cuánto necesito para llegar a 2 millones?' }
    ],
    'festivos': [
      { label: '📅 Próximos', query: '¿Cuáles son los próximos festivos?' },
      { label: '💰 Ya trabajados', query: '¿Cuánto gané en festivos este mes?' }
    ],
    'velocidad': [
      { label: '📊 Promedio', query: '¿Cuál es mi promedio por turno?' },
      { label: '🔮 Simular', query: '¿Cuánto si trabajo 4h más?' }
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
    _aiMemory.lastSuggestion = { intent: proactive.intent, text: proactive.action };
  }

  // Guardar la primera acción como sugerencia activa
  if (actions.length > 0 && !_aiMemory.lastSuggestion) {
    _aiMemory.lastSuggestion = { intent: intent, text: actions[0].label };
  }

  return {
    text: originalText,
    actions: actions.length > 0 ? actions : null
  };
}

// ─── PERSONALIDAD COLOMBIANA ──────────────────────────────────
// Enriquece las respuestas con expresiones más naturales y cálidas.
// Ahora adapta el vocabulario al género del usuario (v173).
// NOTA: gender-lang.js se carga ANTES que este archivo, así que
// _gl() ya está disponible al momento de usar los getters.

function _aiColGreetings() {
  return (typeof _gl === 'function') ? _gl('greetings') : ['parce', 'vecino', 'compadre', 'socio', 'mi llave', 'hermano'];
}
function _aiColEncouragements() {
  return (typeof _gl === 'function') ? _gl('enthusiasm') : ['¡Así se hace!', 'Con toda, parce.', 'Vamos por más.', 'Esa es la actitud.', 'Sin miedo al éxito.', 'Dándole con toda.', 'A fuego, mi llave.'];
}
function _aiColEmpathy() {
  return (typeof _gl === 'function') ? _gl('consolation') : ['Tranqui, todo bien.', 'Así es la vuelta.', 'No pasa nada, socio.', 'Fresco, que vamos bien.', 'Relajado, aquí estoy.'];
}
function _aiColClosings() {
  return (typeof _gl === 'function') ? _gl('followUp') : ['¿Algo más en que te colabore?', '¿Qué más necesitás, parce?', 'Decime si querés que profundice en algo.', 'Aquí sigo por si necesitás otra cosa.'];
}

var _aiColombianismo = {
  get greetings() { return _aiColGreetings(); },
  get encouragements() { return _aiColEncouragements(); },
  get empathy() { return _aiColEmpathy(); },
  get closings() { return _aiColClosings(); }
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

  // Default: siempre agregar algo útil si la respuesta es muy corta
  if (!addon && original.length < 300) {
    var defaults = [
      '\n\n💡 ¿Sabías que podés preguntarme "¿cómo voy vs el mes pasado?" o "¿cuál fue mi mejor día?"? Soy más útil de lo que parezco.',
      '\n\n📊 Tip: En la pestaña Análisis tenés gráficos, KPIs y proyección. Y ahora también botones para compartir por WhatsApp.',
      '\n\n🔮 Probá preguntarme "¿cuánto ganaría si trabajo 4 horas extra?" — te hago la simulación al instante.',
      '\n\n💎 Dato curioso: esta app no envía tus datos a ningún servidor. Todo se procesa acá, en tu dispositivo. 100% privado.',
      '\n\n🧘 La ley colombiana dice que después de 6 días trabajados, tenés derecho a uno de descanso. Es tu derecho, no un favor.'
    ];
    if (c && c.totalMins > 0) {
      defaults.push('\n\n📈 Vas ' + (c.diasTrab || 0) + ' turnos este mes. Cada uno es un ladrillo más en tu pared. ¡Seguí construyendo!');
    }
    addon += defaults[Math.floor(Math.random() * defaults.length)];
  }

  // Cierre colombiano para respuestas extendidas
  if (addon && Math.random() < 0.3) {
    addon += '\n\n' + aiRandomPick(_aiColombianismo.closings);
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
  var expanded = originalResponse;
  try { expanded = _aiExpandir(originalResponse, intent, userContext); } catch (_) {}

  // 2.5. Análisis financiero profundo
  try {
    if (typeof aiInsightFull === 'function') {
      var insightText = aiInsightFull(userContext, intent);
      if (insightText) expanded += insightText;
    }
  } catch (_) {}

  // 2.6. Inteligencia proactiva: alertas y metas
  if (typeof aiProactive === 'function') {
    var proactiveText = aiProactive(userContext, intent);
    if (proactiveText) {
      enriched.text += proactiveText;
    }
  }

  // 3. Enriquecer con acciones rápidas
  var enriched = aiEnrichResponse(expanded, intent, userContext);

  // 4. Logros desbloqueados
  try {
    if (intent === 'total_ganado' || intent === 'hoy' || intent === 'stats' || intent === 'proyeccion') {
      if (typeof aiCheckAchievements === 'function') {
        var achievements = aiCheckAchievements(userContext);
        var formatted = typeof aiFormatAchievements === 'function' ? aiFormatAchievements(achievements) : null;
        if (formatted) enriched.text += formatted;
      }
    }
  } catch (_) {}

  // 4.5. Psicología + Proactivo + Asesor (todos protegidos)
  try { if (typeof aiPsychRespond === 'function') { var pt = aiPsychRespond(userContext, intent); if (pt) enriched.text += pt; } } catch (_) {}
  try { if (typeof aiProactive === 'function') { var prt = aiProactive(userContext, intent); if (prt) enriched.text += prt; } } catch (_) {}
  try {
    if (typeof aiAdvisorRespond === 'function') {
      var at = aiAdvisorRespond(intent, userContext, null);
      if (at && intent !== 'total_ganado' && intent !== 'stats') enriched.text += '\n\n' + at;
    }
  } catch (_) {}

  // 5. Colombianizar
  var mood = { mood: 'neutral' };
  try { mood = typeof aiAnalyzeMood === 'function' ? aiAnalyzeMood(question, userContext) : { mood: 'neutral' }; } catch (_) {}
  try { enriched.text = aiColombianizar(enriched.text, mood.mood); } catch (_) {}

  // 6. Envoltorio de conversación progresiva (niveles 0→3)
  try {
    if (typeof aiConvOrchestrate === 'function') {
      enriched.text = aiConvOrchestrate(enriched.text, intent, userContext);
    }
  } catch (_) {}

  return enriched;
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-enhanced.js cargado — IA potenciada v124');
