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
  lastSuggestion: null, // lo que la IA acaba de preguntar al usuario
  recentCores: [], // núcleos de respuestas recientes (para no repetir textual)
  lastLeadIn: -1 // índice del último gancho de repetición usado (rota)
};

// ─── ANTI-REPETICIÓN ──────────────────────────────────────────
// Normaliza el núcleo de una respuesta para comparar si es idéntica a una
// reciente. Sin esto, preguntar dos veces lo mismo devolvía un copia-pega
// exacto y rompía la sensación de conversación.
function _aiCoreNorm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 220);
}

// Si la respuesta repite una reciente, devuelve un gancho humano variado
// para anteponer. Devuelve '' si es nueva. Registra el núcleo siempre.
function _aiRepeatLeadIn(originalResponse, intent) {
  var core = _aiCoreNorm(originalResponse);
  if (!core || core.length < 40) return '';

  var isRepeat = false;
  for (var i = 0; i < _aiMemory.recentCores.length; i++) {
    if (_aiMemory.recentCores[i] === core) {
      isRepeat = true;
      break;
    }
  }

  // Registrar (ring de 4) antes de decidir, para futuros turnos
  _aiMemory.recentCores.push(core);
  if (_aiMemory.recentCores.length > 4) _aiMemory.recentCores.shift();

  if (!isRepeat) return '';
  if (_AI_CONVERSATIONAL_INTENTS[intent]) return ''; // saludos/gracias repiten natural

  var ganchos = [
    'Te repito lo de recién 😉:',
    'Como te comenté hace un momento:',
    'Sigue igual que antes:',
    'Lo mismo que te dije:'
  ];
  var idx = Math.floor(Math.random() * ganchos.length);
  if (idx === _aiMemory.lastLeadIn) idx = (idx + 1) % ganchos.length;
  _aiMemory.lastLeadIn = idx;
  return ganchos[idx];
}

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

// ─── ÚLTIMOS MENSAJES (persistencia entre sesiones) ───────────
// La sesión anterior guarda sus últimos 3 mensajes en ai-memory.js;
// al arrancar una sesión nueva se siembran acá para que la IA offline
// retome el hilo (follow-ups, aiThink, contexto conversacional).
var _aiMsgSeeded = false;

function aiGetRecentMessages(n) {
  var lim = n || 3;
  var h = _aiMemory.history;
  var out = [];
  for (var i = Math.max(0, h.length - lim); i < h.length; i++) {
    out.push({
      role: h[i].role,
      text: h[i].text,
      intent: h[i].intent,
      topic: h[i].topic,
      ts: h[i].ts
    });
  }
  return out;
}

