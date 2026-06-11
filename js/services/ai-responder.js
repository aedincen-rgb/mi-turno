// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-responder.js
//  Capa 5: Response Generator — Construye respuestas claras,
//  útiles y fundamentadas a partir de los hallazgos del Reasoning.
//  Nunca repite. Nunca alucina. Siempre cita la fuente.
//  100% offline · ES5 · sin dependencias externas.
//
//  Responsabilidades:
//    · Construir respuesta principal a partir de hallazgos
//    · Formatear con emojis y estructura clara
//    · Agregar acciones rápidas relevantes
//    · Incluir preguntas de seguimiento contextuales
//    · Adaptar tono según nivel conversacional del usuario
//    · Evitar repeticiones (cache de última respuesta)
//    · Detectar y prevenir alucinaciones
// ════════════════════════════════════════════════════════════════

// ─── CACHÉ ANTI-REPETICIÓN ────────────────────────────────────
var _aiLastResponse = {
  text: '',
  intent: '',
  ts: 0
};

// ─── GENERADOR PRINCIPAL ──────────────────────────────────────

/**
 * Genera la respuesta final a partir de los hallazgos del Reasoning Engine.
 *
 * @param {object} reasoningResult - Resultado de aiReason()
 * @param {string} intent - Intención clasificada
 * @param {object} ctx - Contexto del usuario
 * @param {object} bag - DataBag del Collector
 * @param {number} convLevel - Nivel conversacional (0-3)
 * @returns {object} { text: string, actions: Array, followUp: string, sources: Array }
 */
function aiGenerateResponse(reasoningResult, intent, ctx, bag, convLevel) {
  var findings = reasoningResult.findings || [];
  var summary = reasoningResult.summary || '';
  var confidence = reasoningResult.confidence || 0.85;

  var text = '';
  var actions = [];
  var followUp = '';
  var sources = [];

  // 1. Encabezado con resumen ejecutivo (si hay hallazgos)
  if (findings.length > 0 && summary) {
    text += summary + '\n\n';
  }

  // 2. Desarrollar cada hallazgo
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    var typeInfo = AI_FINDING_TYPES[f.type] || AI_FINDING_TYPES.INSIGHT;
    text += typeInfo.icon + ' **' + typeInfo.label + ':** ' + f.text + '\n';
    if (f.source) {
      sources.push(f.source);
    }
    // Separar hallazgos con línea si hay varios
    if (i < findings.length - 1 && findings.length > 2) {
      text += '\n';
    }
  }

  // 3. Si no hay hallazgos, generar respuesta basada en intent
  if (findings.length === 0) {
    text = _aiGenerateIntentResponse(intent, ctx, bag);
  }

  // 4. Agregar nota de confianza si es baja
  if (confidence < 0.6) {
    text +=
      '\n\n_ℹ️ Esta respuesta tiene baja confianza. Si algo no cuadra, preguntame de otra forma._';
  }

  // 5. Agregar nota de offline si aplica
  if (!(typeof navigator !== 'undefined' && navigator.onLine)) {
    text +=
      '\n\n📡 _Sin conexión. Datos basados en caché local. Podrían no reflejar cambios recientes._';
  }

  // 5b. Evidencia usada. Mantenerlo corto para no convertir cada respuesta
  // en un informe, pero dejar trazabilidad cuando el agente consultó fuentes.
  var evidence = _aiBuildEvidenceLine(bag);
  if (evidence) {
    text += '\n\n' + evidence;
  }

  // 6. Generar acciones rápidas
  actions = _aiGenerateActions(intent, ctx, findings);

  // 7. Generar pregunta de seguimiento
  followUp = _aiGenerateFollowUp(intent, findings, convLevel);

  // 8. Anti-repetición: si la respuesta es idéntica a la anterior, añadir variación
  if (_aiLastResponse.text === text && Date.now() - _aiLastResponse.ts < 300000) {
    text += '\n\n💡 _¿Querés que profundice en algún punto en particular?_';
  }

  // 9. Guardar en caché anti-repetición
  _aiLastResponse.text = text;
  _aiLastResponse.intent = intent;
  _aiLastResponse.ts = Date.now();

  return {
    text: text.trim(),
    actions: actions,
    followUp: followUp,
    sources: sources,
    confidence: confidence,
    hasFindings: findings.length > 0
  };
}

function _aiBuildEvidenceLine(bag) {
  if (!bag || !bag.sources) return '';
  var names = [];
  var used = {};
  for (var k in bag.sources) {
    if (!Object.prototype.hasOwnProperty.call(bag.sources, k)) continue;
    var src = bag.sources[k];
    if (!src || used[src]) continue;
    used[src] = true;
    names.push(src);
  }
  if (!names.length) return '';
  var label = names.join(', ');
  if (label.length > 80) label = label.substring(0, 77) + '...';
  return '_Fuentes consultadas: ' + label + '._';
}

// ─── RESPUESTAS POR INTENCIÓN (cuando no hay hallazgos) ───────

function _aiGenerateIntentResponse(intent, ctx, bag) {
  var responses = {
    hola: '¡Hola! Soy tu asistente de Mi Turno. Podés preguntarme sobre tus ingresos, proyecciones, recargos, descanso, o lo que necesités saber. ¿En qué te ayudo?',
    ayuda:
      'Puedo ayudarte con: tus ganancias del mes, proyección al cierre, análisis de recargos, cálculo de prestaciones, simulador de turnos, optimizador de horarios, y más. ¿Qué te interesa?',
    total_ganado:
      'Para ver tu total ganado necesito tus datos del mes. Si ya registraste turnos, decime "¿cuánto llevo este mes?" y te muestro el desglose completo.',
    proyeccion:
      'Para proyectar necesito tus turnos del mes. Una vez tengas algunos días registrados, puedo estimar cuánto ganarías al cierre del mes.',
    liquidacion:
      'Para calcular tu liquidación necesito tu salario base. Podés configurarlo en Ajustes o decirme "mi salario es de X pesos".',
    desconocido:
      'No tengo suficiente información para responder eso. ¿Podrías darme más detalles? Por ejemplo: "¿cuánto llevo este mes?" o "¿cómo va mi proyección?"'
  };

  return responses[intent] || responses.desconocido;
}

// ─── GENERADOR DE ACCIONES RÁPIDAS ────────────────────────────

function _aiGenerateActions(intent, ctx, findings) {
  var actions = [];

  // Acciones contextuales basadas en hallazgos
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    if (f.type === 'RISK' && f.source === 'calc.dias') {
      actions.push({ label: '¿Cuándo descanso?', query: '¿cuándo descanso?' });
    }
    if (f.type === 'OPPORTUNITY' && f.source === 'breakdown.recargo') {
      actions.push({ label: 'Ver próximos festivos', query: 'próximos festivos' });
    }
    if (f.type === 'TREND_DOWN') {
      actions.push({ label: '¿Cómo mejorar?', query: '¿cómo puedo ganar más?' });
    }
  }

  // Acciones estándar por intent
  var standardActions = {
    total_ganado: [
      { label: 'Ver proyección', query: 'proyección' },
      { label: 'Comparar con mes pasado', query: 'comparar con mes pasado' }
    ],
    proyeccion: [
      { label: 'Simular escenario', query: 'simular' },
      { label: 'Ver desglose', query: 'desglose' }
    ],
    distribucion: [
      { label: 'Ver recargos', query: 'recargos' },
      { label: 'Optimizar horarios', query: 'optimizar' }
    ],
    resumen: [
      { label: 'Ver proyección', query: 'proyección' },
      { label: 'Ver desglose', query: 'desglose' },
      { label: 'Compartir', query: 'compartir' }
    ],
    bienestar: [
      { label: 'Ver mi racha', query: 'racha' },
      { label: 'Optimizar descanso', query: 'optimizar descanso' }
    ]
  };

  var extras = standardActions[intent] || [];
  for (var j = 0; j < extras.length; j++) {
    // Evitar duplicados
    var dup = false;
    for (var k = 0; k < actions.length; k++) {
      if (actions[k].query === extras[j].query) dup = true;
    }
    if (!dup) actions.push(extras[j]);
  }

  // Limitar a 3 acciones máximo
  return actions.slice(0, 3);
}

// ─── GENERADOR DE FOLLOW-UP ───────────────────────────────────