function aiSeedMessages(msgs) {
  if (_aiMsgSeeded) return;
  _aiMsgSeeded = true;
  if (!msgs || !msgs.length || _aiMemory.history.length > 0) return;
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i];
    if (!m || !m.text) continue;
    _aiMemory.history.push({
      role: m.role || 'user',
      text: String(m.text).substring(0, 120),
      intent: m.intent || 'unknown',
      topic: m.topic || 'general',
      ts: m.ts || 0,
      restored: true
    });
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
  var affirm = [
    'si',
    'sí',
    'dale',
    'bueno',
    'ok',
    'vale',
    'de una',
    'hagale',
    'hágale',
    'mostrame',
    'dime',
    'decime',
    'quiero',
    'claro',
    'obvio',
    'porfa',
    'porfi',
    'sisas',
    'va',
    'vamos'
  ];
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
  _aiMemory.recentCores = [];
  _aiMemory.lastLeadIn = -1;
  // El usuario pidió borrón y cuenta nueva: no resembrar mensajes viejos
  _aiMsgSeeded = true;
  if (typeof aiMemoryResetSession === 'function') aiMemoryResetSession();
  if (typeof aiEngageReset === 'function') aiEngageReset();
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
      text:
        'Llevás ' +
        c.rachaActual +
        ' días seguidos. ¿Querés que calculemos cuándo te conviene descansar?',
      action: '¿Cuándo descanso?',
      intent: 'bienestar'
    });
  }

  // Buen rendimiento
  if (c.pctSalario >= 80 && c.diasTrab > 5) {
    suggestions.push({
      text:
        '¡Vas al ' +
        c.pctSalario.toFixed(0) +
        '% de tu meta! ¿Querés ver la proyección al cierre del mes?',
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

// ─── RESPUESTAS ENRIQUECIDAS Y ACCIONES (AGENTIC AI) ───────────
// Añade botones de acción rápida a las respuestas y permite
// que la IA ejecute acciones en la app (cambiar tabs, iniciar turnos).
// Devuelve { text, actions, execute } donde actions es array de {label, query}
// y execute es un objeto { type, payload } para que la UI lo procese.

function aiEnrichResponse(originalText, intent, userContext, entities, turnosAll, engageStrategy) {
  var actions = [];
  var execute = null;

  // 0. Auditoría Inteligente (Anomaly Detection)
  // Si hay una anomalía grave, la inyectamos al principio de la respuesta
  if (typeof aiAuditShifts === 'function' && turnosAll) {
    var anomaly = aiAuditShifts(userContext, turnosAll);
    if (anomaly && _aiMemory.proactiveCount % 2 === 0) {
      // No spamear siempre
      originalText = anomaly.text + '\n\n---\n\n' + originalText;
      if (anomaly.action) {
        actions.push(anomaly.action);
      }
    }
  }

  // 1. Procesar acciones directas basadas en entidades extraídas
  if (intent === 'configurar_salario' && entities && entities.money) {
    execute = { type: 'SET_SALARY', payload: entities.money };
    originalText =
      '¡Listo! He actualizado tu salario base a ' +
      fCOP(entities.money) +
      '. ¿Quieres que recalcule tu proyección con este nuevo valor?';
    actions.push({ label: 'Sí, recalcular', query: 'proyección' });
  } else if (intent === 'iniciar_turno') {
    execute = { type: 'START_SHIFT' };
    originalText = '¡Turno iniciado! Que te rinda mucho. Te avisaré si llevas muchas horas.';
    actions.push({ label: 'Ver mi turno', query: 'ir a inicio' });
  } else if (intent === 'cerrar_turno') {
    execute = { type: 'END_SHIFT' };
    originalText = 'Turno cerrado correctamente. ¡Buen descanso!';
    actions.push({ label: 'Ver resumen de hoy', query: 'cuanto gané hoy' });
  } else if (intent === 'navegar_ajustes') {
    execute = { type: 'NAVIGATE', payload: 'ajustes' };
    originalText = 'Te llevo a la pantalla de Ajustes.';
  } else if (intent === 'navegar_historial') {
    execute = { type: 'NAVIGATE', payload: 'historial' };
    originalText = 'Abriendo tu historial de turnos.';
  }

  // 2. Seguimiento contextual según el intent (botones sugeridos + pregunta).
  //    aiEngageQuestion devuelve {q, actions} — la pregunta se guarda en
  //    el objeto retornado para que aiEnhancedRespond la agregue al texto
  //    al final, cuando todo el contenido ya está ensamblado.
  var _engageQ = null;
  if (typeof aiEngageQuestion === 'function') {
    var convLevel = typeof aiConvLevel === 'function' ? aiConvLevel() : 0;
    var _eq = aiEngageQuestion(intent, userContext, convLevel, engageStrategy || 'financial');
    actions = _eq.actions;
    _engageQ = _eq.q;
  } else if (typeof aiEngageActions === 'function') {
    var convLevel2 = typeof aiConvLevel === 'function' ? aiConvLevel() : 0;
    actions = aiEngageActions(intent, userContext, convLevel2);
  }
  // Pool legacy de respaldo (si ai-engage.js no está cargado)
  if (!actions || actions.length === 0) {
    var followUps = {
      total_ganado: [
        { label: '📊 VS mes pasado', query: '¿vs mes pasado?' },
        { label: '🔮 Proyección', query: 'Proyección al cierre' },
        { label: '📧 Enviar reporte', query: 'Enviame el reporte por correo' }
      ],
      hoy: [
        { label: '📅 ¿Y ayer?', query: '¿Cuánto gané ayer?' },
        { label: '🏆 Mejor día', query: 'Mi mejor día' }
      ],
      ayer: [
        { label: '📅 ¿Y hoy?', query: '¿Cuánto gané hoy?' },
        { label: '📊 VS mes pasado', query: '¿vs mes pasado?' }
      ],
      proyeccion: [
        { label: '🔮 Simular extra', query: '¿Cuánto si trabajo 4h más?' },
        { label: '📊 Distribución', query: 'Distribución por recargo' }
      ],
      bienestar: [
        { label: '📅 Próximo descanso', query: '¿Cuándo fue mi último descanso?' },
        { label: '📊 Mi ritmo', query: '¿Cómo voy de ritmo?' }
      ],
      comparativa_mes: [
        { label: '📅 VS semana pasada', query: '¿vs semana pasada?' },
        { label: '🔮 Proyección', query: 'Proyección al cierre' }
      ],
      comparativa_semana: [
        { label: '📅 VS mes pasado', query: '¿vs mes pasado?' },
        { label: '🔮 Proyección', query: 'Proyección al cierre' }
      ],
      horas_trabajadas: [
        { label: '⏱ Horas extra', query: '¿Cuántas horas extra llevo?' },
        { label: '🌙 Horas nocturnas', query: '¿Cuántas horas nocturnas?' }
      ],
      promedio: [
        { label: '💵 Por hora', query: '¿Cuánto gano por hora?' },
        { label: '📊 VS mes pasado', query: '¿vs mes pasado?' }
      ],
      mejor_dia: [
        { label: '📉 Peor día', query: '¿Cuál fue mi peor día?' },
        { label: '📊 Promedio', query: '¿Cuál es mi promedio diario?' }
      ],
      racha: [
        { label: '🧘 Descanso', query: '¿Cuánto descanso he tenido?' },
        { label: '📊 Mi ritmo', query: '¿Cómo voy de ritmo?' }
      ],
      distribucion: [
        { label: '💰 Total ganado', query: '¿Cuánto gané este mes?' },
        { label: '🔮 Proyección', query: 'Proyección al cierre' }
      ],
      simulacion: [
        { label: '🌙 Solo nocturnas', query: '¿Cuánto ganaría si solo hago nocturnas?' },
        { label: '📅 Un turno más', query: '¿Cuánto si hago 1 turno extra?' }
      ],
      festivos: [
        { label: '📅 Próximos', query: '¿Cuáles son los próximos festivos?' },
        { label: '💰 Ya trabajados', query: '¿Cuánto gané en festivos este mes?' }
      ],
      velocidad: [
        { label: '📊 Promedio', query: '¿Cuál es mi promedio por turno?' },
        { label: '🔮 Simular', query: '¿Cuánto si trabajo 4h más?' }
      ],
      email: [
        { label: '📧 Enviar ahora', query: 'Enviame el reporte' },
        { label: '📝 Redactar correo', query: 'Redactá un correo formal' }
      ]
    };
    if (followUps[intent]) {
      actions = followUps[intent].slice(0, 2);
    }
  }

  // Sugerencia proactiva ocasional (solo si no hay acciones aún)
  if (!actions || actions.length === 0) {
    var proactive = aiProactiveSuggest(userContext);
    if (proactive) {
      actions = [{ label: '💡 ' + proactive.action, query: proactive.action }];
      _aiMemory.lastSuggestion = { intent: proactive.intent, text: proactive.action };
    }
  }

  // Guardar la primera acción como sugerencia activa
  if (actions && actions.length > 0 && !_aiMemory.lastSuggestion) {
    _aiMemory.lastSuggestion = { intent: intent, text: actions[0].label };
  }

  return {
    text: originalText,
    actions: actions && actions.length > 0 ? actions.slice(0, 2) : null,
    engageQ: _engageQ || null
  };
}

// ─── PERSONALIDAD COLOMBIANA ──────────────────────────────────
// Enriquece las respuestas con expresiones más naturales y cálidas.
// Ahora adapta el vocabulario al género del usuario (v173).
// NOTA: gender-lang.js se carga ANTES que este archivo, así que
// _gl() ya está disponible al momento de usar los getters.

function _aiColGreetings() {
  return typeof _gl === 'function'
    ? _gl('greetings')
    : ['parce', 'vecino', 'compadre', 'socio', 'mi llave', 'hermano'];
}
function _aiColEncouragements() {
  return typeof _gl === 'function'
    ? _gl('enthusiasm')
    : [
        '¡Así se hace!',
        'Con toda, parce.',
        'Vamos por más.',
        'Esa es la actitud.',
        'Sin miedo al éxito.',
        'Dándole con toda.',
        'A fuego, mi llave.'
      ];
}
function _aiColEmpathy() {
  return typeof _gl === 'function'
    ? _gl('consolation')
    : ['Tranqui, todo bien.', 'Así es la vuelta.', 'No pasa nada, socio.', 'Tranquilo, vos podés.'];
}
function _aiColClosings() {
  return typeof _gl === 'function'
    ? _gl('followUp')
    : ['¿Algo más en que te colabore?', '¿Qué más necesitás, parce?', '¿Qué otra cosa te ayudo?'];
}

var _aiColombianismo = {
  get greetings() {
    return _aiColGreetings();
  },
  get encouragements() {
    return _aiColEncouragements();
  },
  get empathy() {
    return _aiColEmpathy();
  },
  get closings() {
    return _aiColClosings();
  }
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
      addon +=
        '\n\n🎯 ¡Estás cerca de tu meta! Al ritmo actual te faltan aproximadamente ' +
        Math.max(1, Math.ceil((100 - c.pctSalario) / (c.pctSalario / Math.max(1, c.diasTrab)))) +
        ' días para alcanzarla.';
    } else if (c.pctSalario < 30 && c.diasTrab > 0) {
      addon +=
        '\n\n💡 Tip: Si metés turnos nocturnos o en festivo, tus ingresos suben más rápido. Un turno nocturno te paga 35% extra — en 8 horas son como 11 horas diurnas.';
    }
    if (c.nocturnasMins < c.totalMins * 0.1 && c.totalMins > 600) {
      addon +=
        '\n\n🌙 Dato curioso: si hacés turnos de noche, cada hora te rinde 35% más. Es como trabajar menos por la misma plata.';
    }
  }

  if (intent === 'proyeccion') {
    if (c.proy && c.salario && c.proy > c.salario * 1.2) {
      addon += '\n\n🔥 Vas a superar tu salario base por mucho. ¡Este mes viene con bonos!';
    }
    addon +=
      '\n\n💡 Recordá: la proyección se basa en tu ritmo actual. Si metés más horas extra o trabajás en festivos, ese número sube. Si descansás, baja. Es un estimado, no una promesa.';
  }

  if (intent === 'bienestar') {
    if (c.rachaActual >= 5) {
      addon +=
        '\n\n🧘 La ley colombiana exige al menos un día de descanso por cada 6 trabajados. Es tu derecho. Usalo sin culpa.';
    }
    addon +=
      '\n\n💤 Dormir bien después de un turno nocturno es clave. Oscuridad total, sin pantallas, 7-8 horas. Tu cuerpo te lo agradece y tu productividad también.';
  }

  if (intent === 'comparativa_mes') {
    addon +=
      '\n\n📈 Cada mes que pasa tenés más datos. Con el tiempo vas a ver patrones — qué días te rinden más, qué semanas son más flojas. Esa info es poder para negociar tus horarios.';
  }

  if (intent === 'ayuda_navegacion' || intent === 'ayuda_app') {
    addon +=
      '\n\n💎 Dato extra: también podés preguntarme cosas como "¿cuánto gané hoy?", "¿cómo voy vs el mes pasado?", o "enviame el reporte por correo". Soy más conversacional de lo que parezco.';
  }

  // Ánimo aleatorio (20% de probabilidad)
  if (Math.random() < 0.2) {
    addon += '\n\n' + aiRandomPick(_aiColombianismo.encouragements);
  }

  // Default: solo agregar si la respuesta es muy corta Y no tiene datos numéricos propios.
  // Evitar inflar respuestas que ya contienen información útil aunque sean breves.
  if (!addon && original.length < 150) {
    var defaults = [
      '\n\n💡 También podés preguntarme "¿vs el mes pasado?" o "¿cuál fue mi mejor día?"',
      '\n\n🔮 Probá "/simular 4h" para calcular escenarios.',
      '\n\n📊 "/stats" te da un resumen rápido en cualquier momento.'
    ];
    addon += defaults[Math.floor(Math.random() * defaults.length)];
  }

  return original + addon;
}

// ─── SNAPSHOT DE MEMORIA SEMÁNTICA ───────────────────────────
// Extrae del historial en RAM los datos necesarios para persistir
// entre sesiones. Llamado por aiMemorySave() en ai-memory.js.

function aiGetMemorySnapshot() {
  var h = _aiMemory.history;
  var recentIntents = [];
  var lastIntent = null;
  var lastTopic = null;
  var i, entry;

  // Recolectar los últimos 5 intents únicos de mensajes de usuario
  for (i = h.length - 1; i >= 0; i--) {
    entry = h[i];
    if (entry.role === 'user' && entry.intent && entry.intent !== 'unknown') {
      var yaEsta = false;
      for (var j = 0; j < recentIntents.length; j++) {
        if (recentIntents[j] === entry.intent) {
          yaEsta = true;
          break;
        }
      }
      if (!yaEsta) recentIntents.push(entry.intent);
      if (recentIntents.length >= 5) break;
    }
  }

  // Último intent y topic no-genérico mirando desde el final
  for (i = h.length - 1; i >= 0; i--) {
    entry = h[i];
    if (!lastIntent && entry.intent && entry.intent !== 'unknown') {
      lastIntent = entry.intent;
    }
    if (!lastTopic && entry.topic && entry.topic !== 'general') {
      lastTopic = entry.topic;
    }
    if (lastIntent && lastTopic) break;
  }

  return {
    recentIntents: recentIntents,
    lastIntent: lastIntent,
    lastTopic: lastTopic,
    pendingSuggestion: _aiMemory.lastSuggestion ? _aiMemory.lastSuggestion.text || null : null,
    lastEarnings:
      _aiMemory.userState && _aiMemory.userState.totalCOP ? _aiMemory.userState.totalCOP : 0,
    streakDays:
      _aiMemory.userState && _aiMemory.userState.rachaActual ? _aiMemory.userState.rachaActual : 0
  };
}

// Inserta intents de sesiones anteriores como entradas sintéticas
// al inicio del historial en RAM, para dar continuidad al pipeline.
function aiRestoreHistory(recentIntents, lastIntent, lastTopic, pendingSuggestion) {
  if (!recentIntents || !recentIntents.length) return;

  // Intents ya cubiertos por mensajes reales restaurados (aiSeedMessages)
  // no necesitan entrada sintética — evita duplicar el hilo.
  var yaCubiertos = {};
  var i;
  for (i = 0; i < _aiMemory.history.length; i++) {
    if (_aiMemory.history[i].restored) yaCubiertos[_aiMemory.history[i].intent] = true;
  }

  var synthetic = [];
  for (i = 0; i < recentIntents.length; i++) {
    if (yaCubiertos[recentIntents[i]]) continue;
    synthetic.push({
      role: 'user',
      text: '[sesión anterior]',
      intent: recentIntents[i],
      topic: recentIntents[i],
      ts: 0
    });
  }

  // Insertar al inicio y recortar si supera maxTurns
  _aiMemory.history = synthetic.concat(_aiMemory.history);
  if (_aiMemory.history.length > _aiMemory.maxTurns) {
    _aiMemory.history = _aiMemory.history.slice(_aiMemory.history.length - _aiMemory.maxTurns);
  }

  if (pendingSuggestion) {
    _aiMemory.lastSuggestion = {
      intent: lastIntent || 'unknown',
      text: pendingSuggestion
    };
  }
}

// ─── RESOLUCIÓN DE REFERENCIAS CONTEXTUALES ──────────────────
// Resuelve elipsis conversacionales como "¿y eso por qué?",
// "¿y la quincena pasada?", "¿y el mes anterior?" apoyándose
// en el historial de intents de la sesión.
// Retorna el intent a despachar o null si no hay contexto.
function aiResolveContextRef(text, convState) {
  var t = (text || '').toLowerCase().trim();
  var lastIntent = (convState && convState.lastIntent) || null;
  var lastTopic = (convState && convState.lastTopic) || null;

  // Patrones de referencia temporal elíptica
  var _refPatterns = [
    { re: /quincena pasada|quincena anterior|quincena que pas/, intent: 'comparativa_mes' },
    { re: /semana pasada|semana anterior|semana que pas/, intent: 'comparativa_semana' },
    { re: /mes pasado|mes anterior|mes que pas/, intent: 'comparativa_mes' },
    { re: /y eso por qu[eé]|por qu[eé] eso|por qu[eé] as[ií]/, intent: null }, // explicación del último intent
    { re: /^y (ayer|anteayer|antier)\??$/, intent: 'ayer' },
    { re: /^y (hoy)\??$/, intent: 'hoy' },
    { re: /^(y )?(la |el )?anterior\??$/, intent: null } // heredar intent anterior
  ];

  for (var i = 0; i < _refPatterns.length; i++) {
    var pat = _refPatterns[i];
    if (pat.re.test(t)) {
      // intent explícito en el patrón → usarlo directamente
      if (pat.intent) return pat.intent;
      // null → heredar el último intent conocido si es financiero
      if (lastIntent && _AI_FINANCIAL_INTENTS[lastIntent]) return lastIntent;
      return null;
    }
  }

  // "¿y eso?" / "¿y esa?" / "¿y ese?" con contexto financiero
  if (/^(y|¿y) eso\??$|^(y|¿y) esa\??$|^(y|¿y) ese\??$/.test(t)) {
    if (lastIntent && _AI_FINANCIAL_INTENTS[lastIntent]) return lastIntent;
  }

  return null;
}

// ─── MÓDULO DE RAZONAMIENTO ───────────────────────────────────
// Decide QUÉ necesita el usuario antes de construir la respuesta.
// Evita correr módulos costosos cuando el intent no lo justifica.

var _AI_FINANCIAL_INTENTS = {
  total_ganado: 1,
  hoy: 1,
  ayer: 1,
  proyeccion: 1,
  stats: 1,
  distribucion: 1,
  liquidacion: 1,
  ahorro: 1,
  comparativa_mes: 1,
  comparativa_semana: 1,
  mejor_dia: 1,
  peor_dia: 1,
  horas_trabajadas: 1,
  promedio: 1,
  velocidad: 1,
  simulacion: 1,
  festivos: 1,
  racha: 1,
  configurar_salario: 1,
  informe_completo: 1
};

// Intents conversacionales: no activan módulos financieros en aiThink
var _AI_CONVERSATIONAL_INTENTS = {
  saludo: 1,
  despedida: 1,
  agradecimiento: 1,
  identidad: 1,
  capacidades: 1,
  celebracion: 1,
  motivacion: 1,
  queja_fatiga: 1,
  estado_animo: 1,
  curiosidad_app: 1,
  reflexion: 1,
  planificacion_semana: 1
};

function aiThink(question, intent, userContext, convHistory) {
  var c = userContext || {};
  var histLen = convHistory ? convHistory.length : 0;

  // ── Contexto situacional enriquecido (buildContext lo provee) ──
  var periodoDelDia = c.periodoDelDia || 'mañana';
  var estadoBienestar = c.estadoBienestar || 'normal';
  var tieneActivo = !!c.tieneActivo;
  var alertaTurnoLargo = !!c.alertaTurnoLargo;
  var alertaNocturnaActivo = !!c.alertaNocturnaActivo;
  var salarioConfigurado = !!c.salarioConfigurado;
  var esFinDeSemana = !!c.esFinDeSemana;
  var esFestivo = !!c.esFestivo;

  var mood = 'neutral';
  try {
    if (typeof aiAnalyzeMood === 'function') {
      mood = (aiAnalyzeMood(question, userContext) || {}).mood || 'neutral';
    }
  } catch (_) {}

  var isFinancial = !!_AI_FINANCIAL_INTENTS[intent];
  var isConversational = !!_AI_CONVERSATIONAL_INTENTS[intent];

  // Estrés: texto + contexto situacional
  var isStressed =
    mood === 'frustrated' ||
    mood === 'sad' ||
    mood === 'stressed' ||
    mood === 'tired' ||
    intent === 'queja_fatiga' ||
    intent === 'bienestar' ||
    estadoBienestar === 'critico' ||
    alertaTurnoLargo;

  var isCelebrating =
    mood === 'happy' ||
    mood === 'excited' ||
    intent === 'celebracion' ||
    intent === 'agradecimiento' ||
    (isFinancial && c.pctSalario >= 100);

  // ── Necesidad primaria ──
  var primaryNeed = 'conversation';
  if (isFinancial) primaryNeed = 'information';
  if (intent === 'reflexion') primaryNeed = 'information';
  if (intent === 'planificacion_semana') primaryNeed = 'information';
  if (isStressed || intent === 'motivacion') primaryNeed = 'support';
  if (isCelebrating) primaryNeed = 'celebration';
  // Turno largo activo → siempre priorizar bienestar
  if (alertaTurnoLargo) primaryNeed = 'support';

  // ── Estilo de respuesta ──
  var responseStyle = 'conversational';
  if (histLen < 3) responseStyle = 'brief';
  if (isFinancial && histLen >= 3) responseStyle = 'detailed';
  if (isStressed || intent === 'motivacion') responseStyle = 'empathetic';
  if (isCelebrating) responseStyle = 'celebratory';

  // ── Estrategia de engagement ──
  var engageStrategy = 'financial';
  if (isStressed || intent === 'motivacion' || alertaTurnoLargo) {
    engageStrategy = 'personal';
  } else if (isCelebrating || intent === 'reflexion') {
    engageStrategy = 'reflexion';
  } else if (intent === 'curiosidad_app' || (isConversational && histLen >= 2)) {
    engageStrategy = 'discovery';
  } else if (!isFinancial && histLen >= 2) {
    engageStrategy = 'discovery';
  } else if (histLen >= 6 && isFinancial) {
    engageStrategy = 'trivia';
  }
  // En madrugada con turno activo → preguntas personales (no financieras)
  if (periodoDelDia === 'madrugada' && tieneActivo) {
    engageStrategy = 'personal';
  }
  // Fin de semana o festivo → reflexión sobre la semana
  if ((esFinDeSemana || esFestivo) && isFinancial && histLen >= 2) {
    engageStrategy = 'reflexion';
  }

  // ── Módulos a saltar ──
  var skipModules = {};
  if (!isFinancial) {
    skipModules.insights = true;
    skipModules.advisor = true;
    skipModules.achievements = true;
  }
  if (isStressed || primaryNeed === 'support') {
    skipModules.proactive = true;
  }
  // Si el usuario no configuró salario, no mostrar análisis de advisor
  if (!salarioConfigurado) {
    skipModules.advisor = true;
  }

  return {
    primaryNeed: primaryNeed,
    responseStyle: responseStyle,
    engageStrategy: engageStrategy,
    skipModules: skipModules,
    mood: mood,
    isFinancial: isFinancial,
    periodoDelDia: periodoDelDia,
    tieneActivo: tieneActivo
  };
}

// ─── DETECTOR DE MODO VERBOSO ────────────────────────────────
// El usuario pide explícitamente una respuesta larga/detallada.
// Solo en ese caso se activan los módulos de expansión completa.

function _aiModoVerboso(question) {
  if (!question) return false;
  var t = question.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  var palabras = [
    'informe',
    'reporte',
    'resumen completo',
    'analisis completo',
    'analisis detallado',
    'detalle',
    'desglose',
    'explicame todo',
    'cuentame mas',
    'cuentame todo',
    'dame todo',
    'quiero saber todo',
    'analiza',
    'analisis',
    'desglosame',
    'en detalle',
    'con detalle',
    'completo',
    'ampliado',
    'profundiza',
    '/informe',
    '/historial'
  ];
  for (var i = 0; i < palabras.length; i++) {
    if (t.indexOf(palabras[i]) >= 0) return true;
  }
  return false;
}

// ─── PASADA AGENTE: INTENT → TOOLS → DATA → REASONING → RESPONSE ──
// Usa las capas modulares ya existentes sin reemplazar la respuesta local.
// La respuesta base sigue siendo el contrato principal; el agente añade
// evidencia, hallazgos y guardas anti-alucinación.

var _AI_AGENTIC_INTENTS = {
  total_ganado: 1,
  hoy: 1,
  ayer: 1,
  proyeccion: 1,
  horas_trabajadas: 1,
  promedio: 1,
  comparativa_mes: 1,
  comparativa_semana: 1,
  mejor_dia: 1,
  peor_dia: 1,
  turno_largo: 1,
  turno_corto: 1,
  racha: 1,
  distribucion: 1,
  velocidad: 1,
  eficiencia: 1,
  stats: 1,
  planificacion_semana: 1,
  bienestar: 1,
  queja_fatiga: 1,
  liquidacion: 1,
  simulacion: 1,
  optimizador: 1,
  ahorro: 1,
  descanso: 1,
  email: 1,
  correo_formal: 1,
  auditoria: 1
};

function _aiShouldRunAgent(intent, question, thought, verbose) {
  if (!intent) return false;
  if (_AI_AGENTIC_INTENTS[intent]) return true;
  if (verbose && thought && thought.isFinancial) return true;
  return false;
}

function _aiAgentSession(ctx) {
  return {
    uid: ctx && ctx.uid ? ctx.uid : null,
    email: ctx && ctx.email ? ctx.email : '',
    user: ctx && ctx.uid ? { id: ctx.uid, email: ctx.email || '' } : null
  };
}

function _aiIsWeakAgentBase(text) {
  var s = String(text || '');
  return (
    s.indexOf('No estoy seguro de qué buscas') >= 0 ||
    s.indexOf('Procesando acción') >= 0 ||
    s.indexOf('necesito tus datos') >= 0 ||
    s.indexOf('No tengo suficiente información') >= 0
  );
}

function _aiCompactAgentEvidence(agentResp, reasoning, bag, baseText) {
  var lines = [];
  var findings = reasoning && reasoning.findings ? reasoning.findings : [];
  var base = String(baseText || '');

  for (var i = 0; i < findings.length && lines.length < 2; i++) {
    var f = findings[i];
    if ((f.priority || 0) < 7) continue;
    if (f.text && base.indexOf(f.text.substring(0, 45)) < 0) {
      lines.push('• ' + f.text);
    }
  }

  var sourceLine = '';
  if (bag && bag.sources) {
    var srcs = [];
    var seen = {};
    for (var k in bag.sources) {
      if (!Object.prototype.hasOwnProperty.call(bag.sources, k)) continue;
      var src = bag.sources[k];
      if (!src || seen[src]) continue;
      seen[src] = true;
      srcs.push(src);
    }
    if (srcs.length) sourceLine = '_Evidencia: ' + srcs.join(', ') + '._';
  }

  if (agentResp && agentResp.confidence < 0.65) {
    lines.push('_Confianza moderada: faltó validar alguna fuente._');
  }
  if (sourceLine) lines.push(sourceLine);

  return lines.join('\n');
}

function _aiRunAgentPass(enriched, intent, question, userContext, verbose, thought) {
  if (
    typeof aiRouteTools !== 'function' ||
    typeof aiCollectData !== 'function' ||
    typeof aiReason !== 'function' ||
    typeof aiGenerateResponse !== 'function'
  ) {
    return enriched;
  }

  if (!_aiShouldRunAgent(intent, question, thought, verbose)) return enriched;

  var ctx = userContext || {};
  var online = typeof navigator !== 'undefined' ? !!navigator.onLine : !!ctx.online;
  var tools = aiRouteTools(intent, ctx, online);
  var session = _aiAgentSession(ctx);
  var convLevel = typeof aiConvLevel === 'function' ? aiConvLevel() : 0;

  return aiCollectData(tools, ctx, session).then(function (bag) {
    var reasoning = aiReason(bag, ctx, _aiMemory.history || []);
    var agentResp = aiGenerateResponse(reasoning, intent, ctx, bag, convLevel);
    var currentText = enriched.text || '';
    var finalText = currentText;

    if (_aiIsWeakAgentBase(currentText) && agentResp && agentResp.text) {
      finalText = agentResp.text;
    } else if (verbose && agentResp && agentResp.hasFindings) {
      finalText += '\n\n' + agentResp.text;
    } else {
      var evidence = _aiCompactAgentEvidence(agentResp, reasoning, bag, currentText);
      if (evidence) finalText += '\n\n' + evidence;
    }

    if (typeof aiValidateResponse === 'function') {
      var validation = aiValidateResponse(finalText, ctx);
      if (validation && !validation.valid) {
        try {
          console.warn('[AI Agent] respuesta con posibles datos no trazados:', validation.warnings);
        } catch (_) {}
        finalText +=
          '\n\n_Nota: verifiqué la respuesta contra tus datos locales; si ves un valor raro, pedime el desglose._';
      }
    }

    if (typeof aiPolishResponse === 'function') finalText = aiPolishResponse(finalText);
    enriched.text = finalText;
    if ((!enriched.actions || !enriched.actions.length) && agentResp && agentResp.actions) {
      enriched.actions = agentResp.actions.slice(0, 2);
    }
    enriched.sources = agentResp ? agentResp.sources : [];
    enriched.confidence = agentResp ? agentResp.confidence : null;
    enriched.agent = {
      tools: tools,
      sourceCount: bag && bag.sources ? Object.keys(bag.sources).length : 0,
      durationMs: bag && bag.meta ? bag.meta.durationMs : 0
    };
    return enriched;
  });
}

// ─── EVIDENCIA DE DATOS ───────────────────────────────────────
// Pie discreto de trazabilidad: qué datos respaldan la respuesta y su
// estado de sincronización. Solo en intents de datos financieros.

var _AI_EVIDENCE_INTENTS = {
  total_ganado: 1,
  hoy: 1,
  ayer: 1,
  proyeccion: 1,
  horas_trabajadas: 1,
  promedio: 1,
  comparativa_mes: 1,
  comparativa_semana: 1,
  distribucion: 1,
  eficiencia: 1,
  stats: 1,
  racha: 1,
  mejor_dia: 1,
  peor_dia: 1
};

function aiSyncStateLabel(uid) {
  try {
    var pend = 0;
    if (typeof leer === 'function' && uid) {
      var colas = leer('mt_sync_queue', {});
      pend = (colas && colas[uid] && colas[uid].length) || 0;
    }
    if (pend > 0) {
      return pend + ' cambio' + (pend === 1 ? '' : 's') + ' por sincronizar';
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'datos locales, sin conexión';
    }
    return 'sincronizado con la nube';
  } catch (_) {
    return '';
  }
}

function _aiEvidenciaDatos(intent, c) {
  if (!_AI_EVIDENCE_INTENTS[intent]) return '';
  if (!c || !c.turnosMes || !c.turnosMes.length) return '';

  var n = c.turnosMes.length;
  var minD = null;
  var maxD = null;
  for (var i = 0; i < n; i++) {
    var d = new Date(c.turnosMes[i].inicio);
    if (isNaN(d.getTime())) continue;
    if (!minD || d < minD) minD = d;
    if (!maxD || d > maxD) maxD = d;
  }
  if (!minD) return '';

  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var rango = minD.getDate() + ' ' + meses[minD.getMonth()];
  if (maxD.toDateString() !== minD.toDateString()) {
    rango += ' – ' + maxD.getDate() + ' ' + meses[maxD.getMonth()];
  }

  var sync = aiSyncStateLabel(c.uid);
  return (
    '\n\n📊 _Basado en ' +
    n +
    ' turno' +
    (n === 1 ? '' : 's') +
    ' (' +
    rango +
    ')' +
    (sync ? ' · ' + sync : '') +
    '_'
  );
}

// ─── API PÚBLICA ──────────────────────────────────────────────
// Pipeline unificado de enriquecimiento con contexto compartido.

function aiEnhancedRespond(
  originalResponse,
  intent,
  topic,
  question,
  userContext,
  entities,
  turnosAll
) {
  // Contexto unificado — todos los módulos reciben lo mismo
  var shared = {
    c: userContext || {},
    intent: intent || '',
    topic: topic || '',
    question: question || '',
    baseResponse: originalResponse || ''
  };

  // Detectar si el usuario pidió una respuesta extensa explícitamente.
  // Solo en ese caso se activan los módulos de expansión (insights, expandir, engage).
  var _verboso = _aiModoVerboso(question);

  // Recuperar los últimos 3 mensajes de la sesión anterior antes de razonar,
  // para que aiThink y los follow-ups vean el hilo completo.
  try {
    if (!_aiMsgSeeded && typeof aiMemoryLoad === 'function' && userContext && userContext.uid) {
      var _memPrev = aiMemoryLoad(userContext.uid);
      if (_memPrev && _memPrev.recentMessages) aiSeedMessages(_memPrev.recentMessages);
    }
  } catch (_) {}

  // Razonamiento previo: determina qué necesita el usuario antes de activar módulos
  var _thought = {};
  try {
    _thought = aiThink(question, intent, userContext, _aiMemory.history) || {};
  } catch (_) {}

  // 0. Memoria persistente entre sesiones — solo en la primera llamada de cada sesión
  var _welcomePrefix = '';
  try {
    if (typeof aiMemoryOnFirstMessage === 'function') {
      var _uid = userContext && userContext.uid ? userContext.uid : null;
      _welcomePrefix = aiMemoryOnFirstMessage(_uid, userContext) || '';
    }
  } catch (_) {}
  try {
    if (_welcomePrefix && typeof aiMemoryRestore === 'function') {
      var _uid2 = userContext && userContext.uid ? userContext.uid : null;
      aiMemoryRestore(_uid2);
    }
  } catch (_) {}

  // 1. Memoria
  try {
    aiRemember('user', question, intent, topic, userContext);
  } catch (_) {}
  try {
    aiRemember('ai', (originalResponse || '').substring(0, 120), intent, topic, userContext);
  } catch (_) {}
  // Memoria episódica: interacciones significativas quedan como episodios
  try {
    if (typeof aiEpisodeFromInteraction === 'function' && userContext && userContext.uid) {
      aiEpisodeFromInteraction(userContext.uid, intent, topic, question, userContext);
    }
  } catch (_) {}

  // 1b. Anti-repetición: si esta respuesta repite una reciente, preparar un
  // gancho humano para anteponer (se aplica al final, sobre el texto base).
  var _repeatLead = '';
  try {
    _repeatLead = _aiRepeatLeadIn(originalResponse, intent) || '';
  } catch (_) {}

  // 2. Análisis financiero — solo en modo verboso y para intents financieros.
  // En modo normal se omite para no sobrecargar la respuesta con bloques de análisis.
  var text = originalResponse;
  try {
    if (
      _verboso &&
      typeof aiInsightFull === 'function' &&
      (!_thought.skipModules || !_thought.skipModules.insights)
    ) {
      var insight = aiInsightFull(userContext, intent);
      if (insight) text += insight;
    }
  } catch (_) {}

  // 3. Enriquecimiento (acciones + follow-ups)
  var enriched = aiEnrichResponse(
    text,
    intent,
    userContext,
    entities,
    turnosAll,
    (_thought && _thought.engageStrategy) || 'financial'
  );
  text = enriched.text;

  // 4. Capa personal: logros + psicología + proactivo + asesor
  try {
    if (!_thought.skipModules || !_thought.skipModules.achievements) {
      if (
        intent === 'total_ganado' ||
        intent === 'hoy' ||
        intent === 'stats' ||
        intent === 'proyeccion'
      ) {
        if (typeof aiCheckAchievements === 'function') {
          var ach =
            typeof aiFormatAchievements === 'function'
              ? aiFormatAchievements(aiCheckAchievements(userContext))
              : null;
          if (ach) text += ach;
        }
      }
    }
  } catch (_) {}

  // psicología: solo para intents con datos o contexto emocional real.
  // Conversacionales puros (agradecimiento, saludo, despedida) no la necesitan.
  var _skipPsych = _AI_CONVERSATIONAL_INTENTS[intent] || false;
  try {
    if (!_skipPsych && typeof aiPsychRespond === 'function') {
      var pt = aiPsychRespond(userContext, intent);
      if (pt) text += pt;
    }
  } catch (_) {}
  try {
    if (
      !_skipPsych &&
      typeof aiProactive === 'function' &&
      (!_thought.skipModules || !_thought.skipModules.proactive)
    ) {
      var prt = aiProactive(userContext, intent);
      if (prt) text += prt;
    }
  } catch (_) {}
  try {
    // Excluir intents que ya tienen respuesta completa en _aiDispatchNLP para evitar duplicar contenido
    var _advisorExcluded = { total_ganado: 1, stats: 1, simulacion: 1, liquidacion: 1, ahorro: 1 };
    if (
      typeof aiAdvisorRespond === 'function' &&
      !_advisorExcluded[intent] &&
      (!_thought.skipModules || !_thought.skipModules.advisor)
    ) {
      var at = aiAdvisorRespond(intent, userContext, null);
      if (at) text += '\n\n' + at;
    }
  } catch (_) {}

  // 4b. Motor de razonamiento — hallazgos de alta prioridad derivados de datos reales.
  // Solo para intents financieros. No duplica análisis de intents con respuesta ya completa.
  try {
    var _reasoningDataIntents = {
      total_ganado: 1,
      proyeccion: 1,
      horas_trabajadas: 1,
      promedio: 1,
      comparativa_mes: 1,
      comparativa_semana: 1,
      distribucion: 1,
      eficiencia: 1,
      stats: 1,
      racha: 1,
      velocidad: 1,
      turno_largo: 1,
      turno_corto: 1,
      mejor_dia: 1,
      peor_dia: 1,
      hoy: 1,
      ayer: 1,
      planificacion_semana: 1
    };
    if (
      typeof aiReason === 'function' &&
      _reasoningDataIntents[intent] &&
      userContext &&
      userContext.totalCOP
    ) {
      var _rBag = {
        collected: {
          getCalc: !!userContext.totalCOP,
          analyzeBreakdown: !!userContext.bd,
          analyzeEfficiency: !!userContext.eficiencia
        }
      };
      var _rResult = aiReason(_rBag, userContext, aiGetRecentMessages(3));
      if (_rResult && _rResult.findings && _rResult.findings.length > 0) {
        var _topFindings = [];
        for (var _fi = 0; _fi < _rResult.findings.length && _topFindings.length < 2; _fi++) {
          if ((_rResult.findings[_fi].priority || 0) >= 7) {
            _topFindings.push(_rResult.findings[_fi]);
          }
        }
        if (_topFindings.length > 0) {
          var _fLines = [];
          for (var _fj = 0; _fj < _topFindings.length; _fj++) {
            _fLines.push(_topFindings[_fj].text);
          }
          text += '\n\n' + _fLines.join(' ');
        }
      }
    }
  } catch (_) {}

  // 4c. Evidencia de datos — trazabilidad profesional de la respuesta
  try {
    if (text && text.indexOf('📊 _') < 0) {
      var _ev = _aiEvidenciaDatos(intent, userContext);
      if (_ev) text += _ev;
    }
  } catch (_) {}

  // 5. Expansión contextual — solo en modo verboso.
  // En modo normal se omite para no agregar tips/ánimo sin que el usuario los pidiera.
  try {
    if (_verboso) {
      text = _aiExpandir(text, intent, userContext);
    }
  } catch (_) {}

  // 5b. Engagement — curiosidades, trivia, pregunta de seguimiento.
  //     La pregunta de seguimiento (engageQ) se muestra siempre — es corta y útil.
  //     Curiosidad y trivia solo en modo verboso para no sobrecargar respuestas normales.
  var _triviaOptions = null;
  try {
    // Curiosidad ocasional — solo modo verboso
    if (
      _verboso &&
      typeof aiEngageCuriosidad === 'function' &&
      text &&
      text.length < 350 &&
      Math.random() < 0.25
    ) {
      text = aiEngageCuriosidad(text);
    }
    // Trivia como widget interactivo — solo modo verboso
    if (
      _verboso &&
      typeof aiEngageTrivia === 'function' &&
      text &&
      _aiMemory.history &&
      _aiMemory.history.length >= 4 &&
      Math.random() < 0.2
    ) {
      var _triviaResult = aiEngageTrivia(text);
      if (_triviaResult && _triviaResult.triviaOptions) {
        _triviaOptions = _triviaResult.triviaOptions;
      }
    }
    // Pregunta de seguimiento al final — solo para intents con datos.
    // Los intents conversacionales (agradecimiento, saludo, despedida) no necesitan follow-up.
    if (enriched.engageQ && !_AI_CONVERSATIONAL_INTENTS[intent]) {
      text += '\n\n' + enriched.engageQ;
    }
  } catch (_) {}

  // 6. Pulido final: personalidad + conversación.
  // aiColombianizar y aiConvOrchestrate (que agrega ganchos/tips) solo en modo verboso.
  // En modo normal se avanza el nivel conversacional pero no se agrega texto extra.
  var mood = { mood: 'neutral' };
  try {
    mood =
      typeof aiAnalyzeMood === 'function'
        ? aiAnalyzeMood(question, userContext)
        : { mood: 'neutral' };
  } catch (_) {}
  try {
    if (_verboso) text = aiColombianizar(text, mood.mood);
  } catch (_) {}
  try {
    if (_verboso && typeof aiConvOrchestrate === 'function')
      text = aiConvOrchestrate(text, intent, userContext);
    else if (!_verboso && typeof aiConvAdvance === 'function') aiConvAdvance(intent);
  } catch (_) {}
  // aiConvNextStep: sugerencia contextual inteligente → agrega a las acciones rápidas
  try {
    if (typeof aiConvNextStep === 'function') {
      var ns = aiConvNextStep(intent, userContext || {});
      if (ns) {
        if (!enriched.actions) enriched.actions = [];
        if (enriched.actions.length < 3)
          enriched.actions.push({ label: ns.label, query: ns.query });
      }
    }
  } catch (_) {}

  // Anteponer gancho de repetición si la respuesta era idéntica a una reciente
  if (_repeatLead) text = _repeatLead + '\n\n' + text;

  // Anteponer bienvenida de vuelta si la hay
  if (_welcomePrefix) text = _welcomePrefix + '\n\n' + text;

  // Persistir memoria semántica después de cada respuesta
  try {
    if (typeof aiMemorySave === 'function' && userContext && userContext.uid) {
      aiMemorySave(userContext.uid);
    }
  } catch (_) {}

  enriched.text = text;
  if (_triviaOptions) enriched.triviaOptions = _triviaOptions;
  return _aiRunAgentPass(enriched, intent, question, userContext, _verboso, _thought);
}

// ─── HUMANIZADOR LÉXICO (pulido final de la voz) ──────────────
// Dos objetivos: (a) calibrar el tono para que sea cálido pero no
// empalagoso (colapsa signos repetidos e intensificadores apilados) y
// (b) rotar palabras de ánimo sobreusadas por sinónimos, evitando
// repetir la misma elección dos veces seguidas. Protege montos ($),
// dígitos y negritas (**...**): NUNCA toca datos ni términos legales.
var _aiHumLast = {}; // base → último índice usado (rotación sin repetir)

var _AI_HUM_SYN = {
  genial: ['buenísimo', 'de una', 'bien ahí', 'joya'],
  perfecto: ['listo', 'de una', 'hecho', 'vamos bien'],
  excelente: ['muy bien', 'buen trabajo', 'de lujo'],
  increible: ['tremendo', 'buenísimo', 'impresionante'],
  buenisimo: ['genial', 'tremendo', 'de lujo'],
  obvio: ['claro', 'por supuesto', 'dale'],
  ademas: ['también', 'y de paso', 'sumado a eso'],
  igualmente: ['lo mismo', 'también'],
  asombroso: ['tremendo', 'buenísimo']
};

function _aiHumNorm(w) {
  var s = w.toLowerCase();
  try {
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch (_) {}
  return s;
}

function _aiHumPick(base) {
  var opts = _AI_HUM_SYN[base];
  if (!opts || !opts.length) return null;
  var last = typeof _aiHumLast[base] === 'number' ? _aiHumLast[base] : -1;
  var idx = Math.floor(Math.random() * opts.length);
  if (idx === last && opts.length > 1) idx = (idx + 1) % opts.length;
  _aiHumLast[base] = idx;
  return opts[idx];
}

function aiHumanizar(text) {
  if (!text || typeof text !== 'string') return text;

  // (a) Calibrar tono: nada de "!!!", "¡¡¡", "muy muy", "super super".
  var out = text
    .replace(/!{2,}/g, '!')
    .replace(/¡{2,}/g, '¡')
    .replace(/\?{2,}/g, '?')
    .replace(/\b(muy)\s+\1\b/gi, '$1')
    .replace(/\b(super)\s+\1\b/gi, '$1');

  // (b) Rotación de sinónimos protegiendo datos. Enmascaramos en UNA
  // sola pasada negritas, montos y números para no re-enmascarar los
  // dígitos del propio placeholder.
  var masks = [];
  out = out.replace(/(\*\*[^*]+\*\*|\$[\d.,]+|\b\d[\d.,:%hms]*\b)/g, function (m) {
    masks.push(m);
    return '' + (masks.length - 1) + '';
  });

  var usadas = {};
  out = out.replace(/[A-Za-zÁÉÍÓÚáéíóúÑñ]+/g, function (w) {
    var base = _aiHumNorm(w);
    if (!_AI_HUM_SYN[base] || usadas[base]) return w;
    var rep = _aiHumPick(base);
    if (!rep) return w;
    usadas[base] = true;
    if (w.charAt(0) === w.charAt(0).toUpperCase()) {
      rep = rep.charAt(0).toUpperCase() + rep.slice(1);
    }
    return rep;
  });

  // Restaurar lo enmascarado
  out = out.replace(/(\d+)/g, function (_m, i) {
    return masks[parseInt(i, 10)];
  });

  return out;
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
window.aiHumanizar = aiHumanizar;
window.aiThink = aiThink;
window.aiResolveContextRef = aiResolveContextRef;
console.log('[MT] ai-enhanced.js cargado — IA potenciada v124');