function _aiGenerateFollowUp(intent, findings, convLevel) {
  // Si el usuario es nuevo (nivel 0), follow-up simple
  if (convLevel <= 0) {
    return '¿Querés que te explique algún número en detalle?';
  }

  // Follow-ups contextuales según hallazgos
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    if (f.type === 'TREND_DOWN') {
      return '¿Querés que te ayude a planificar cómo mejorar estos números?';
    }
    if (f.type === 'OPPORTUNITY') {
      return '¿Te gustaría que calcule un escenario optimista para este mes?';
    }
    if (f.type === 'ANOMALY') {
      return '¿Necesitás ayuda para corregir algún turno?';
    }
  }

  // Follow-ups por intent
  var followUps = {
    total_ganado: '¿Querés ver el desglose por tipo de recargo?',
    proyeccion: '¿Te gustaría simular diferentes escenarios?',
    distribucion: '¿Querés saber cuál es tu categoría de recargo más rentable?',
    resumen: '¿Necesitás algún detalle más específico?',
    liquidacion: '¿Querés ver también tus prestaciones sociales?',
    eficiencia: '¿Te gustaría comparar tu eficiencia con el mes pasado?',
    bienestar: '¿Querés que te recuerde cuándo fue tu último descanso?',
    legal: '¿Necesitás saber algo más sobre tus derechos laborales?'
  };

  return followUps[intent] || '¿Hay algo más en lo que te pueda ayudar?';
}

// ─── DETECTOR DE ALUCINACIONES ────────────────────────────────

/**
 * Verifica que una respuesta no contenga datos inventados.
 * Compara contra el contexto real del usuario.
 */
function aiValidateResponse(text, ctx) {
  var warnings = [];

  // 1. Verificar que no mencione valores que no están en el contexto
  var moneyPattern = /\$[\d,.]+|COP\s*[\d,.]+|[\d,]+\s*pesos/g;
  var matches = text.match(moneyPattern);
  if (matches && ctx) {
    for (var i = 0; i < matches.length; i++) {
      var valStr = matches[i].replace(/[^\d]/g, '');
      var val = parseInt(valStr, 10);
      // Si el valor no es 0 ni está cerca de los valores reales, advertir
      if (val > 0 && val !== ctx.totalCOP && val !== ctx.salario && val !== Math.round(ctx.proy)) {
        var cercaDeTotal = Math.abs(val - (ctx.totalCOP || 0)) < 1000;
        var cercaDeSalario = Math.abs(val - (ctx.salario || 0)) < 1000;
        var cercaDeProy = Math.abs(val - (ctx.proy || 0)) < 1000;
        if (!cercaDeTotal && !cercaDeSalario && !cercaDeProy) {
          warnings.push('Valor potencialmente inventado: ' + matches[i]);
        }
      }
    }
  }

  // 2. Verificar horas mencionadas
  var horaPattern = /(\d+)\s*(horas|h)\b/g;
  var hMatches = text.match(horaPattern);
  if (hMatches && ctx && ctx.totalMins) {
    var totalHoras = ctx.totalMins / 60;
    for (var j = 0; j < hMatches.length; j++) {
      var hVal = parseInt(hMatches[j].replace(/[^\d]/g, ''), 10);
      if (hVal > totalHoras * 3) {
        warnings.push('Horas potencialmente exageradas: ' + hMatches[j]);
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings: warnings
  };
}

// ─── LIMPIEZA DE RESPUESTA ────────────────────────────────────

/**
 * Limpia la respuesta de artefactos y la formatea para el chat.
 */
function aiPolishResponse(text) {
  // Quitar líneas vacías múltiples
  var lines = text.split('\n');
  var cleaned = [];
  var prevEmpty = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === '') {
      if (!prevEmpty) cleaned.push('');
      prevEmpty = true;
    } else {
      cleaned.push(line);
      prevEmpty = false;
    }
  }
  return cleaned.join('\n').trim();
}

// ─── RESET ────────────────────────────────────────────────────

function aiResponderReset() {
  _aiLastResponse = { text: '', intent: '', ts: 0 };
}

window.aiGenerateResponse = aiGenerateResponse;
window.aiValidateResponse = aiValidateResponse;
window.aiPolishResponse = aiPolishResponse;
window.aiResponderReset = aiResponderReset;
console.log('[MT] ai-responder.js cargado — Response Generator ✓');
